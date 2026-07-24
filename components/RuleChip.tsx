export function RuleChip({ id, className = "" }: { id: string; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 self-start rounded-[6px] border border-viridian px-1.5 text-[10.5px] leading-[1.6] text-viridian font-mono ${className}`}
    >
      {id}
    </span>
  );
}
