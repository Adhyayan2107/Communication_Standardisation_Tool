/** Landing copy, kept out of JSX so the test suite lints every block through
    the same registry the tool ships. The number-soup specimens are quoted
    violations from the audit (displayed struck-through) — exhibits, not copy. */

export const LANDING_COPY = {
  hero: {
    h1: "One company. One voice. Enforced.",
    sub: "Consuma's communication standard is written as code and enforced on every draft — LinkedIn posts, outbound email, job descriptions and website copy.",
    primary: "Open the workbench",
    secondary: "See the checks",
  },
  soup: {
    leftLabel: "Found live in the audit",
    rightLabel: "The registry answer",
    exhibits: ["within seconds", "just minutes", "5-15 minutes", "87-94%"], // struck-through specimens
    canonical: "under 30 minutes",
    canonicalRule: "CL-1",
  },
  steps: [
    {
      stage: "Stage 1",
      title: "Generate from the constitution",
      body: "Every draft starts from a system prompt compiled from brand_constitution.json. The model executes the standard; it never defines it.",
    },
    {
      stage: "Stage 2",
      title: "Deterministic checks",
      body: "The objective rules run as code, not as model judgment. Every failure names its rule and marks the exact offending span.",
    },
    {
      stage: "Stage 3",
      title: "Auto-fix to standard",
      body: "Flagged spans are rewritten while compliant text stays untouched. A piece ships only when the stamp reads ON STANDARD.",
    },
  ],
  ledger: {
    title: "Span-level enforcement, not vibes",
    caption: "The audit's real legacy post, linted by the shipped check registry.",
  },
  closing: {
    line: "The standard is written. Now every draft meets it.",
    cta: "Open the workbench",
  },
} as const;

/** Every sentence the landing page speaks in its own voice, one string per block. */
export function landingCopyBlocks(): string[] {
  const c = LANDING_COPY;
  return [
    `${c.hero.h1} ${c.hero.sub}`,
    ...c.steps.map((s) => `${s.title}. ${s.body}`),
    `${c.ledger.title}. ${c.ledger.caption}`,
    `${c.closing.line}`,
    `${c.soup.leftLabel}. ${c.soup.rightLabel}.`,
  ];
}
