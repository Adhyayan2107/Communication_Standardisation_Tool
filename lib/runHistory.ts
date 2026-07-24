import type { ChannelKey } from "./constitution";

export interface RunRecord {
  ts: number;
  channel: ChannelKey;
  words: number;
  fails: number;
  warns: number;
  verdict: "ON STANDARD" | "OFF STANDARD";
}

const KEY = "csm-runs";
const CAP = 50;

export function loadRuns(): RunRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveRun(run: RunRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify([run, ...loadRuns()].slice(0, CAP)));
  } catch {
    // storage unavailable (private mode) — history is a convenience, not a requirement
  }
}
