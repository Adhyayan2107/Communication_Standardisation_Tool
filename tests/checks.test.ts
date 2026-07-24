import { describe, it, expect } from "vitest";
import { CHECKS } from "../lib/checks";
import { runChecks } from "../lib/runChecks";
import type { CheckResult } from "../lib/runChecks";

const byId = (results: CheckResult[], id: string) => {
  const r = results.find((x) => x.id === id);
  if (!r) throw new Error(`no result for ${id}`);
  return r;
};

const lint = (text: string, channel: "linkedin" | "email" | "jd" | "web" = "linkedin") =>
  runChecks(text, channel);

// The legacy post from the audit, verbatim from the reference prototype.
const GOLD_MINE =
  "Unlock unparalleled market intelligence with Consuma ! 🚀 Tap into the infinite gold mine at your fingertips. Get insights within seconds. Click, discover, strategize. #Consuma #MarketInsights #BusinessIntelligence #DataDrivenSuccess";

describe("ID-1 name hygiene", () => {
  it("fails on 'Consuma.ai' used as a name in prose", () => {
    const r = byId(lint("We built Consuma.ai to fix research."), "ID-1");
    expect(r.pass).toBe(false);
    expect(r.matches[0]).toEqual({ start: 9, end: 19, text: "Consuma.ai" });
  });
  it("fails on 'consuma_ai' in prose", () => {
    expect(byId(lint("Follow consuma_ai for updates."), "ID-1").pass).toBe(false);
  });
  it("passes on plain 'Consuma'", () => {
    expect(byId(lint("We built Consuma to fix research."), "ID-1").pass).toBe(true);
  });
});

describe("ID-3 product naming", () => {
  it("fails on 'AI Engine'", () => {
    expect(byId(lint("Our AI Engine reads reviews."), "ID-3").pass).toBe(false);
  });
  it("passes on 'Rapid Research Platform'", () => {
    expect(byId(lint("The Rapid Research Platform reads reviews."), "ID-3").pass).toBe(true);
  });
});

describe("claims registry CL-1..CL-5", () => {
  it("CL-1 fails on retired speed variant and cites the canonical", () => {
    const r = byId(lint("Get insights within seconds."), "CL-1");
    expect(r.pass).toBe(false);
    expect(r.detail).toContain("under 30 minutes");
  });
  it("CL-1 fails on unqualified 'in minutes' (annotated forbidden entry)", () => {
    expect(byId(lint("Consumer insights in minutes."), "CL-1").pass).toBe(false);
  });
  it("CL-1 passes on the canonical claim", () => {
    expect(byId(lint("A decision-ready report in under 30 minutes."), "CL-1").pass).toBe(true);
  });
  it("CL-2 fails on retired baseline variants", () => {
    expect(byId(lint("Studies take 4-6 weeks."), "CL-2").pass).toBe(false);
    expect(byId(lint("Research takes months."), "CL-2").pass).toBe(false);
  });
  it("CL-2 passes on the canonical baseline", () => {
    expect(byId(lint("Traditional research takes 6-8 weeks."), "CL-2").pass).toBe(true);
  });
  it("CL-3 fails on the retired accuracy range", () => {
    expect(byId(lint("We deliver 87-94% accuracy."), "CL-3").pass).toBe(false);
  });
  it("CL-3 passes on the canonical accuracy claim", () => {
    expect(byId(lint("87% proven accuracy against secondary research."), "CL-3").pass).toBe(true);
  });
  it("CL-4 fails on retired data-scale variants", () => {
    expect(byId(lint("We have 1000x more data."), "CL-4").pass).toBe(false);
    expect(byId(lint("Built on millions of data points."), "CL-4").pass).toBe(false);
  });
  it("CL-4 passes on the canonical data claim", () => {
    expect(byId(lint("Built on 5B+ datapoints."), "CL-4").pass).toBe(true);
  });
  it("CL-5 fails on the retired client figure (annotated forbidden entry)", () => {
    expect(byId(lint("Trusted by 35+ global brands."), "CL-5").pass).toBe(false);
  });
  it("CL-5 passes on the canonical client proof", () => {
    expect(
      byId(lint("30+ brands, including Godrej, Britannia, Foxtale and Mosaic Wellness."), "CL-5").pass
    ).toBe(true);
  });
});

describe("VX-1 sentence length", () => {
  it("fails on a sentence over 28 words", () => {
    const long =
      "This sentence is deliberately written to run far past the twenty eight word limit that the constitution allows because we need a failing case for the sentence length check today.";
    expect(byId(lint(long), "VX-1").pass).toBe(false);
  });
  it("passes on short declarative sentences", () => {
    expect(byId(lint("Short sentences win. Every time."), "VX-1").pass).toBe(true);
  });
});

describe("VX-3 banned lexicon", () => {
  it("fails on banned words, case-insensitive, word-bounded", () => {
    const r = byId(lint("Unlock the future of research."), "VX-3");
    expect(r.pass).toBe(false);
    expect(r.matches[0].text).toBe("Unlock");
  });
  it("passes on clean copy", () => {
    expect(byId(lint("Specific findings beat superlatives."), "VX-3").pass).toBe(true);
  });
});

describe("VX-4 emojis", () => {
  it("fails on an emoji", () => {
    expect(byId(lint("Big news 🚀 today."), "VX-4").pass).toBe(false);
  });
  it("passes on plain text", () => {
    expect(byId(lint("Big news today."), "VX-4").pass).toBe(true);
  });
});

