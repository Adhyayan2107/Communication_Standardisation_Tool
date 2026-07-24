# CLAUDE.md — Consuma Communication Standardisation Tool

## What this project is

A two-stage content-governance web app for Consuma (AI market research startup, consuma.ai).
It generates on-brand content (LinkedIn posts, outbound emails, job descriptions, website copy)
strictly from a machine-readable **Brand Constitution**, then validates every draft with a
**deterministic check registry written in code**. The model executes the standard; it never
defines it.

Built for a Founder's Office assignment (Task 1: Communication Standardisation Tool).
The evaluation criterion: "how precisely you can model a standard and instruct a system to
follow it, rather than prompting loosely and accepting whatever comes back."
Every decision below serves that criterion. Do not dilute it.

Deployment target: **Vercel** (production). This constrains the stack — see below.

## Non-negotiables (read before writing any code)

1. `constitution/brand_constitution.json` is the single source of truth. No rule, claim,
   banned word, or CTA string is hardcoded anywhere else. The prompt compiler, the check
   registry, and the UI all read from this file.
2. Objective checks are deterministic TypeScript — regex/string logic, never a model call.
   Every failure cites a rule ID and the offending span.
3. Only two rules are model-judged (Stage 2b) because they are genuinely subjective:
   VX-2 (max one metaphor) and the per-channel structure rule. The audit endpoint returns
   strict JSON `{"<ruleId>": {"pass": bool, "note": string}}` and nothing else.
4. The compiled system prompt is viewable in the UI ("View compiled instructions") —
   demo evidence, not a debug feature.
5. Auto-fix rewrites ONLY flagged spans, then re-lints. A piece is shippable only when the
   ledger shows zero FAIL rows ("ON STANDARD" stamp).
6. The model never invents statistics, findings, or client names (registry rule CL-6 is in
   the compiled prompt).
7. **Checks are extensible by design.** New checks will be added later. Adding one must mean
   appending ONE object to the registry — no UI edits, no route edits.

## Reference implementations (already exist — port, don't reinvent)

- `reference/consuma_standard_tool.jsx` — working single-file prototype (claude.ai artifact).
  Port `compileSystemPrompt`, the lint logic, inline violation highlighting, and auto-fix
  faithfully. The prototype's logic is correct; this project upgrades its architecture and UI.
- `constitution/brand_constitution.json` — full ruleset v1.0. Never change rule content
  without bumping `meta.version` and noting a source + date. If two rules conflict, STOP and
  ask — rule changes are a human decision (that is the whole point of the tool).

## Tech stack (Vercel-native)

- **Next.js 15+ App Router + TypeScript.** One repo, one deploy.
- **API routes** (`app/api/*/route.ts`) hold all model calls so the key never reaches the
  browser: `POST /api/generate` (also handles fix mode) and `POST /api/audit`.
- **Model:** `@anthropic-ai/sdk`, `claude-sonnet-4-6`. Key from `process.env.ANTHROPIC_API_KEY`
  (Vercel → Project → Settings → Environment Variables in production; `.env.local` in dev).
- **Styling:** Tailwind CSS v4 with the design tokens below defined as CSS variables in
  `globals.css`. `next/font` for Google fonts. No component library — the design system is
  small, custom, and specified here; shadcn defaults would flatten it.
- **State/persistence:** no database. Run history persists client-side in `localStorage`
  (key `csm-runs`, capped at 50 entries) so the Checks page can show recent activity.
  API routes stay stateless (Vercel serverless requirement).
- **Tests:** Vitest for `lib/` (checks + prompt compiler). Framer Motion allowed for the
  small set of motions specified below; no other UI deps without asking.

## Repository structure (target)

```
consuma-standard-tool/
├── CLAUDE.md
├── constitution/
│   └── brand_constitution.json      # SSOT — v1.0
├── reference/
│   └── consuma_standard_tool.jsx    # prototype to port from
├── lib/
│   ├── constitution.ts              # typed loader + types for the JSON
│   ├── promptCompiler.ts            # compileSystemPrompt(channel) — pure
│   ├── checks.ts                    # THE CHECK REGISTRY (see spec below) — pure
│   └── runChecks.ts                 # runChecks(text, channel): CheckResult[] — pure
├── app/
│   ├── layout.tsx                   # fonts, nav, footer
│   ├── page.tsx                     # LANDING — the standard as a website
│   ├── tool/page.tsx                # WORKBENCH — generate → lint → fix
│   ├── checks/page.tsx              # CHECKS MONITOR — registry status + run history
│   ├── constitution/page.tsx        # the ruleset, human-readable, rendered from JSON
│   └── api/
│       ├── generate/route.ts
│       └── audit/route.ts
├── components/                      # RuleChip, Ledger, DraftEditor, StampBadge, ...
├── tests/
│   ├── checks.test.ts               # pass + fail case for every active check
│   └── promptCompiler.test.ts       # prompt provably derived from the JSON
├── .env.local.example               # ANTHROPIC_API_KEY=
└── package.json
```

