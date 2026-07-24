"use client";
import { useMemo } from "react";
import type { CheckResult } from "@/lib/runChecks";

interface Segment {
  text: string;
  ids: string[] | null;
}

/** Violation chips render as CSS ::after content so contentEditable's innerText
    stays exactly the draft text — editing never picks up rule-ID labels. */
export function DraftEditor({
  draft,
  report,
  onCommit,
}: {
  draft: string;
  report: CheckResult[] | null;
  onCommit: (text: string) => void;
}) {
  const segments = useMemo<Segment[]>(() => {
    if (!draft) return []; // no child nodes so the :empty placeholder shows
    if (!report) return [{ text: draft, ids: null }];
    const marks = report
      .filter((r) => !r.pass)
      .flatMap((r) =>
        r.matches
          .filter((m) => m.end > m.start) // structural (zero-length) matches don't highlight
          .map((m) => ({ start: m.start, end: m.end, ids: [r.id] }))
      )
      .sort((a, b) => a.start - b.start);
    const merged: typeof marks = [];
    for (const m of marks) {
      const last = merged[merged.length - 1];
      if (last && m.start < last.end) {
        last.end = Math.max(last.end, m.end);
        if (!last.ids.includes(m.ids[0])) last.ids.push(m.ids[0]);
      } else merged.push({ ...m });
    }
    const out: Segment[] = [];
    let i = 0;
    for (const m of merged) {
      if (m.start > i) out.push({ text: draft.slice(i, m.start), ids: null });
      out.push({ text: draft.slice(m.start, m.end), ids: m.ids });
      i = m.end;
    }
    if (i < draft.length) out.push({ text: draft.slice(i), ids: null });
    return out;
  }, [draft, report]);

  return (
    <div
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Draft — edit or paste copy, then click away to re-lint"
      data-placeholder="No draft yet. Generate from a brief — or paste existing copy here to audit it against the standard."
      onPaste={(e) => {
        // Insert clipboard as plain text so pasted formatting never enters the draft.
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        sel.deleteFromDocument();
        sel.getRangeAt(0).insertNode(document.createTextNode(text));
        sel.collapseToEnd();
      }}
      onBlur={(e) => onCommit((e.target as HTMLElement).innerText)}
      className="draft-editor min-h-[120px] whitespace-pre-wrap p-4.5 text-[14.5px] leading-[1.65] outline-none"
    >
      {segments.map((s, k) =>
        s.ids ? (
          <mark
            key={k}
            className="vio"
            data-rule={s.ids.join(" · ")}
            title={`Violates ${s.ids.join(", ")}`}
            aria-label={`"${s.text}" violates ${s.ids.join(", ")}`}
          >
            {s.text}
          </mark>
        ) : (
          <span key={k}>{s.text}</span>
        )
      )}
    </div>
  );
}
