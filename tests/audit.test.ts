import { describe, it, expect } from "vitest";
import { parseAuditModelJson } from "../lib/audit";

describe("parseAuditModelJson", () => {
  const good = `{"VX-2":{"pass":true,"note":"one metaphor"},"CH-LI":{"pass":false,"note":"opens with the company"}}`;

  it("parses raw JSON", () => {
    const r = parseAuditModelJson(good, "CH-LI");
    expect(r?.["CH-LI"].pass).toBe(false);
  });

  it("strips markdown fences before parsing", () => {
    expect(parseAuditModelJson("```json\n" + good + "\n```", "CH-LI")).not.toBeNull();
  });

  it("returns null on non-JSON", () => {
    expect(parseAuditModelJson("The draft looks fine to me.", "CH-LI")).toBeNull();
  });

  it("returns null when a required rule key is missing or malformed", () => {
    expect(parseAuditModelJson(`{"VX-2":{"pass":true,"note":""}}`, "CH-LI")).toBeNull();
    expect(parseAuditModelJson(`{"VX-2":{"pass":"yes"},"CH-LI":{"pass":true}}`, "CH-LI")).toBeNull();
  });
});
