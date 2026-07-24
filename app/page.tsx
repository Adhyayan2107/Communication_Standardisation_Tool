/*
THESIS: the pitch for the standard itself — the page opens with the company's
real number soup being resolved into one locked value, refusing the generic
AI-tool hero of screenshots and feature cards.
OWN-WORLD: standards-office per DESIGN.md — deep-viridian hero and footer
bookending paper; struck mono specimens drifting; a white locked registry card
as the hero's counterweight; a real linted ledger as proof.
STORY: a visitor sees the chaos (retired claims), the resolution (the registry),
how it works (three stages), and proof (the audit's post linted live) — then
opens the workbench.
FIRST VIEWPORT: H1 + sub + two CTAs left; number-soup → locked card right.
FORM: specified by CLAUDE.md (brief-pinned); copy from lib/landingCopy, linted in tests.
*/
import Link from "next/link";
import { CONSTITUTION } from "@/lib/constitution";
import { LANDING_COPY } from "@/lib/landingCopy";
import { GOLD_MINE } from "@/lib/demoPost";
import { runChecks } from "@/lib/runChecks";
import { RuleChip } from "@/components/RuleChip";

const Lock = ({ className = "" }: { className?: string }) => (
  <svg aria-hidden width="14" height="14" viewBox="0 0 12 12" fill="none" className={className}>
    <rect x="2" y="5" width="8" height="6" rx="1" fill="currentColor" />
    <path d="M4 5V3.5a2 2 0 1 1 4 0V5" stroke="currentColor" strokeWidth="1.4" fill="none" />
  </svg>
);

export default function Landing() {
  const c = LANDING_COPY;
  // A real lint of the audit's real post — rendered server-side, not mocked.
  const failed = runChecks(GOLD_MINE, "linkedin").filter((r) => !r.pass && r.severity === "fail");

  return (
    <>
      {/* Hero */}
      <section className="bg-viridian-deep text-white">
        <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-14 lg:grid-cols-[1.1fr_1fr] lg:px-7 lg:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/60">
              brand_constitution.json · v{CONSTITUTION.meta.version} · {CONSTITUTION.meta.date}
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.08] sm:text-5xl">
              One company.
              <br />
              One voice. Enforced.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-white/80">
              {c.hero.sub}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/tool"
                className="rounded-lg bg-white px-5 py-2.5 text-[13.5px] font-semibold text-viridian-deep hover:bg-mint"
              >
                {c.hero.primary}
              </Link>
              <Link
                href="/checks"
                className="rounded-lg border border-white/40 px-5 py-2.5 text-[13.5px] font-semibold text-white hover:border-white hover:bg-white/10"
              >
                {c.hero.secondary}
              </Link>
            </div>
          </div>

          {/* The number soup, resolved */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/50">
                {c.soup.leftLabel}
              </p>
              <div className="mt-2.5 flex flex-col items-start gap-2">
                {c.soup.exhibits.map((e, i) => (
                  <span
                    key={e}
                    className={`drift drift-${i % 4} rounded-[6px] border border-white/25 px-2 py-1 font-mono text-[13px] text-white/70 line-through decoration-[#F3B7B1]/70`}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
            <svg aria-hidden width="36" height="16" viewBox="0 0 36 16" fill="none" className="text-white/50">
              <path d="M0 8h32m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div className="rounded-[10px] border border-line bg-panel p-4 text-ink shadow-[0_8px_28px_rgba(0,0,0,0.28)]">
              <p className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-viridian">
                <Lock /> {c.soup.rightLabel}
              </p>
              <p className="mt-2.5 font-mono text-lg font-semibold leading-[1.4]">{c.soup.canonical}</p>
              <p className="mt-2.5 flex items-center gap-2 border-t border-dashed border-line pt-2.5">
                <RuleChip id={c.soup.canonicalRule} />
                <span className="text-[11px] uppercase tracking-[0.08em] text-muted">
                  locked · claims registry
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three stages */}
      <section aria-label="How it works" className="mx-auto max-w-[1240px] px-5 py-12 lg:px-7">
        <div className="grid gap-3 lg:grid-cols-3">
          {c.steps.map((s) => (
            <div key={s.stage} className="rounded-[10px] border border-line bg-panel p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-viridian">{s.stage}</p>
              <h2 className="mt-1.5 font-display text-[15px] font-bold">{s.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live ledger snippet */}
      <section aria-label="Enforcement example" className="mx-auto max-w-[1240px] px-5 pb-12 lg:px-7">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="font-display text-2xl font-bold">{c.ledger.title}</h2>
            <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-muted">{c.ledger.caption}</p>
            <p className="mt-3 rounded-lg border border-dashed border-line bg-panel p-3.5 text-[13px] leading-relaxed text-muted">
              “{GOLD_MINE.slice(0, 120)}…”
            </p>
          </div>
          <div className="rounded-[10px] border border-line bg-panel">
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                {failed.map((r) => (
                  <tr key={r.id}>
                    <td className="w-[72px] whitespace-nowrap border-b border-line px-4 py-2 font-mono text-viridian">
                      {r.id}
                    </td>
                    <td className="border-b border-line px-4 py-2">{r.label}</td>
                    <td className="w-[56px] border-b border-line px-4 py-2 font-mono font-semibold text-violation">
                      FAIL
                    </td>
                    <td className="hidden border-b border-line px-4 py-2 font-mono text-[11.5px] text-violation sm:table-cell">
                      {r.matches.filter((m) => m.text).slice(0, 2).map((m) => `"${m.text}"`).join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] text-muted">
                <b className="font-mono text-violation">{failed.length}</b> fail · linted in code
              </span>
              <span className="inline-block -rotate-2 rounded-[6px] border-2 border-violation px-2.5 py-0.5 font-display text-xs font-bold tracking-[0.08em] text-violation">
                OFF STANDARD
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-line bg-mint">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-10 lg:px-7">
          <p className="font-display text-xl font-bold text-viridian-deep">{c.closing.line}</p>
          <Link
            href="/tool"
            className="rounded-lg bg-viridian px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-viridian-deep"
          >
            {c.closing.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
