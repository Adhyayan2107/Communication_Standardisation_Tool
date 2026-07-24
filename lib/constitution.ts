import raw from "../constitution/brand_constitution.json";

export type ChannelKey = "linkedin" | "email" | "jd" | "web";

export interface IdentityRule {
  rule: string;
  canonical?: string;
  forbidden?: string[];
  forbidden_in_prose?: string[];
}

export interface Claim {
  dimension: string;
  canonical?: string;
  forbidden?: string[];
  spelling_lock?: string[];
  rule?: string;
}

export interface VoiceRule {
  rule: string;
  banned?: string[];
}

export interface Cta {
  rule: string;
  allowed: string[];
  forbidden: string[];
}

export interface Channel {
  channel: string;
  rule: string;
  structure: string[];
}

export interface Constitution {
  meta: { name: string; version: string; date: string; source: string; principle: string };
  identity: Record<string, IdentityRule>;
  // note/reference strings live beside the rule objects in the JSON
  claims_registry: Record<string, Claim | string>;
  voice: Record<string, VoiceRule | string>;
  cta: { "CH-CTA": Cta };
  channels: Record<string, Channel>;
}

export const CONSTITUTION = raw as unknown as Constitution;

export const CHANNEL_IDS: Record<ChannelKey, string> = {
  linkedin: "CH-LI",
  email: "CH-EM",
  jd: "CH-JD",
  web: "CH-WEB",
};

export const channelOf = (c: Constitution, key: ChannelKey): Channel =>
  c.channels[CHANNEL_IDS[key]];

/** CL-* entries only, skipping the registry's prose `note`. */
export const claimEntries = (c: Constitution): [string, Claim][] =>
  Object.entries(c.claims_registry).filter(
    (e): e is [string, Claim] => typeof e[1] === "object"
  );

/** VX-* entries only, skipping the prose `reference`. */
export const voiceEntries = (c: Constitution): [string, VoiceRule][] =>
  Object.entries(c.voice).filter(
    (e): e is [string, VoiceRule] => typeof e[1] === "object"
  );
