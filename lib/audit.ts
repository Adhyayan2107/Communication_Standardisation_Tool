export interface AuditVerdict {
  pass: boolean;
  note: string;
}

/** Strict Stage-2b contract: raw JSON keyed by VX-2 and the channel rule id.
    Returns null on any deviation so the route can 502 { retry: true }. */
export function parseAuditModelJson(
  raw: string,
  channelId: string
): Record<string, AuditVerdict> | null {
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    for (const key of ["VX-2", channelId]) {
      if (typeof parsed?.[key]?.pass !== "boolean") return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
