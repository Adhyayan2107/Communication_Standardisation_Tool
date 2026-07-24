"use client";
/*
THESIS: the governance surface — the registry itself is the content, shown as a
living roadmap (active enforcement + what's coming), not a marketing feature list.
OWN-WORLD: standards-office per DESIGN.md — registry specimen cards on paper,
mono rule IDs, big Space Grotesk registry numbers, semantic verdict colors only.
STORY: a visitor sees how many rules are enforced in code right now, filters the
registry, and reads the recent lint activity — proof the standard is operating.
FIRST VIEWPORT: stat strip (active / planned / runs / last verdict), then the
filterable registry grid grouped by constitution section.
FORM: specified by CLAUDE.md (brief-pinned); renders from CHECKS alone.
*/
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CHECKS, CHECK_GROUPS, groupedChecks, type Check, type CheckStatus } from "@/lib/checks";
import { loadRuns, type RunRecord } from "@/lib/runHistory";
import { RuleChip } from "@/components/RuleChip";

const GROUP_LABELS: Record<Check["group"], string> = {
  identity: "Identity",
  claims: "Claims registry",
  voice: "Voice",
  cta: "CTA hierarchy",
  channel: "Channels",
};

const CHANNEL_SHORT: Record<RunRecord["channel"], string> = {
  linkedin: "CH-LI",
  email: "CH-EM",
  jd: "CH-JD",
  web: "CH-WEB",
};

function MiniStamp({ verdict }: { verdict: RunRecord["verdict"] }) {
  const ok = verdict === "ON STANDARD";
  return (
    <span
      className={`inline-block -rotate-2 rounded-[6px] border px-1.5 py-px font-display text-[10px] font-bold tracking-[0.08em] ${
        ok ? "border-viridian text-viridian" : "border-violation text-violation"
      }`}
    >
      {verdict}
    </span>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-line bg-panel px-4 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-1 font-display text-[28px] font-bold leading-none text-ink">{children}</div>
    </div>
  );
}

export default function ChecksPage() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [group, setGroup] = useState<"all" | Check["group"]>("all");
  const [status, setStatus] = useState<"all" | CheckStatus>("all");

  useEffect(() => {
    setRuns(loadRuns());
  }, []);

  const active = CHECKS.filter((c) => c.status === "active").length;
  const planned = CHECKS.filter((c) => c.status === "planned").length;

  const sections = useMemo(
    () =>
      groupedChecks(
        CHECKS.filter(
          (c) => (group === "all" || c.group === group) && (status === "all" || c.status === status)
        )
      ),
    [group, status]
  );

  const filterChip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs transition-colors ${
      on ? "border-viridian bg-viridian text-white" : "border-line bg-panel text-ink hover:border-viridian/50"
    }`;

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-6 pb-12 lg:px-7">
      <h1 className="font-display text-2xl font-bold">Checks monitor</h1>
      <p className="mt-1 max-w-[70ch] text-sm text-muted">
        Every objective rule runs as deterministic code from{" "}
        <span className="font-mono text-[13px]">brand_constitution.json</span>. Adding a future
        check appends one entry to the registry — nothing else changes.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active checks">{active}</Stat>
        <Stat label="Planned checks">{planned}</Stat>
        <Stat label="Runs stored">{runs.length}</Stat>
        <Stat label="Last run verdict">
          {runs[0] ? <MiniStamp verdict={runs[0].verdict} /> : <span className="text-muted">—</span>}
        </Stat>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">
        <div role="group" aria-label="Filter by group" className="flex flex-wrap items-center gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            Group
          </span>
          <button className={filterChip(group === "all")} aria-pressed={group === "all"} onClick={() => setGroup("all")}>
            All
          </button>
          {CHECK_GROUPS.map((g) => (
            <button key={g} className={filterChip(group === g)} aria-pressed={group === g} onClick={() => setGroup(g)}>
              {GROUP_LABELS[g]}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            Status
          </span>
          {(["all", "active", "planned"] as const).map((s) => (
            <button key={s} className={filterChip(status === s)} aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === "all" ? "All" : s === "active" ? "Active" : "Planned"}
            </button>
          ))}
        </div>
      </div>

      {sections.length === 0 && (
        <p className="mt-6 text-sm text-muted">No checks match this filter.</p>
      )}
      {sections.map(([g, checks]) => (
        <section key={g} className="mt-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {GROUP_LABELS[g]}
          </h2>
          <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {checks.map((c) => (
              <article
                key={c.id + c.label}
                className={`rounded-[10px] border bg-panel p-4 ${
                  c.status === "planned" ? "border-dashed border-line" : "border-line"
                }`}
              >
                <div className="flex items-center gap-2">
                  <RuleChip id={c.id} />
                  <h3 className="text-[13.5px] font-semibold">{c.label}</h3>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                      c.status === "active"
                        ? "bg-mint text-viridian"
                        : "border border-line text-muted"
                    }`}
                  >
                    {c.status === "active" ? "Active" : "Coming soon"}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-normal text-muted">{c.description}</p>
                <div className="mt-2.5 flex items-center gap-3 border-t border-dashed border-line pt-2 font-mono text-[10.5px] uppercase">
                  <span className={c.severity === "fail" ? "text-violation" : "text-warn"}>
                    {c.severity === "fail" ? "FAIL on hit" : "WARN on hit"}
                  </span>
                  <span className="text-muted">{GROUP_LABELS[c.group]}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Run history <span className="normal-case tracking-normal">(stored locally, last 50)</span>
        </h2>
        {runs.length === 0 ? (
          <div className="mt-2.5 rounded-[10px] border border-line bg-panel px-5 py-8 text-center text-sm text-muted">
            No runs recorded yet.{" "}
            <Link href="/tool" className="text-viridian underline underline-offset-2">
              Open the workbench
            </Link>{" "}
            and lint a draft — or{" "}
            <Link href="/tool?demo=gold" className="text-viridian underline underline-offset-2">
              load the demo lint
            </Link>{" "}
            to see the registry catch the audit&apos;s legacy post.
          </div>
        ) : (
          <div className="mt-2.5 overflow-x-auto rounded-[10px] border border-line bg-panel">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-[0.12em] text-muted">
                  <th className="px-4 py-2 font-semibold">When</th>
                  <th className="px-4 py-2 font-semibold">Channel</th>
                  <th className="px-4 py-2 font-semibold">Words</th>
                  <th className="px-4 py-2 font-semibold">Fails</th>
                  <th className="px-4 py-2 font-semibold">Warns</th>
                  <th className="px-4 py-2 font-semibold">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r, i) => (
                  <tr key={r.ts + "-" + i}>
                    <td className="whitespace-nowrap border-t border-line px-4 py-2 text-muted">
                      {new Date(r.ts).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="border-t border-line px-4 py-2 font-mono text-[11.5px]">
                      {CHANNEL_SHORT[r.channel]}
                    </td>
                    <td className="border-t border-line px-4 py-2 font-mono text-[11.5px]">{r.words}</td>
                    <td className={`border-t border-line px-4 py-2 font-mono font-semibold ${r.fails ? "text-violation" : "text-viridian"}`}>
                      {r.fails}
                    </td>
                    <td className={`border-t border-line px-4 py-2 font-mono font-semibold ${r.warns ? "text-warn" : "text-viridian"}`}>
                      {r.warns}
                    </td>
                    <td className="border-t border-line px-4 py-2">
                      <MiniStamp verdict={r.verdict} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
