import {
  CONSTITUTION,
  channelOf,
  claimEntries,
  voiceEntries,
  type ChannelKey,
  type Constitution,
} from "./constitution";

/** Pure: the system prompt is compiled from the constitution JSON and nothing else. */
export function compileSystemPrompt(
  channel: ChannelKey,
  c: Constitution = CONSTITUTION
): string {
  const ch = channelOf(c, channel);
  const chId = Object.keys(c.channels).find((k) => c.channels[k] === ch);

  const identity = Object.entries(c.identity)
    .map(([id, v]) =>
      id === "ID-2"
        ? `  ${id} ${v.rule} Descriptor: "${v.canonical}"`
        : `  ${id} ${v.rule}`
    )
    .join("\n");

  const claims = claimEntries(c)
    .map(([id, v]) =>
      v.canonical
        ? `  ${id} ${v.dimension}: use exactly "${v.canonical}". Forbidden variants: ${(v.forbidden ?? []).join("; ")}.`
        : `  ${id} ${v.rule} Do not invent statistics, findings, or client names.`
    )
    .join("\n");

  const voice = voiceEntries(c)
    .map(([id, v]) =>
      v.banned ? `  ${id} ${v.rule} Banned words (never use): ${v.banned.join(", ")}.` : `  ${id} ${v.rule}`
    )
    .join("\n");

  const cta = c.cta["CH-CTA"];

  return `You are Consuma's content generator. You do not decide the standard; you execute the Brand Constitution v${c.meta.version} below. Violating any rule is a failed output.

IDENTITY
${identity}

CLAIMS REGISTRY — the ONLY numbers permitted anywhere:
${claims}

VOICE
${voice}
  Register: ${typeof c.voice.reference === "string" ? c.voice.reference : ""}

CTA
  CH-CTA ${cta.rule} Never: ${cta.forbidden.join("; ")}.

CHANNEL — ${chId} (${ch.channel})
  ${ch.rule}
  Structure: ${ch.structure.join(" → ")}

OUTPUT: plain text of the content piece only. No preamble, no markdown headers, no commentary.`;
}
