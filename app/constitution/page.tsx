/*
THESIS: the standard itself, published — a regulator's document, not a settings
page; every governed value is a locked specimen, not prose.
OWN-WORLD: standards-office per DESIGN.md — paper document, white specimen
cards, mono canonical values large, retired variants struck through in red.
STORY: a reader learns exactly what the standard is, sees every locked value
and every retired variant, and can download the machine-readable source.
FIRST VIEWPORT: document banner (name, version, date, source, principle),
then Identity, then the claims registry as a specimen-card grid.
FORM: specified by CLAUDE.md (brief-pinned); rendered entirely from the JSON.
*/
import { CONSTITUTION, claimEntries, voiceEntries } from "@/lib/constitution";
import { RuleChip } from "@/components/RuleChip";

const Lock = () => (
  <svg
    aria-hidden
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    className="shrink-0 text-viridian"
  >
    <rect x="2" y="5" width="8" height="6" rx="1" fill="currentColor" />
    <path d="M4 5V3.5a2 2 0 1 1 4 0V5" stroke="currentColor" strokeWidth="1.4" fill="none" />
  </svg>
);

const Struck = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[13px] text-muted line-through decoration-violation/50">
    {children}
  </span>
);

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

export const metadata = { title: "Brand Constitution · Consuma" };

export default function ConstitutionPage() {
  const c = CONSTITUTION;
  const cta = c.cta["CH-CTA"];

  return (
    <div className="mx-auto max-w-[880px] px-5 py-6 pb-14 lg:px-7">
      {/* Document banner */}
      <header className="rounded-[10px] border border-line bg-panel p-5 lg:p-6">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-display text-2xl font-bold">{c.meta.name}</h1>
          <span className="font-mono text-[13px] text-viridian">
            v{c.meta.version} · {c.meta.date}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-muted">Source: {c.meta.source}</p>
        <blockquote className="mt-4 border-l-2 border-viridian pl-4 text-[14.5px] leading-relaxed text-ink/90">
          {c.meta.principle}
        </blockquote>
        <a
          href="/api/constitution"
          download="brand_constitution.json"
          className="mt-4 inline-block rounded-lg border border-viridian px-3.5 py-2 text-[13px] font-semibold text-viridian hover:bg-mint"
        >
          Download the raw JSON
        </a>
      </header>

      <Section id="identity" title="Identity">
        <div className="rounded-[10px] border border-line bg-panel">
          {Object.entries(c.identity).map(([id, v]) => (
            <div key={id} className="flex flex-col gap-2 border-t border-line p-4 first:border-t-0 sm:flex-row sm:gap-4">
              <RuleChip id={id} />
              <div className="min-w-0">
                <p className="text-sm leading-relaxed">{v.rule}</p>
                {v.canonical && (
                  <p className="mt-1.5 font-mono text-[13px] font-semibold text-viridian">
                    “{v.canonical}”
                  </p>
                )}
                {(v.forbidden ?? v.forbidden_in_prose) && (
                  <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {(v.forbidden ?? v.forbidden_in_prose)!.map((f) => (
                      <Struck key={f}>{f}</Struck>
                    ))}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="claims" title="Claims registry · the only numbers permitted">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {claimEntries(c).map(([id, v]) =>
            v.canonical ? (
              <article key={id} className="rounded-[10px] border border-line bg-panel p-4">
                <div className="flex items-center gap-2">
                  <RuleChip id={id} />
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {v.dimension}
                  </h3>
                  <span className="ml-auto flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-viridian">
                    <Lock /> locked
                  </span>
                </div>
                <p className="mt-3 font-mono text-lg font-semibold leading-[1.4] text-ink">
                  {v.canonical}
                </p>
                {(v.forbidden || v.spelling_lock) && (
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-dashed border-line pt-2.5">
                    {(v.forbidden ?? []).map((f) => (
                      <Struck key={f}>{f}</Struck>
                    ))}
                    {(v.spelling_lock ?? []).map((s) => (
                      <span key={s} className="font-mono text-[13px] text-muted">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ) : (
              <article
                key={id}
                className="rounded-[10px] border border-dashed border-line bg-panel p-4 sm:col-span-2"
              >
                <div className="flex items-center gap-2">
                  <RuleChip id={id} />
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {v.dimension}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink/90">{v.rule}</p>
              </article>
            )
          )}
        </div>
      </Section>

      <Section id="voice" title="Voice">
        <div className="rounded-[10px] border border-line bg-panel">
          <p className="border-b border-line p-4 text-sm italic leading-relaxed text-muted">
            {String(c.voice.reference)}
          </p>
          {voiceEntries(c).map(([id, v]) => (
            <div key={id} className="flex flex-col gap-2 border-t border-line p-4 first:border-t-0 sm:flex-row sm:gap-4">
              <RuleChip id={id} />
              <div className="min-w-0">
                <p className="text-sm leading-relaxed">{v.rule}</p>
                {v.banned && (
                  <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {v.banned.map((w) => (
                      <Struck key={w}>{w}</Struck>
                    ))}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="cta" title="CTA hierarchy">
        <div className="rounded-[10px] border border-line bg-panel p-4">
          <p className="text-sm leading-relaxed">{cta.rule}</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {cta.allowed.map((a, i) => (
              <span
                key={a}
                className="rounded-lg border border-viridian bg-mint px-3 py-1.5 font-mono text-[13px] font-semibold text-viridian"
              >
                {a} <span className="font-normal text-viridian/70">· {i === 0 ? "primary" : "secondary"}</span>
              </span>
            ))}
          </div>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-dashed border-line pt-2.5">
            {cta.forbidden.map((f) => (
              <Struck key={f}>{f}</Struck>
            ))}
          </p>
        </div>
      </Section>

      <Section id="channels" title="Channels">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(c.channels).map(([id, ch]) => (
            <article key={id} className="rounded-[10px] border border-line bg-panel p-4">
              <div className="flex items-center gap-2">
                <RuleChip id={id} />
                <h3 className="text-[13.5px] font-semibold">{ch.channel.replace(/_/g, " ")}</h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/90">{ch.rule}</p>
              <ol className="mt-2.5 list-decimal border-t border-dashed border-line pl-5 pt-2.5 text-[13px] leading-relaxed text-muted">
                {ch.structure.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </Section>
    </div>
  );
}
