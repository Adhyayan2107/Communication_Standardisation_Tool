import React, { useState, useMemo } from "react";

/* ============================================================
   CONSUMA COMMUNICATION STANDARDISATION TOOL
   Two-stage agent:
     Stage 1 — generate strictly from the Brand Constitution
     Stage 2a — deterministic linter (rules live in THIS code,
                not in the model)
     Stage 2b — model audit for the two subjective rules only
     Stage 3 — auto-fix flagged spans, then re-lint
   ============================================================ */

const CONSTITUTION = {
  meta: { name: "Consuma Brand Constitution", version: "1.0", date: "2026-07-24" },
  identity: {
    "ID-1": { rule: "Company name is 'Consuma' in body copy. 'Consuma.ai' is a URL, never a name." },
    "ID-2": {
      rule: "One-line descriptor used verbatim in bios, boilerplate, JD intros.",
      canonical:
        "Consuma is an AI-powered rapid research platform that turns a research brief into a decision-ready consumer insights report in under 30 minutes.",
    },
    "ID-3": { rule: "Product = 'Rapid Research Platform' (first mention), 'the platform' after. Never 'AI Engine'." },
  },
  claims: {
    "CL-1": { dim: "Speed", canonical: "under 30 minutes", forbidden: ["within seconds", "in seconds", "just minutes", "5-15 minutes", "5\u201315 minutes", "speed of light"] },
    "CL-2": { dim: "Baseline", canonical: "6\u20138 weeks", forbidden: ["4-6 weeks", "4\u20136 weeks", "2-3 months", "2\u20133 months"] },
    "CL-3": { dim: "Accuracy", canonical: "87% proven accuracy vs secondary research", forbidden: ["87-94%", "87\u201394%", "10x the precision"] },
    "CL-4": { dim: "Data scale", canonical: "5B+ datapoints", forbidden: ["5M-10B", "5M \u2013 10B", "1000x more data", "quintillion", "millions of data points"] },
    "CL-5": { dim: "Client proof", canonical: "30+ brands incl. Godrej, Britannia, Foxtale, Mosaic Wellness", forbidden: ["35+ global brands", "Mosiac"] },
  },
  voice: {
    "VX-1": { rule: "No sentence over 28 words; average \u2264 18." },
    "VX-2": { rule: "Max one metaphor/analogy per piece.", subjective: true },
    "VX-3": {
      rule: "Banned lexicon (specifics over superlatives).",
      banned: ["unlock", "embrace", "game-changing", "game changing", "revolutionize", "revolutionise", "cutting-edge", "cutting edge", "dive into", "gold mine", "goldmine", "unparalleled", "meet the future", "supercharge", "next-level"],
    },
    "VX-4": { rule: "No emojis." },
    "VX-5": { rule: "No hashtags, except \u2264 2 topic tags on LinkedIn." },
    "VX-6": { rule: "No space before punctuation; \u2264 1 exclamation mark." },
  },
  cta: {
    "CH-CTA": {
      rule: "Only two CTAs exist.",
      allowed: ["Book a demo", "Download the report"],
      forbidden: ["Book a Free Demo", "Get in touch", "Click, discover, strategize", "Join the #ResearchRevolution", "Learn more"],
    },
  },
  channels: {
    linkedin: { id: "CH-LI", label: "LinkedIn post", words: [80, 150], rule: "Insight-first: open with a finding, never with the company. 80\u2013150 words. One CTA. \u2264 2 hashtags.", subjective: "Opens with a specific finding or sharp observation, not with Consuma." },
    email: { id: "CH-EM", label: "Outbound email", words: [0, 120], rule: "One idea, one CTA, body under 120 words. Subject \u2264 7 words. Descriptor verbatim if company is introduced.", subjective: "Carries exactly one idea; descriptor ID-2 appears verbatim if the company is introduced." },
    jd: { id: "CH-JD", label: "Job description", words: [0, 260], rule: "Mission line = descriptor ID-2 verbatim. Responsibilities as outcomes. Ends with 'How we work'.", subjective: "Responsibilities are outcomes (own/ship/report), not activities; includes a 'How we work' block." },
    web: { id: "CH-WEB", label: "Website copy", words: [0, 120], rule: "Credible B2B register. Registry claims only. Headline \u2264 8 words.", subjective: "Headline states a benefit in 8 words or fewer; no hype register." },
  },
};