## The check registry (`lib/checks.ts`) — implement exactly

Checks are data, not scattered functions. Single exported array:

```ts
export type CheckStatus = "active" | "planned";
export interface Check {
  id: string;            // rule ID from the constitution, e.g. "VX-3"
  label: string;         // "Banned lexicon"
  group: "identity" | "claims" | "voice" | "cta" | "channel";
  status: CheckStatus;   // planned checks render on /checks as "Coming soon", run nowhere
  severity: "fail" | "warn";
  description: string;   // one sentence, shown on /checks
  run?: (text: string, channel: ChannelKey, c: Constitution) => Match[]; // active only
}
export const CHECKS: Check[] = [ ... ];
```

`runChecks` filters `status === "active"`, executes, and maps to
`{ id, label, pass, matches: [{start, end, text}], detail, severity }`.
Match positions feed inline highlighting (red underline + rule-ID chip, merged when
overlapping). **Adding a future check = appending one object here. Nothing else changes.**

Active checks at launch:

| Rule | Check |
|---|---|
| ID-1 | regex `Consuma\s?\.\s?ai` or `consuma_ai` in prose → FAIL |
| ID-3 | regex `AI\s?Engine` → FAIL |
| CL-1..CL-5 | every string in each claim's `forbidden` list, case-insensitive → FAIL, detail cites the canonical replacement |
| VX-1 | any sentence > 28 words (split on `(?<=[.!?])\s+`) → FAIL |
| VX-3 | word-boundary match on every banned lexicon entry → FAIL |
| VX-4 | emoji ranges `[\u{1F300}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}]` (u flag) → FAIL |
| VX-5 | `#\w+` count over channel limit (LinkedIn 2, else 0) → FAIL on excess matches |
| VX-6 | space before `!?;:,`; more than one `!` total → FAIL |
| CH-CTA | forbidden CTA string present → FAIL; no allowed CTA → WARN |
| CH-* length | word count vs channel band (LinkedIn 80–150; email ≤120; JD ≤260; web ≤120) → WARN |

Seed these as `status: "planned"` so the monitor page shows the roadmap from day one:
`ID-2v` (descriptor verbatim-match on required channels), `CL-7` (claim-source freshness —
every registry number younger than 12 months), `CH-SUBJ` (email subject ≤ 7 words as its own
check), `TONE-READ` (reading-grade band). Do not implement them.

## API contract

`POST /api/generate` `{ channel, brief }` → `{ draft }`
  system = `compileSystemPrompt(channel)`; user = `Brief: <brief>`.
`POST /api/generate` `{ channel, draft, violations: [{id, label, detail, offending[]}] }` → `{ draft }`
  fix mode: same system prompt; user lists violations, instructs "correct ONLY these, keep
  compliant text unchanged, output the piece only."
`POST /api/audit` `{ channel, draft }` → `{ "VX-2": {...}, "<CH-id>": {...} }`
  strip markdown fences before JSON.parse; on parse failure return 502 `{ retry: true }`.
Both routes validate inputs and return 400 on missing fields. 30s max duration.

## Design spec — this must feel like a real product, not a dashboard template

**Concept: "the standards office."** The visual language of a regulator crossed with a modern
B2B product site: locked registry cards, rule-ID chips, a compliance stamp. Precision is the
brand; the UI itself should look governed.

**Tokens (CSS variables in `globals.css`):**
- `--paper: #F1F3F0` (app bg) · `--panel: #FFFFFF` · `--ink: #16211C` · `--muted: #5C6660`
- `--viridian: #0D5C48` (primary actions, PASS, links) · `--viridian-deep: #073B2E` (landing
  hero bg, footer) · `--violation: #B3261E` · `--warn: #8A6A00` · `--mint: #DFF0E9` (chip fills)
- Radius 10px panels / 6px chips. Borders `#DDE2DC`, 1px. Shadows minimal — one soft
  elevation for sticky elements only.
- Dark is NOT a theme toggle; the deep-viridian hero and footer bookend light pages.

**Type (via `next/font/google`):**
- Display: **Space Grotesk** 500/700 — headlines, stamp, big registry numbers.
- Body/UI: **Inter** 400/600.
- Mono: **IBM Plex Mono** — rule IDs, claim values, ledger verdicts, diff spans. The mono
  face is the personality of the app: every governed value renders in it, everywhere.

**Motion (Framer Motion, restrained):** ledger rows stagger in (40ms) after a lint run; the
ON/OFF STANDARD stamp scales in once with a slight rotation settle; violation marks pulse
once on first render. Respect `prefers-reduced-motion`. Nothing else animates.

**Pages:**

