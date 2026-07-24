import { CHECKS, type Match } from "./checks";
import { CONSTITUTION, type ChannelKey, type Constitution } from "./constitution";

export interface CheckResult {
  id: string;
  label: string;
  pass: boolean;
  matches: Match[];
  detail: string;
  severity: "fail" | "warn";
}

export function runChecks(
  text: string,
  channel: ChannelKey,
  c: Constitution = CONSTITUTION
): CheckResult[] {
  return CHECKS.filter(
    (k) => k.status === "active" && (!k.appliesTo || k.appliesTo === channel)
  ).map((k) => {
    const matches = k.run!(text, channel, c);
    return {
      id: k.id,
      label: k.label,
      pass: matches.length === 0,
      matches,
      detail: k.detail ? k.detail(text, channel, c) : k.description,
      severity: k.severity,
    };
  });
}
