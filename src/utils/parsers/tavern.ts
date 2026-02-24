import type { ChatMessage, ChatRole } from "../../types";
import { makeId } from "../id";
import { parseByPrefix, type PrefixRule } from "./base";

const legacyRules: PrefixRule[] = [
  { prefix: "You:", role: "user", speaker: "You" },
  { prefix: "You：", role: "user", speaker: "You" },
  { prefix: "Char:", role: "assistant", speaker: "Char" },
  { prefix: "Char：", role: "assistant", speaker: "Char" },
  { prefix: "Narrator:", role: "system", speaker: "Narrator" },
  { prefix: "Narrator：", role: "system", speaker: "Narrator" }
];

const SPEAKER_PATTERN = /^([^:：]{1,40})[:：]\s+(.*)$/;

function createMessage(role: ChatRole, speaker: string, content: string, raw: string): ChatMessage {
  return {
    id: makeId("msg"),
    role,
    speaker,
    content,
    source: "tavern",
    raw
  };
}

function roleFromSpeaker(speaker: string): ChatRole {
  const lower = speaker.toLowerCase();
  if (lower === "esther" || lower === "you" || lower === "user" || speaker === "我" || speaker === "你") {
    return "user";
  }
  if (lower.includes("system") || lower.includes("narrator") || speaker.includes("旁白")) {
    return "system";
  }
  return "assistant";
}

export function parseTavern(rawText: string): ChatMessage[] {
  const lines = rawText.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(SPEAKER_PATTERN);
    if (match) {
      const speaker = match[1].trim();
      const content = match[2].trim();
      const role = roleFromSpeaker(speaker);
      current = createMessage(role, speaker, content, line);
      messages.push(current);
      continue;
    }

    if (current) {
      current.content = current.content ? `${current.content}\n${trimmed}` : trimmed;
      current.raw = `${current.raw}\n${line}`;
    }
  }

  if (!messages.length) {
    return parseByPrefix("tavern", rawText, legacyRules);
  }

  return messages;
}
