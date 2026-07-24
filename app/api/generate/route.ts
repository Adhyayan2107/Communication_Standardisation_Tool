import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { compileSystemPrompt } from "@/lib/promptCompiler";
import { CHANNEL_IDS, type ChannelKey } from "@/lib/constitution";

export const maxDuration = 30;

interface Violation {
  id: string;
  label: string;
  detail: string;
  offending: string[];
}

const MODEL = "claude-sonnet-4-6";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const channel = body?.channel as ChannelKey | undefined;
  if (!channel || !(channel in CHANNEL_IDS)) {
    return NextResponse.json({ error: "channel is required" }, { status: 400 });
  }

  const fixMode =
    typeof body.draft === "string" &&
    Array.isArray(body.violations) &&
    body.violations.length > 0;
  if (!fixMode && !(typeof body.brief === "string" && body.brief.trim())) {
    return NextResponse.json(
      { error: "brief (or draft + violations) is required" },
      { status: 400 }
    );
  }

  const user = fixMode
    ? [
        "The draft below failed these constitution rules:",
        ...(body.violations as Violation[]).map(
          (v) =>
            `${v.id} ${v.label}: ${v.detail} Offending: ${
              v.offending.map((o) => `"${o}"`).join(", ") || "(structural)"
            }`
        ),
        "",
        "Rewrite the draft correcting ONLY these violations. Keep everything compliant unchanged. Output the corrected piece only.",
        "",
        "DRAFT:",
        body.draft,
      ].join("\n")
    : `Brief: ${body.brief}`;

  try {
    const msg = await new Anthropic().messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: compileSystemPrompt(channel),
      messages: [{ role: "user", content: user }],
    });
    const draft = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json({ error: "generation failed" }, { status: 502 });
  }
}