1. `/` **Landing** — the pitch for the standard itself.
   - Deep-viridian hero. H1: "One company. One voice. Enforced." Sub: one sentence on the
     tool. Primary CTA "Open the workbench" → `/tool`; secondary "See the checks" → `/checks`.
   - Signature hero element, "the number soup, resolved": left column shows the real
     conflicting claims found in the audit ("within seconds" · "just minutes" · "5–15
     minutes" · "87–94%") as struck-through mono chips drifting slightly; an arrow resolves
     them into one locked registry card ("under 30 minutes — CL-1") with a small lock glyph.
     Static layout, CSS-only drift; this is the one aesthetic risk, spend it well.
   - Below: three-step strip (Generate from constitution → Deterministic checks → Auto-fix
     to standard), a live-looking ledger snippet, and a footer CTA.
   - All landing copy must itself pass the checks. Run it through `runChecks` in a test.
2. `/tool` **Workbench** — port the prototype's layout, elevated with the tokens above:
   left constitution panel (collapsible groups, ID chips), right: channel tabs → brief →
   actions (Generate to standard · Model audit · Auto-fix (n) · View compiled instructions)
   → draft with inline violation marks (contentEditable, re-lint on blur so legacy copy can
   be pasted and audited) → compliance ledger with PASS/FAIL/WARN rows and the rotated stamp.
   Keep the demo button that loads the legacy "gold mine" LinkedIn post (in the reference
   JSX) — it must visibly trip 6 checks.
3. `/checks` **Checks monitor** — the governance surface:
   - Header stats: active checks, planned checks, runs stored, last run verdict.
   - Registry grid rendered from `CHECKS`: one card per check — ID chip, label, group tag,
     severity, description, status pill (`Active` viridian / `Planned` outline "Coming
     soon"). Grouped by constitution section, filterable by group and status.
   - Run history (from localStorage): table of recent lints — timestamp, channel, word
     count, fails/warns, verdict stamp mini. Empty state invites a first run in the tool.
4. `/constitution` — the JSON rendered as a readable document: version + date banner, each
   group as a section, claims as locked specimen cards (canonical value large in mono,
   forbidden variants struck through beneath). Link to download the raw JSON.

**Layout quality floor:** responsive to 360px (panels stack; on `/tool` the constitution
panel becomes a top drawer), visible keyboard focus rings (`--viridian` outline), semantic
headings, ledger is a real `<table>`.

## Commands

```
npm install
npm run dev        # next dev
npm test           # vitest
npm run build      # next build — MUST pass before any deploy
vercel             # preview deploy
vercel --prod      # production; set ANTHROPIC_API_KEY in Vercel env first
```

## Plugins in use (Impeccable + Ponytail) — division of labour

Two plugins are installed in this project. Their jurisdictions are strict:

- **Ponytail** (lazy-senior-dev / YAGNI) governs LOGIC: `lib/`, API routes, tests, config.
  Smallest change that works, no new dependencies, stdlib first. Run at `lite` intensity.
  Ponytail may NOT delete or veto anything in the Design spec section of this file — the
  four pages, the tokens, the fonts, and framer-motion are deliberate product scope, not
  over-engineering. If Ponytail flags them, the answer is: specified in CLAUDE.md, keep.
- **Impeccable** governs UI: run `/impeccable init` once (PRODUCT.md answers derive from
  "What this project is" above; DESIGN.md derives from the Design spec — the tokens,
  fonts, and page list in this file are the brand and are non-negotiable inputs, not
  suggestions for Impeccable to replace). After each page is built, run
  `/impeccable audit <page>` then `/impeccable polish <page>`. Before final deploy, run
  `/impeccable critique` across the app.
- Where the two disagree on a UI file, Impeccable + this file win. Where anything
  disagrees with the Non-negotiables section, this file wins.

## Working conventions for Claude Code

- Build order: `lib/` (constitution loader → prompt compiler → checks registry) → tests
  green → API routes → `/tool` → `/checks` → `/constitution` → `/` landing → polish pass.
  Do not start any UI until `npm test` passes on the checks.
- Small commits, one concern each: `feat(checks): claims registry checks`, etc.
- If a rule seems wrong or conflicts, flag and ask — never silently edit the constitution.
- Dependencies allowed: next, react, react-dom, @anthropic-ai/sdk, tailwindcss, framer-motion,
  typescript, vitest. Ask before adding anything else.
- Never commit `.env.local`. `.env.local.example` documents the single required variable.

## Definition of done

- [ ] `npm test` green; every ACTIVE check has a pass + fail test case.
- [ ] Pasting the legacy "gold mine" post yields exactly: VX-3, VX-4, VX-5, VX-6, CH-CTA
      FAILs (+ CH-LI length/structure warn).
- [ ] Generate → lint → auto-fix reaches "ON STANDARD" on all four channels.
- [ ] Compiled system prompt visible in UI and provably derived from the JSON (change the
      JSON, the prompt changes).
- [ ] `/checks` renders entirely from `CHECKS`; appending a planned check object makes it
      appear with no other edits (prove it in a test).
- [ ] Landing copy passes `runChecks` (tested).
- [ ] `npm run build` clean; deployed on Vercel with the env var set; all four pages live.
- [ ] README: live URL + 4 screenshots (landing hero, inline violation, ledger stamp,
      checks monitor).
