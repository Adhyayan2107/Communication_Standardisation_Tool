import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseAuditModelJson } from "@/lib/audit";
import {
  CHANNEL_IDS,
  CONSTITUTION,
  channelOf,
  type ChannelKey,
  type VoiceRule,
} from "@/lib/constitution";

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const channel = body?.channel as ChannelKey | undefined;
  if (!channel || !(channel in CHANNEL_IDS)) {
    return NextResponse.json({ error: "channel is required" }, { status: 400 });
  }
  if (!(typeof body.draft === "string" && body.draft.trim())) {
    return NextResponse.json({ error: "draft is required" }, { status: 400 });
  }

  const chId = CHANNEL_IDS[channel];
  const ch = channelOf(CONSTITUTION, channel);
  const vx2 = (CONSTITUTION.voice["VX-2"] as VoiceRule).rule;

  const system = `You are a compliance auditor. Judge ONLY these two rules. Respond with raw JSON only, no markdown: {"VX-2":{"pass":bool,"note":"<12 words"},"${chId}":{"pass":bool,"note":"<12 words"}}`;
  const user = `Rules:\nVX-2: ${vx2}\n${chId}: ${ch.rule} Structure: ${ch.structure.join(" → ")}\n\nText:\n${body.draft}`;

  try {
    const msg = await new Anthropic().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: user }],
    });
    const raw = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const verdicts = parseAuditModelJson(raw, chId);
    if (!verdicts) return NextResponse.json({ retry: true }, { status: 502 });
    return NextResponse.json(verdicts);
  } catch {
    return NextResponse.json({ retry: true }, { status: 502 });
  }
}
