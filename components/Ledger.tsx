"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { CheckResult } from "@/lib/runChecks";
import type { AuditVerdict } from "@/lib/audit";
import { StampBadge } from "./StampBadge";

const verdictClass = (r: CheckResult) =>
  r.pass ? "text-viridian" : r.severity === "warn" ? "text-warn" : "text-violation";

export function Ledger({
  results,
  audit,
  lintKey,
}: {
  results: CheckResult[];
  audit: Record<string, AuditVerdict> | null;
  lintKey: number;
}) {
  const reduce = useReducedMotion();
  const fails = results.filter((r) => !r.pass && r.severity === "fail").length;
  const warns = results.filter((r) => !r.pass && r.severity === "warn").length;
  const passes = results.length - fails - warns;
  // Verdicts first: FAIL, then WARN, then the passing rows.
  const rank = (r: CheckResult) => (r.pass ? 2 : r.severity === "warn" ? 1 : 0);
  const sorted = [...results].sort((a, b) => rank(a) - rank(b));

  const row = (i: number) => ({
    initial: reduce ? undefined : { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.04, duration: 0.18 },
  });

  return (
    <section aria-label="Compliance ledger" className="rounded-[10px] border border-line bg-panel">
      <h2 className="px-4 pt-3.5 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Compliance ledger · Stage 2a (deterministic)
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-[0.12em] text-muted">
              <th className="border-t border-line px-4 py-1.5 font-semibold">Rule</th>
              <th className="border-t border-line px-4 py-1.5 font-semibold">Check</th>
              <th className="border-t border-line px-4 py-1.5 font-semibold">Verdict</th>
              <th className="border-t border-line px-4 py-1.5 font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody key={lintKey}>
            {sorted.map((r, i) => (
              <motion.tr key={r.id + r.label} {...row(i)}>
                <td className="w-[90px] whitespace-nowrap border-t border-line px-4 py-2 align-top font-mono text-viridian">
                  {r.id}
                </td>
                <td className="w-[170px] border-t border-line px-4 py-2 align-top">{r.label}</td>
                <td className={`w-[64px] border-t border-line px-4 py-2 align-top font-mono font-semibold ${verdictClass(r)}`}>
                  {r.pass ? "PASS" : r.severity === "warn" ? "WARN" : "FAIL"}
                </td>
                <td className="border-t border-line px-4 py-2 align-top text-muted">
                  {!r.pass && r.matches.some((m) => m.text) && (
                    <span className="font-mono text-violation">
                      {r.matches
                        .filter((m) => m.text)
                        .slice(0, 4)
                        .map((m) => `"${m.text}"`)
                        .join(" · ")}
                      {" — "}
                    </span>
                  )}
                  {/* remediation copy belongs to failure states, not green rows */}
                  {!r.pass && r.detail}
                </td>
              </motion.tr>
            ))}
            {audit &&
              Object.entries(audit).map(([id, v], i) => (
                <motion.tr key={id} {...row(results.length + i)}>
                  <td className="border-t border-line px-4 py-2 align-top font-mono text-viridian">{id}</td>
                  <td className="border-t border-line px-4 py-2 align-top">Model audit</td>
                  <td className={`border-t border-line px-4 py-2 align-top font-mono font-semibold ${v.pass ? "text-viridian" : "text-violation"}`}>
                    {v.pass ? "PASS" : "FAIL"}
                  </td>
                  <td className="border-t border-line px-4 py-2 align-top text-muted">
                    {v.note} <em>(subjective rule — judged by model, Stage 2b)</em>
                  </td>
                </motion.tr>
              ))}
          </tbody>
        </table>
      </div>
      <div aria-live="polite" className="flex items-center gap-4 border-t border-line px-4 py-3 text-[13px]">
        <span>
          <b className="font-mono text-violation">{fails}</b> fail
        </span>
        <span>
          <b className="font-mono text-warn">{warns}</b> warn
        </span>
        <span>
          <b className="font-mono text-viridian">{passes}</b> pass
        </span>
        <span className="ml-auto">
          <StampBadge ok={fails === 0} animateKey={lintKey} />
        </span>
      </div>
    </section>
  );
}
