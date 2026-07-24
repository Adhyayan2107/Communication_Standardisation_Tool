import { describe, it, expect } from "vitest";
import { compileSystemPrompt } from "../lib/promptCompiler";
import { CONSTITUTION } from "../lib/constitution";
import type { Constitution } from "../lib/constitution";

describe("compileSystemPrompt", () => {
  const prompt = compileSystemPrompt("linkedin");

  it("carries the ID-2 descriptor verbatim", () => {
    expect(prompt).toContain(
      "Consuma is an AI-powered rapid research platform that turns a research brief into a decision-ready consumer insights report in under 30 minutes."
    );
  });

  it("carries every canonical claim from the registry", () => {
    expect(prompt).toContain("under 30 minutes");
    expect(prompt).toContain("6-8 weeks");
    expect(prompt).toContain("87% proven accuracy against secondary research");
    expect(prompt).toContain("5B+ datapoints");
    expect(prompt).toContain("30+ brands, including Godrej, Britannia, Foxtale and Mosaic Wellness");
  });

  it("carries the CL-6 no-invention rule", () => {
    expect(prompt).toContain("CL-6");
    expect(prompt.toLowerCase()).toContain("invent");
  });

  it("carries the full banned lexicon", () => {
    const banned = (CONSTITUTION.voice["VX-3"] as { banned: string[] }).banned;
    expect(banned.length).toBeGreaterThan(10);
    for (const w of banned) expect(prompt).toContain(w);
  });

  it("carries the channel rule for the selected channel only", () => {
    expect(prompt).toContain("Insight-first");
    expect(compileSystemPrompt("email")).toContain("Subject line of 7 words or fewer");
  });

  it("is provably derived from the JSON: editing the constitution changes the prompt", () => {
    const modified = structuredClone(CONSTITUTION) as Constitution;
    (modified.claims_registry["CL-1"] as { canonical: string }).canonical = "under 5 minutes";
    modified.meta.version = "9.9";
    const p = compileSystemPrompt("linkedin", modified);
    expect(p).toContain("under 5 minutes");
    expect(p).toContain("9.9");
    expect(p).not.toEqual(prompt);
  });
});
