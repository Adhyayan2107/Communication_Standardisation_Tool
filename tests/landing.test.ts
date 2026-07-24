import { describe, it, expect } from "vitest";
import { landingCopyBlocks } from "../lib/landingCopy";
import { runChecks } from "../lib/runChecks";

// CLAUDE.md: all landing copy must itself pass the checks. The struck-through
// retired-claim specimens in the "number soup" are exhibits of violations being
// caught, not copy — landingCopyBlocks() is every sentence the page speaks in
// its own voice, and none of it may FAIL a check (warns like "no CTA present"
// are navigation-page noise, not violations).
describe("landing copy passes the check registry", () => {
  const blocks = landingCopyBlocks();

  it("has copy to lint", () => {
    expect(blocks.length).toBeGreaterThanOrEqual(3);
  });

  it("every block produces zero FAIL rows on the web channel", () => {
    for (const block of blocks) {
      const fails = runChecks(block, "web").filter((r) => !r.pass && r.severity === "fail");
      expect(fails, `block "${block.slice(0, 40)}…" fails ${fails.map((f) => f.id).join(",")}`).toEqual(
        []
      );
    }
  });
});