/* ---------- Stage 1: compile explicit instructions ---------- */
function compileSystemPrompt(channelKey) {
  const c = CONSTITUTION;
  const ch = c.channels[channelKey];
  const claims = Object.entries(c.claims)
    .map(([id, v]) => `  ${id} ${v.dim}: use exactly "${v.canonical}". Forbidden variants: ${v.forbidden.join("; ")}.`)
    .join("\n");
  return `You are Consuma's content generator. You do not decide the standard; you execute the Brand Constitution v${c.meta.version} below. Violating any rule is a failed output.

IDENTITY
  ID-1 ${c.identity["ID-1"].rule}
  ID-2 Descriptor (verbatim when required): "${c.identity["ID-2"].canonical}"
  ID-3 ${c.identity["ID-3"].rule}

CLAIMS REGISTRY \u2014 the ONLY numbers permitted anywhere:
${claims}
  CL-6 No other quantitative claim may appear. Do not invent statistics, findings, or client names.

VOICE
  VX-1 ${c.voice["VX-1"].rule}
  VX-2 ${c.voice["VX-2"].rule}
  VX-3 Banned words (never use): ${c.voice["VX-3"].banned.join(", ")}.
  VX-4 ${c.voice["VX-4"].rule}
  VX-5 ${c.voice["VX-5"].rule}
  VX-6 ${c.voice["VX-6"].rule}
  Register: the founder's press voice \u2014 sharp, specific, contrarian, plain. Short declarative sentences.

CTA
  CH-CTA Only "Book a demo" (primary) or "Download the report" (secondary). Never: ${c.cta["CH-CTA"].forbidden.join("; ")}.

CHANNEL \u2014 ${ch.id} (${ch.label})
  ${ch.rule}

OUTPUT: plain text of the content piece only. No preamble, no markdown headers, no commentary.`;
}

/* ---------- Stage 2a: deterministic linter (rules in code) ---------- */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function findAll(text, pattern, flags = "gi") {
  const re = new RegExp(pattern, flags);
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}

function lint(text, channelKey) {
  const c = CONSTITUTION;
  const ch = c.channels[channelKey];
  const results = [];
  const add = (id, label, matches, detail, warn = false) =>
    results.push({ id, label, pass: matches.length === 0, matches, detail, warn });

  add("ID-1", "Name hygiene", findAll(text, "Consuma\\s?\\.\\s?ai|consuma_ai"), "'Consuma.ai' in prose \u2192 use 'Consuma'.");
  add("ID-3", "Product naming", findAll(text, "AI\\s?Engine"), "'AI Engine' is retired \u2192 'Rapid Research Platform'.");

  Object.entries(c.claims).forEach(([id, v]) => {
    const hits = v.forbidden.flatMap((f) => findAll(text, esc(f)));
    add(id, `Claim \u00b7 ${v.dim}`, hits, `Retired variant \u2192 use "${v.canonical}".`);
  });

  const banned = c.voice["VX-3"].banned.flatMap((w) => findAll(text, `\\b${esc(w)}\\b`));
  add("VX-3", "Banned lexicon", banned, "Replace with a specific, literal statement.");

  add("VX-4", "Emojis", findAll(text, "[\\u{1F300}-\\u{1FAFF}\\u{2190}-\\u{2BFF}\\u{FE0F}]", "gu"), "Emojis are banned in all channels.");

  const tags = findAll(text, "#[A-Za-z0-9_]+");
  const tagLimit = channelKey === "linkedin" ? 2 : 0;
  add("VX-5", "Hashtags", tags.length > tagLimit ? tags.slice(tagLimit) : [], `Limit: ${tagLimit} on this channel (found ${tags.length}).`);

  const spaceBefore = findAll(text, "\\s+[!?;:,](?!\\S)");
  const excls = findAll(text, "!");
  add("VX-6", "Punctuation hygiene", [...spaceBefore, ...(excls.length > 1 ? excls.slice(1) : [])], "No space before punctuation; max one '!'.");

  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const overlong = [];
  let cursor = 0;
  for (const s of sentences) {
    const idx = text.indexOf(s, cursor);
    if (s.split(/\s+/).length > 28) overlong.push({ start: idx, end: idx + s.length, text: s.slice(0, 40) + "\u2026" });
    cursor = idx + s.length;
  }
  add("VX-1", "Sentence length", overlong, "No sentence over 28 words.");

  const forbCta = c.cta["CH-CTA"].forbidden.flatMap((f) => findAll(text, esc(f)));
  add("CH-CTA", "CTA hierarchy", forbCta, "Only 'Book a demo' / 'Download the report'.");
  const hasCta = c.cta["CH-CTA"].allowed.some((a) => text.toLowerCase().includes(a.toLowerCase()));
  results.push({ id: "CH-CTA*", label: "Approved CTA present", pass: hasCta, matches: [], detail: hasCta ? "Found." : "No approved CTA found in the piece.", warn: !hasCta });

  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  const [lo, hi] = ch.words;
  const wordsOk = wc >= lo && wc <= hi;
  results.push({ id: ch.id, label: `Length (${wc} words)`, pass: wordsOk, matches: [], detail: `${ch.label} target: ${lo ? lo + "\u2013" : "\u2264 "}${hi} words.`, warn: !wordsOk });

  return results;
}

