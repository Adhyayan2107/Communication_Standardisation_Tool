"use client";
import { useState } from "react";
import { CONSTITUTION, claimEntries, voiceEntries } from "@/lib/constitution";
import { RuleChip } from "./RuleChip";

interface Row {
  id: string;
  body: React.ReactNode;
}

function Group({ title, rows, defaultOpen = false }: { title: string; rows: Row[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold text-ink hover:bg-paper"
      >
        {title}
        <span aria-hidden className="text-muted">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex gap-2.5 border-t border-dashed border-line/70 py-1.5 text-[12.5px] leading-[1.45] text-ink/85 first:border-t-0"
            >
              <RuleChip id={r.id} />
              <span>{r.body}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConstitutionPanel() {
  const c = CONSTITUTION;
  const mono = (s: string) => <span className="font-mono text-[11.5px]">{s}</span>;

  return (
    <aside aria-label="Brand Constitution" className="rounded-[10px] border border-line bg-panel">
      <h2 className="px-4 pt-3.5 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Brand Constitution (the standard)
      </h2>
      <Group
        title="Identity"
        rows={Object.entries(c.identity).map(([id, v]) => ({ id, body: v.rule }))}
      />
      <Group
        title="Claims registry · locked"
        defaultOpen
        rows={claimEntries(c).map(([id, v]) => ({
          id,
          body: v.canonical ? (
            <>
              {v.dimension}: {mono(`"${v.canonical}"`)}
            </>
          ) : (
            v.rule
          ),
        }))}
      />
      <Group
        title="Voice"
        rows={voiceEntries(c).map(([id, v]) => ({ id, body: v.rule }))}
      />
      <Group
        title="CTA hierarchy"
        rows={[
          {
            id: "CH-CTA",
            body: (
              <>
                {mono(`"${c.cta["CH-CTA"].allowed[0]}"`)} (primary) · {mono(`"${c.cta["CH-CTA"].allowed[1]}"`)} (secondary). Nothing else.
              </>
            ),
          },
        ]}
      />
      <Group
        title="Channels"
        rows={Object.entries(c.channels).map(([id, v]) => ({ id, body: v.rule }))}
      />
      <p className="border-t border-line px-4 py-3 text-xs text-muted">
        The linter runs from these rules as code — the model never judges the objective checks.
      </p>
    </aside>
  );
}
