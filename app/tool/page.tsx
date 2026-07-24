"use client";
/*
THESIS: the workbench grades you — a draft is never "done", it is ON or OFF
STANDARD, and the page refuses the usual AI-writer arrangement of chat + regenerate.
OWN-WORLD: standards-office per DESIGN.md — paper ground, white bordered panels,
viridian actions, every governed value (rule IDs, verdicts, claims) in IBM Plex Mono.
STORY: pick a channel, generate from the constitution (or paste legacy copy),
watch deterministic checks mark violations inline, auto-fix flagged spans, ship
only when the stamp reads ON STANDARD.
FIRST VIEWPORT: constitution rail left (330px, claims open); workbench right —
channel tabs, brief, action row, draft panel; primary action "Generate to standard"
sits directly under the brief.
FORM: ported from reference prototype (brief-pinned layout; no concept roll).
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { CHANNEL_IDS, CONSTITUTION, type ChannelKey } from "@/lib/constitution";
import { compileSystemPrompt } from "@/lib/promptCompiler";
import { runChecks, type CheckResult } from "@/lib/runChecks";
import type { AuditVerdict } from "@/lib/audit";
import { saveRun } from "@/lib/runHistory";
import { GOLD_MINE } from "@/lib/demoPost";
import { ConstitutionPanel } from "@/components/ConstitutionPanel";
import { DraftEditor } from "@/components/DraftEditor";
import { Ledger } from "@/components/Ledger";

const CHANNEL_LABELS: Record<ChannelKey, string> = {
  linkedin: "LinkedIn post",
  email: "Outbound email",
  jd: "Job description",
  web: "Website copy",
};

const SAMPLE_BRIEFS: Record<ChannelKey, string> = {
  linkedin:
    "Rewrite our old 'gold mine' LinkedIn post to the standard: the point is that brand teams wait weeks for research while decisions happen in days, and Consuma closes that gap.",
  email:
    "Cold outbound to a Consumer Insights Manager at a mid-size beauty/skincare brand. Goal: get a demo booked. They currently run 6-8 week agency studies.",
  jd: "JD intro + responsibilities for a Growth Associate in the Founder's Office, Bengaluru. Emphasis on outbound experiments, demo pipeline, and content on the company standard.",
  web: "Homepage feature block introducing the Rapid Research Platform for consumer brand teams.",
};

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export default function ToolPage() {
  const [channel, setChannel] = useState<ChannelKey>("linkedin");
  const [brief, setBrief] = useState(SAMPLE_BRIEFS.linkedin);
  const [draft, setDraft] = useState("");
  const [report, setReport] = useState<CheckResult[] | null>(null);
  const [audit, setAudit] = useState<Record<string, AuditVerdict> | null>(null);
  const [lintKey, setLintKey] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [prevDraft, setPrevDraft] = useState<string | null>(null);
  const lastSavedText = useRef("");

  const systemPrompt = useMemo(() => compileSystemPrompt(channel), [channel]);
  const failCount = report?.filter((r) => !r.pass && r.severity === "fail").length ?? 0;

  const doLint = (text: string, ch: ChannelKey = channel) => {
    const results = runChecks(text, ch);
    setReport(results);
    setLintKey((k) => k + 1);
    // one history entry per distinct text — blur re-lints of the same draft don't flood /checks
    if (text !== lastSavedText.current) {
      lastSavedText.current = text;
      const fails = results.filter((r) => !r.pass && r.severity === "fail").length;
      const warns = results.filter((r) => !r.pass && r.severity === "warn").length;
      saveRun({
        ts: Date.now(),
        channel: ch,
        words: words(text),
        fails,
        warns,
        verdict: fails === 0 ? "ON STANDARD" : "OFF STANDARD",
      });
    }
    return results;
  };

  const pickChannel = (k: ChannelKey) => {
    if (k === channel) return;
    if (draft.trim() && !window.confirm("Switching channels clears the current draft. Continue?"))
      return;
    setChannel(k);
    setBrief(SAMPLE_BRIEFS[k]);
    setDraft("");
    setReport(null);
    setAudit(null);
    setPrevDraft(null);
  };

  const commitDraft = (text: string) => {
    if (!text.trim()) {
      setDraft("");
      setReport(null);
      setAudit(null);
      return;
    }
    setDraft(text);
    doLint(text);
  };

  const post = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  };

  const generate = async () => {
    setBusy("Generating from constitution…");
    setError("");
    setAudit(null);
    try {
      const { draft: out } = await post("/api/generate", { channel, brief });
      setDraft(out);
      doLint(out);
    } catch {
      setError("Generation failed — check the API key and try again.");
    }
    setBusy("");
  };

  const modelAudit = async () => {
    if (!draft) return;
    setBusy("Model audit (subjective rules)…");
    setError("");
    try {
      setAudit(await post("/api/audit", { channel, draft }));
    } catch {
      setError("Audit parse failed — run it again.");
    }
    setBusy("");
  };

  const autoFix = async () => {
    if (!draft || !report || failCount === 0) return;
    setBusy("Fixing flagged spans…");
    setError("");
    try {
      const violations = report
        .filter((r) => !r.pass && r.severity === "fail")
        .map((r) => ({
          id: r.id,
          label: r.label,
          detail: r.detail,
          offending: r.matches.map((m) => m.text).filter(Boolean),
        }));
      const { draft: out } = await post("/api/generate", { channel, draft, violations });
      setPrevDraft(draft);
      setDraft(out);
      doLint(out);
      setAudit(null);
    } catch {
      setError("Fix failed — try again.");
    }
    setBusy("");
  };

  const revertFix = () => {
    if (prevDraft === null) return;
    setDraft(prevDraft);
    doLint(prevDraft);
    setPrevDraft(null);
    setAudit(null);
  };

  const loadGoldMine = () => {
    setDraft(GOLD_MINE);
    doLint(GOLD_MINE);
  };

  // /tool?demo=gold — deep link used by the /checks empty state
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "gold") {
      setDraft(GOLD_MINE);
      doLint(GOLD_MINE, "linkedin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-5 px-5 py-5 pb-12 lg:grid-cols-[330px_1fr] lg:px-7">
      <div>
        <button
          onClick={() => setRailOpen((o) => !o)}
          aria-expanded={railOpen}
          className="mb-2 w-full rounded-[10px] border border-line bg-panel px-4 py-2.5 text-left text-[13px] font-semibold lg:hidden"
        >
          Brand Constitution {railOpen ? "−" : "+"}
        </button>
        <div className={`${railOpen ? "block" : "hidden"} lg:block lg:sticky lg:top-5`}>
          <ConstitutionPanel />
        </div>
      </div>

      <main className="flex min-w-0 flex-col gap-4">
        <h1 className="sr-only">Workbench — generate, lint and fix to the standard</h1>
        <div aria-label="Channel" className="flex flex-wrap gap-2">
          {(Object.keys(CHANNEL_LABELS) as ChannelKey[]).map((k) => (
            <button
              key={k}
              aria-pressed={channel === k}
              onClick={() => pickChannel(k)}
              className={`rounded-full border px-3.5 py-2.5 text-[13px] transition-colors ${
                channel === k
                  ? "border-viridian bg-viridian text-white"
                  : "border-line bg-panel text-ink hover:border-viridian/50"
              }`}
            >
              <span className="mr-1.5 font-mono text-[11px]">{CHANNEL_IDS[k]}</span>
              {CHANNEL_LABELS[k]}
            </button>
          ))}
        </div>

        <section className="flex flex-col gap-2.5 rounded-[10px] border border-line bg-panel p-4">
          <label
            htmlFor="brief"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Brief
          </label>
          <textarea
            id="brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            className="min-h-[84px] w-full resize-y rounded-lg border border-line bg-panel p-3 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={generate}
              disabled={!!busy}
              className="rounded-lg bg-viridian px-4.5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:bg-viridian-deep disabled:opacity-45"
            >
              Generate to standard
            </button>
            <button
              onClick={modelAudit}
              disabled={!draft || !!busy}
              className="rounded-lg border border-viridian bg-panel px-4.5 py-2.5 text-[13.5px] font-semibold text-viridian hover:bg-mint disabled:opacity-45"
            >
              Model audit (VX-2 + structure)
            </button>
            <button
              onClick={autoFix}
              disabled={!draft || failCount === 0 || !!busy}
              className="rounded-lg border border-viridian bg-panel px-4.5 py-2.5 text-[13.5px] font-semibold text-viridian hover:bg-mint disabled:opacity-45"
            >
              Auto-fix{failCount > 0 ? ` (${failCount})` : ""}
            </button>
            <span aria-live="polite" className="text-[12.5px] text-muted">
              {busy}
            </span>
            {prevDraft !== null && !busy && (
              <button
                onClick={revertFix}
                className="py-1.5 text-[12.5px] text-viridian underline underline-offset-2"
              >
                Revert last fix
              </button>
            )}
            {error && (
              <span role="alert" className="text-[13px] text-violation">
                {error}
              </span>
            )}
            <button
              onClick={() => setShowPrompt((s) => !s)}
              aria-expanded={showPrompt}
              className="ml-auto py-1.5 text-[12.5px] text-viridian underline underline-offset-2"
            >
              {showPrompt ? "Hide" : "View"} compiled instructions
            </button>
          </div>
          {showPrompt && (
            <div className="rounded-lg border border-line bg-paper">
              <p className="border-b border-line px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-muted">
                Compiled from brand_constitution.json v{CONSTITUTION.meta.version} — the model
                receives exactly this
              </p>
              <pre className="max-h-[280px] overflow-auto whitespace-pre-wrap px-4 py-3.5 font-mono text-[11.5px] leading-[1.5] text-ink/85">
                {systemPrompt}
              </pre>
            </div>
          )}
        </section>

        <section className="rounded-[10px] border border-line bg-panel">
          <h2 className="px-4 pt-3.5 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Draft {report && "· violations marked inline"}
          </h2>
          <DraftEditor draft={draft} report={report} onCommit={commitDraft} />
          {!draft && (
            <div className="px-4 pb-4">
              <button
                onClick={loadGoldMine}
                className="py-1.5 text-left text-[12.5px] text-viridian underline underline-offset-2"
              >
                Load the audit&apos;s real &quot;gold mine&quot; post to see the linter catch it
              </button>
            </div>
          )}
        </section>

        {report && <Ledger results={report} audit={audit} lintKey={lintKey} />}
      </main>
    </div>
  );
}