/* ---------- API helper ---------- */
async function callClaude(system, user, maxTokens = 1000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

/* ---------- UI ---------- */
const SAMPLE_BRIEFS = {
  linkedin: "Rewrite our old 'gold mine' LinkedIn post to the standard: the point is that brand teams wait weeks for research while decisions happen in days, and Consuma closes that gap.",
  email: "Cold outbound to a Consumer Insights Manager at a mid-size beauty/skincare brand. Goal: get a demo booked. They currently run 6\u20138 week agency studies.",
  jd: "JD intro + responsibilities for a Growth Associate in the Founder's Office, Bengaluru. Emphasis on outbound experiments, demo pipeline, and content on the company standard.",
  web: "Homepage feature block introducing the Rapid Research Platform for consumer brand teams.",
};

export default function App() {
  const [channel, setChannel] = useState("linkedin");
  const [brief, setBrief] = useState(SAMPLE_BRIEFS.linkedin);
  const [draft, setDraft] = useState("");
  const [report, setReport] = useState(null);
  const [audit, setAudit] = useState(null);
  const [busy, setBusy] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [openGroups, setOpenGroups] = useState({ claims: true });
  const [error, setError] = useState("");

  const systemPrompt = useMemo(() => compileSystemPrompt(channel), [channel]);

  const pickChannel = (k) => {
    setChannel(k);
    setBrief(SAMPLE_BRIEFS[k]);
    setDraft(""); setReport(null); setAudit(null);
  };

  const runLint = (text) => setReport(lint(text, channel));

  const generate = async () => {
    setBusy("Generating from constitution\u2026"); setError(""); setAudit(null);
    try {
      const out = await callClaude(systemPrompt, `Brief: ${brief}`);
      setDraft(out);
      setReport(lint(out, channel));
    } catch (e) { setError("Generation failed \u2014 try again."); }
    setBusy("");
  };

  const modelAudit = async () => {
    if (!draft) return;
    setBusy("Model audit (subjective rules)\u2026"); setError("");
    try {
      const ch = CONSTITUTION.channels[channel];
      const sys = `You are a compliance auditor. Judge ONLY these two rules. Respond with raw JSON only, no markdown: {"VX-2":{"pass":bool,"note":"<12 words"},"${ch.id}":{"pass":bool,"note":"<12 words"}}`;
      const usr = `Rules:\nVX-2: ${CONSTITUTION.voice["VX-2"].rule}\n${ch.id}: ${ch.subjective}\n\nText:\n${draft}`;
      const raw = await callClaude(sys, usr, 300);
      setAudit(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch (e) { setError("Audit parse failed \u2014 run again."); }
    setBusy("");
  };

  const autoFix = async () => {
    if (!draft || !report) return;
    const fails = report.filter((r) => !r.pass && !r.warn);
    if (fails.length === 0) return;
    setBusy("Fixing flagged spans\u2026"); setError("");
    try {
      const list = fails.map((r) => `${r.id} ${r.label}: ${r.detail} Offending: ${r.matches.map((m) => `"${m.text}"`).join(", ") || "(structural)"}`).join("\n");
      const out = await callClaude(
        systemPrompt,
        `The draft below failed these constitution rules:\n${list}\n\nRewrite the draft correcting ONLY these violations. Keep everything compliant unchanged. Output the corrected piece only.\n\nDRAFT:\n${draft}`
      );
      setDraft(out);
      setReport(lint(out, channel));
      setAudit(null);
    } catch (e) { setError("Fix failed \u2014 try again."); }
    setBusy("");
  };

  /* inline violation highlighting */
  const rendered = useMemo(() => {
    if (!draft) return null;
    if (!report) return draft;
    const marks = report.filter((r) => !r.pass).flatMap((r) => r.matches.map((m) => ({ ...m, id: r.id })));
    marks.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const m of marks) {
      const last = merged[merged.length - 1];
      if (last && m.start < last.end) last.end = Math.max(last.end, m.end);
      else merged.push({ ...m });
    }
    const segs = [];
    let i = 0;
    merged.forEach((m, k) => {
      if (m.start > i) segs.push(<span key={"t" + k}>{draft.slice(i, m.start)}</span>);
      segs.push(
        <mark key={"m" + k} className="vio">
          {draft.slice(m.start, m.end)}
          <span className="viochip">{m.id}</span>
        </mark>
      );
      i = m.end;
    });
    if (i < draft.length) segs.push(<span key="tail">{draft.slice(i)}</span>);
    return segs;
  }, [draft, report]);

  const failCount = report ? report.filter((r) => !r.pass && !r.warn).length : 0;
  const warnCount = report ? report.filter((r) => !r.pass && r.warn).length : 0;

  const ruleGroups = [
    { key: "identity", title: "Identity", rows: Object.entries(CONSTITUTION.identity).map(([id, v]) => [id, v.canonical || v.rule]) },
    { key: "claims", title: "Claims registry \u00b7 locked", rows: Object.entries(CONSTITUTION.claims).map(([id, v]) => [id, `${v.dim}: ${v.canonical}`]) },
    { key: "voice", title: "Voice", rows: Object.entries(CONSTITUTION.voice).map(([id, v]) => [id, v.rule]) },
    { key: "cta", title: "CTA hierarchy", rows: [["CH-CTA", "Book a demo (primary) \u00b7 Download the report (secondary). Nothing else."]] },
  ];

  return (
    <div className="root">
      <style>{`
        .root { min-height:100vh; background:#F1F3F0; color:#16211C; font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
        .mono { font-family:ui-monospace,'SF Mono','Cascadia Code',Menlo,Consolas,monospace; }
        header.bar { background:#0D5C48; color:#EDF5F1; padding:18px 28px; display:flex; align-items:baseline; gap:16px; flex-wrap:wrap; }
        .bar h1 { font-size:17px; margin:0; letter-spacing:.02em; font-weight:700; }
        .bar .sub { font-size:12px; opacity:.75; letter-spacing:.14em; text-transform:uppercase; }
        .bar .ver { margin-left:auto; font-size:11px; opacity:.8; }
        .wrap { display:grid; grid-template-columns:330px 1fr; gap:20px; padding:20px 28px 48px; max-width:1240px; margin:0 auto; }
        @media (max-width:900px){ .wrap { grid-template-columns:1fr; } }
        .panel { background:#FFFFFF; border:1px solid #DDE2DC; border-radius:10px; }
        .panel h2 { font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#5C6660; margin:0; padding:14px 16px 10px; }
        .grp { border-top:1px solid #EAEDE8; }
        .grp button.hd { width:100%; text-align:left; background:none; border:none; padding:11px 16px; font-size:13px; font-weight:650; color:#16211C; cursor:pointer; display:flex; justify-content:space-between; }
        .grp .rows { padding:0 16px 12px; }
        .rule { display:flex; gap:10px; padding:6px 0; font-size:12.5px; line-height:1.45; color:#333B36; border-top:1px dashed #EDF0EB; }
        .chip { flex:none; font-size:10.5px; padding:1px 6px; border:1px solid #0D5C48; color:#0D5C48; border-radius:4px; height:fit-content; }
        .work { display:flex; flex-direction:column; gap:16px; }
        .tabs { display:flex; gap:8px; flex-wrap:wrap; }
        .tabs button { border:1px solid #C9D1C9; background:#fff; color:#16211C; padding:8px 14px; border-radius:999px; font-size:13px; cursor:pointer; }
        .tabs button.on { background:#0D5C48; border-color:#0D5C48; color:#fff; }
        textarea { width:100%; box-sizing:border-box; border:1px solid #C9D1C9; border-radius:8px; padding:12px; font-size:14px; min-height:84px; resize:vertical; background:#fff; font-family:inherit; }
        .btns { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .btn { border:none; border-radius:8px; padding:10px 18px; font-size:13.5px; font-weight:650; cursor:pointer; }
        .btn.pri { background:#0D5C48; color:#fff; }
        .btn.sec { background:#fff; color:#0D5C48; border:1px solid #0D5C48; }
        .btn:disabled { opacity:.45; cursor:default; }
        .busy { font-size:12.5px; color:#5C6660; }
        .draft { padding:18px; font-size:14.5px; line-height:1.65; white-space:pre-wrap; }
        mark.vio { background:#FBE4E2; color:#8F1D16; border-bottom:2px solid #B3261E; border-radius:2px; padding:0 1px; position:relative; }
        .viochip { font-family:ui-monospace,Menlo,monospace; font-size:9.5px; background:#B3261E; color:#fff; border-radius:3px; padding:0 3px; margin-left:3px; vertical-align:super; }
        .ledger { border-collapse:collapse; width:100%; font-size:12.5px; }
        .ledger td { border-top:1px solid #EAEDE8; padding:7px 16px; vertical-align:top; }
        .st { font-weight:700; }
        .pass { color:#0D5C48; } .fail { color:#B3261E; } .warn { color:#8A6A00; }
        .sumline { padding:12px 16px; font-size:13px; display:flex; gap:16px; align-items:center; border-top:1px solid #EAEDE8; }
        .stamp { margin-left:auto; border:2px solid; border-radius:6px; padding:3px 10px; font-weight:800; letter-spacing:.08em; font-size:12px; transform:rotate(-2deg); }
        .stamp.ok { color:#0D5C48; border-color:#0D5C48; }
        .stamp.no { color:#B3261E; border-color:#B3261E; }
        pre.sys { margin:0; padding:14px 16px; font-size:11.5px; line-height:1.5; white-space:pre-wrap; color:#333B36; max-height:280px; overflow:auto; }
        .err { color:#B3261E; font-size:13px; }
        .empty { padding:24px 18px; color:#5C6660; font-size:13.5px; }
        .toggle { background:none; border:none; color:#0D5C48; font-size:12.5px; cursor:pointer; text-decoration:underline; padding:0; }
      `}</style>

      <header className="bar">
        <h1>Consuma · Communication Standardisation Tool</h1>
        <span className="sub">generate → lint → fix</span>
        <span className="ver mono">Constitution v{CONSTITUTION.meta.version} · {CONSTITUTION.meta.date}</span>
      </header>

      <div className="wrap">
        {/* Constitution panel */}
        <aside className="panel">
          <h2>Brand Constitution (the standard)</h2>
          {ruleGroups.map((g) => (
            <div className="grp" key={g.key}>
              <button className="hd" onClick={() => setOpenGroups((o) => ({ ...o, [g.key]: !o[g.key] }))}>
                {g.title} <span>{openGroups[g.key] ? "\u2212" : "+"}</span>
              </button>
              {openGroups[g.key] && (
                <div className="rows">
                  {g.rows.map(([id, txt]) => (
                    <div className="rule" key={id}>
                      <span className="chip mono">{id}</span>
                      <span>{txt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="grp" style={{ padding: "12px 16px", fontSize: 12, color: "#5C6660" }}>
            The linter below runs from these rules as code — the model never judges the objective checks.
          </div>
        </aside>

        {/* Workbench */}
        <main className="work">
          <div className="tabs">
            {Object.entries(CONSTITUTION.channels).map(([k, v]) => (
              <button key={k} className={channel === k ? "on" : ""} onClick={() => pickChannel(k)}>
                <span className="mono" style={{ fontSize: 11, marginRight: 6 }}>{v.id}</span>{v.label}
              </button>
            ))}
          </div>

          <div className="panel" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#5C6660" }}>Brief</label>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} />
            <div className="btns">
              <button className="btn pri" onClick={generate} disabled={!!busy}>Generate to standard</button>
              <button className="btn sec" onClick={modelAudit} disabled={!draft || !!busy}>Model audit (VX-2 + structure)</button>
              <button className="btn sec" onClick={autoFix} disabled={!draft || failCount === 0 || !!busy}>Auto-fix {failCount > 0 ? `(${failCount})` : ""}</button>
              {busy && <span className="busy">{busy}</span>}
              {error && <span className="err">{error}</span>}
              <button className="toggle" style={{ marginLeft: "auto" }} onClick={() => setShowPrompt((s) => !s)}>
                {showPrompt ? "Hide" : "View"} compiled instructions
              </button>
            </div>
            {showPrompt && <pre className="sys mono panel">{systemPrompt}</pre>}
          </div>

          <div className="panel">
            <h2>Draft {report && "\u00b7 violations marked inline"}</h2>
            {draft ? (
              <div className="draft" onBlur={(e) => { const t = e.target.innerText; setDraft(t); runLint(t); }} contentEditable suppressContentEditableWarning>
                {rendered}
              </div>
            ) : (
              <div className="empty">No draft yet. Pick a channel, keep or edit the brief, then Generate — or paste existing copy here to lint it.</div>
            )}
            {!draft && (
              <div style={{ padding: "0 16px 16px" }}>
                <button className="toggle" onClick={() => { const t = "Unlock unparalleled market intelligence with Consuma ! \ud83d\ude80 Tap into the infinite gold mine at your fingertips. Get insights within seconds. Click, discover, strategize. #Consuma #MarketInsights #BusinessIntelligence #DataDrivenSuccess"; setDraft(t); setReport(lint(t, channel)); }}>
                  Load the audit's real "gold mine" post to see the linter catch it
                </button>
              </div>
            )}
          </div>

          {report && (
            <div className="panel">
              <h2>Compliance ledger · Stage 2a (deterministic)</h2>
              <table className="ledger">
                <tbody>
                  {report.map((r, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ width: 72, color: "#0D5C48" }}>{r.id}</td>
                      <td style={{ width: 170 }}>{r.label}</td>
                      <td className={`st mono ${r.pass ? "pass" : r.warn ? "warn" : "fail"}`} style={{ width: 60 }}>
                        {r.pass ? "PASS" : r.warn ? "WARN" : "FAIL"}
                      </td>
                      <td style={{ color: "#5C6660" }}>
                        {!r.pass && r.matches.length > 0 && <span className="mono" style={{ color: "#B3261E" }}>{r.matches.slice(0, 4).map((m) => `"${m.text}"`).join(" · ")} — </span>}
                        {r.detail}
                      </td>
                    </tr>
                  ))}
                  {audit && Object.entries(audit).map(([id, v]) => (
                    <tr key={id}>
                      <td className="mono" style={{ color: "#0D5C48" }}>{id}</td>
                      <td>Model audit</td>
                      <td className={`st mono ${v.pass ? "pass" : "fail"}`}>{v.pass ? "PASS" : "FAIL"}</td>
                      <td style={{ color: "#5C6660" }}>{v.note} <em>(subjective rule — judged by model, Stage 2b)</em></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="sumline">
                <span><b className="mono fail">{failCount}</b> fail</span>
                <span><b className="mono warn">{warnCount}</b> warn</span>
                <span><b className="mono pass">{report.length - failCount - warnCount}</b> pass</span>
                <span className={`stamp mono ${failCount === 0 ? "ok" : "no"}`}>{failCount === 0 ? "ON STANDARD" : "OFF STANDARD"}</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