describe("VX-5 hashtags", () => {
  it("fails above the LinkedIn limit of 2, flagging only the excess", () => {
    const r = byId(lint("Post #one #two #three", "linkedin"), "VX-5");
    expect(r.pass).toBe(false);
    expect(r.matches).toHaveLength(1);
    expect(r.matches[0].text).toBe("#three");
  });
  it("passes at 2 hashtags on LinkedIn", () => {
    expect(byId(lint("Post #one #two", "linkedin"), "VX-5").pass).toBe(true);
  });
  it("fails on any hashtag on other channels", () => {
    expect(byId(lint("Subject #one", "email"), "VX-5").pass).toBe(false);
  });
});

describe("VX-6 punctuation hygiene", () => {
  it("fails on a space before punctuation", () => {
    expect(byId(lint("This is huge !"), "VX-6").pass).toBe(false);
  });
  it("fails on more than one exclamation mark", () => {
    expect(byId(lint("Wow! Amazing! Great."), "VX-6").pass).toBe(false);
  });
  it("passes with one exclamation mark and clean spacing", () => {
    expect(byId(lint("Wow! Great."), "VX-6").pass).toBe(true);
  });
});

describe("CH-CTA", () => {
  it("fails on a forbidden CTA string", () => {
    expect(byId(lint("Get in touch today."), "CH-CTA").pass).toBe(false);
  });
  it("passes when only allowed CTAs appear", () => {
    expect(byId(lint("Book a demo."), "CH-CTA").pass).toBe(true);
  });
  it("warns when no approved CTA is present", () => {
    const r = byId(lint("No call to action here."), "CH-CTA*");
    expect(r.pass).toBe(false);
    expect(r.severity).toBe("warn");
  });
  it("approved-CTA presence passes with 'Download the report'", () => {
    expect(byId(lint("Download the report."), "CH-CTA*").pass).toBe(true);
  });
});

describe("channel length bands (warn)", () => {
  const words = (n: number) => Array(n).fill("word").join(" ");
  it("CH-LI warns outside 80-150 words", () => {
    const r = byId(lint(words(30), "linkedin"), "CH-LI");
    expect(r.pass).toBe(false);
    expect(r.severity).toBe("warn");
    expect(byId(lint(words(100), "linkedin"), "CH-LI").pass).toBe(true);
  });
  it("CH-EM warns above 120 words", () => {
    expect(byId(lint(words(130), "email"), "CH-EM").pass).toBe(false);
    expect(byId(lint(words(100), "email"), "CH-EM").pass).toBe(true);
  });
  it("CH-JD warns above 260 words", () => {
    expect(byId(lint(words(270), "jd"), "CH-JD").pass).toBe(false);
    expect(byId(lint(words(250), "jd"), "CH-JD").pass).toBe(true);
  });
  it("CH-WEB warns above 120 words", () => {
    expect(byId(lint(words(130), "web"), "CH-WEB").pass).toBe(false);
    expect(byId(lint(words(100), "web"), "CH-WEB").pass).toBe(true);
  });
  it("length checks only run on their own channel", () => {
    const ids = lint(words(30), "linkedin").map((r) => r.id);
    expect(ids).toContain("CH-LI");
    expect(ids).not.toContain("CH-EM");
  });
});

describe("the legacy gold-mine post", () => {
  it("trips exactly CL-1, VX-3, VX-4, VX-5, VX-6, CH-CTA as FAILs", () => {
    const results = lint(GOLD_MINE, "linkedin");
    const fails = results.filter((r) => !r.pass && r.severity === "fail").map((r) => r.id).sort();
    expect(fails).toEqual(["CH-CTA", "CL-1", "VX-3", "VX-4", "VX-5", "VX-6"]);
  });
  it("warns on missing approved CTA and LinkedIn length", () => {
    const results = lint(GOLD_MINE, "linkedin");
    const warns = results.filter((r) => !r.pass && r.severity === "warn").map((r) => r.id).sort();
    expect(warns).toEqual(["CH-CTA*", "CH-LI"]);
  });
});

describe("registry shape", () => {
  it("every active check has a run function", () => {
    for (const c of CHECKS.filter((c) => c.status === "active")) {
      expect(c.run, `${c.id} missing run`).toBeTypeOf("function");
    }
  });
  it("seeds the four planned checks, which never execute", () => {
    const planned = CHECKS.filter((c) => c.status === "planned").map((c) => c.id).sort();
    expect(planned).toEqual(["CH-SUBJ", "CL-7", "ID-2v", "TONE-READ"]);
    const resultIds = lint("anything").map((r) => r.id);
    for (const id of planned) expect(resultIds).not.toContain(id);
  });
});

describe("/checks renders from the registry alone", () => {
  it("appending one check object makes it appear in the page's data with no other edits", async () => {
    const { groupedChecks } = await import("../lib/checks");
    const newCheck = {
      id: "X-9",
      label: "Future check",
      group: "voice",
      status: "planned",
      severity: "warn",
      description: "A check added later.",
    } as const;
    const groups = groupedChecks([...CHECKS, newCheck]);
    const voice = groups.find(([g]) => g === "voice");
    expect(voice?.[1].map((c) => c.id)).toContain("X-9");
    // every registry entry appears exactly once across the grouped output
    const all = groups.flatMap(([, cs]) => cs.map((c) => c.id + c.label));
    expect(all.sort()).toEqual([...CHECKS, newCheck].map((c) => c.id + c.label).sort());
  });
});
