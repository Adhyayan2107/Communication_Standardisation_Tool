import type { ChannelKey, Claim, Constitution, VoiceRule } from "./constitution";
import { CHANNEL_IDS } from "./constitution";

export type CheckStatus = "active" | "planned";

export interface Match {
  start: number;
  end: number;
  text: string;
}

export interface Check {
  id: string;
  label: string;
  group: "identity" | "claims" | "voice" | "cta" | "channel";
  status: CheckStatus;
  severity: "fail" | "warn";
  description: string;
  run?: (text: string, channel: ChannelKey, c: Constitution) => Match[];
  /** Dynamic ledger detail; falls back to `description`. Keeps canonical values in the JSON, not here. */
  detail?: (text: string, channel: ChannelKey, c: Constitution) => string;
  /** Channel-scoped checks run (and appear in the ledger) only on this channel. */
  appliesTo?: ChannelKey;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function findAll(text: string, pattern: string, flags = "gi"): Match[] {
  const re = new RegExp(pattern, flags);
  const out: Match[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}

/** Structural violations (length, missing CTA) have no offending span; a zero-length
    match marks the failure and the highlighter skips it. */
const STRUCTURAL: Match[] = [{ start: 0, end: 0, text: "" }];

/** The JSON annotates some forbidden strings, e.g. "months (unqualified)".
    Match on the string with its trailing annotation stripped. */
const stripAnnotation = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, "");

const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

const claim = (c: Constitution, id: string) => c.claims_registry[id] as Claim;

const claimCheck = (id: string, label: string): Check => ({
  id,
  label,
  group: "claims",
  status: "active",
  severity: "fail",
  description: `Only the canonical ${id} value may appear; every retired variant fails.`,
  run: (t, _ch, c) =>
    (claim(c, id).forbidden ?? []).flatMap((f) => findAll(t, esc(stripAnnotation(f)))),
  detail: (_t, _ch, c) => `Retired variant → use "${claim(c, id).canonical}".`,
});

const lengthCheck = (key: ChannelKey, label: string, lo: number, hi: number): Check => ({
  id: CHANNEL_IDS[key],
  label,
  group: "channel",
  status: "active",
  severity: "warn",
  description: `${label} target: ${lo ? `${lo}–${hi}` : `≤ ${hi}`} words.`,
  appliesTo: key,
  run: (t) => {
    const wc = wordCount(t);
    return wc >= lo && wc <= hi ? [] : STRUCTURAL;
  },
  detail: (t) => `${label} target: ${lo ? `${lo}–${hi}` : `≤ ${hi}`} words (found ${wordCount(t)}).`,
});

export const CHECK_GROUPS = ["identity", "claims", "voice", "cta", "channel"] as const;

/** The /checks registry grid renders from this alone — appending a Check to
    CHECKS is the only edit a new check ever needs. */
export function groupedChecks(checks: Check[] = CHECKS): [Check["group"], Check[]][] {
  return CHECK_GROUPS.map((g) => [g, checks.filter((c) => c.group === g)] as [Check["group"], Check[]]).filter(
    ([, list]) => list.length > 0
  );
}

export const CHECKS: Check[] = [
  {
    id: "ID-1",
    label: "Name hygiene",
    group: "identity",
    status: "active",
    severity: "fail",
    description: "'Consuma.ai' and 'consuma_ai' are never a name in prose.",
    run: (t) => findAll(t, "Consuma\\s?\\.\\s?ai|consuma_ai"),
    detail: (_t, _ch, c) => `'Consuma.ai' in prose → use '${c.identity["ID-1"].canonical}'.`,
  },
  {
    id: "ID-3",
    label: "Product naming",
    group: "identity",
    status: "active",
    severity: "fail",
    description: "'AI Engine' is retired; the product is the Rapid Research Platform.",
    run: (t) => findAll(t, "AI\\s?Engine"),
    detail: (_t, _ch, c) => `'AI Engine' is retired → '${c.identity["ID-3"].canonical}'.`,
  },
  claimCheck("CL-1", "Claim · speed"),
  claimCheck("CL-2", "Claim · baseline"),
  claimCheck("CL-3", "Claim · accuracy"),
  claimCheck("CL-4", "Claim · data scale"),
  claimCheck("CL-5", "Claim · client proof"),
  {
    id: "VX-1",
    label: "Sentence length",
    group: "voice",
    status: "active",
    severity: "fail",
    description: "No sentence over 28 words.",
    run: (t) => {
      const sentences = t.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
      const out: Match[] = [];
      let cursor = 0;
      for (const s of sentences) {
        const idx = t.indexOf(s, cursor);
        if (s.split(/\s+/).length > 28) out.push({ start: idx, end: idx + s.length, text: s });
        cursor = idx + s.length;
      }
      return out;
    },
  },
  {
    id: "VX-3",
    label: "Banned lexicon",
    group: "voice",
    status: "active",
    severity: "fail",
    description: "Specifics over superlatives; the banned lexicon fails in all channels.",
    run: (t, _ch, c) =>
      ((c.voice["VX-3"] as VoiceRule).banned ?? []).flatMap((w) =>
        findAll(t, `\\b${esc(w)}\\b`)
      ),
    detail: () => "Replace with a specific, literal statement.",
  },
  {
    id: "VX-4",
    label: "Emojis",
    group: "voice",
    status: "active",
    severity: "fail",
    description: "No emojis in any channel.",
    run: (t) => findAll(t, "[\\u{1F300}-\\u{1FAFF}\\u{2190}-\\u{2BFF}\\u{FE0F}]", "gu"),
  },
  {
    id: "VX-5",
    label: "Hashtags",
    group: "voice",
    status: "active",
    severity: "fail",
    description: "No hashtags except LinkedIn, where a maximum of 2 is permitted.",
    run: (t, ch) => {
      const tags = findAll(t, "#\\w+");
      const limit = ch === "linkedin" ? 2 : 0;
      return tags.length > limit ? tags.slice(limit) : [];
    },
    detail: (t, ch) =>
      `Limit: ${ch === "linkedin" ? 2 : 0} on this channel (found ${findAll(t, "#\\w+").length}).`,
  },
  {
    id: "VX-6",
    label: "Punctuation hygiene",
    group: "voice",
    status: "active",
    severity: "fail",
    description: "No space before punctuation; maximum one exclamation mark.",
    run: (t) => {
      const spaceBefore = findAll(t, "\\s+[!?;:,](?!\\S)");
      const excls = findAll(t, "!");
      return [...spaceBefore, ...(excls.length > 1 ? excls.slice(1) : [])];
    },
  },
  {
    id: "CH-CTA",
    label: "CTA hierarchy",
    group: "cta",
    status: "active",
    severity: "fail",
    description: "Only the two registered CTA strings may appear.",
    run: (t, _ch, c) =>
      c.cta["CH-CTA"].forbidden.flatMap((f) => findAll(t, esc(f))),
    detail: (_t, _ch, c) => `Only ${c.cta["CH-CTA"].allowed.map((a) => `'${a}'`).join(" / ")}.`,
  },
  {
    id: "CH-CTA*",
    label: "Approved CTA present",
    group: "cta",
    status: "active",
    severity: "warn",
    description: "The piece should close with one approved CTA.",
    run: (t, _ch, c) =>
      c.cta["CH-CTA"].allowed.some((a) => t.toLowerCase().includes(a.toLowerCase()))
        ? []
        : STRUCTURAL,
    detail: (t, _ch, c) =>
      c.cta["CH-CTA"].allowed.some((a) => t.toLowerCase().includes(a.toLowerCase()))
        ? "Found."
        : "No approved CTA found in the piece.",
  },
  lengthCheck("linkedin", "LinkedIn length", 80, 150),
  lengthCheck("email", "Email length", 0, 120),
  lengthCheck("jd", "JD length", 0, 260),
  lengthCheck("web", "Web copy length", 0, 120),

  // ---- planned: appear on /checks as "Coming soon", run nowhere ----
  {
    id: "ID-2v",
    label: "Descriptor verbatim",
    group: "identity",
    status: "planned",
    severity: "fail",
    description: "The ID-2 descriptor appears verbatim on channels that require it.",
  },
  {
    id: "CL-7",
    label: "Claim-source freshness",
    group: "claims",
    status: "planned",
    severity: "warn",
    description: "Every registry number is younger than 12 months.",
  },
  {
    id: "CH-SUBJ",
    label: "Email subject length",
    group: "channel",
    status: "planned",
    severity: "fail",
    description: "Email subject line is 7 words or fewer.",
  },
  {
    id: "TONE-READ",
    label: "Reading grade",
    group: "voice",
    status: "planned",
    severity: "warn",
    description: "Copy stays inside the target reading-grade band.",
  },
  {
    id: "RPT-QA",
    label: "Report output consistency",
    group: "channel",
    status: "planned",
    severity: "fail",
    description:
      "Enforces base-N sample size stated once and consistent across slides, category labels locked (same concept cannot appear under different names at different percentages), uniform number formatting (consistent decimal precision), and no source-context mislabelling (e.g. gaming conversations presented as brand-loyalty insight). Extends the standard from marketing copy into the product's generated reports.",
  },
];
