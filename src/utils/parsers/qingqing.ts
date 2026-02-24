import type { ChatMessage, ChatRole } from "../../types";
import { makeId } from "../id";
import { parseByPrefix, type PrefixRule } from "./base";

const legacyRules: PrefixRule[] = [
  { prefix: "我:", role: "user", speaker: "我" },
  { prefix: "我：", role: "user", speaker: "我" },
  { prefix: "你:", role: "assistant", speaker: "你" },
  { prefix: "你：", role: "assistant", speaker: "你" },
  { prefix: "AI:", role: "assistant", speaker: "AI" },
  { prefix: "AI：", role: "assistant", speaker: "AI" },
  { prefix: "系統:", role: "system", speaker: "系統" },
  { prefix: "系統：", role: "system", speaker: "系統" }
];

const TIMESTAMP_PATTERN = /^\[(\d{4}-\d{2}-\d{2}[^\]]*)\]\s*(.+?):\s*(.*)$/;
const SEPARATOR_PATTERN = /^=+$/;

function createMessage(
  role: ChatRole,
  speaker: string,
  content: string,
  raw: string
): ChatMessage {
  return {
    id: makeId("msg"),
    role,
    speaker,
    content,
    source: "qingqing",
    raw
  };
}

function roleFromSpeaker(speaker: string): ChatRole {
  const lower = speaker.toLowerCase();
  if (lower.includes("system")) return "system";
  return "unknown";
}

export function parseQingqing(rawText: string): ChatMessage[] {
  const lines = rawText.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (SEPARATOR_PATTERN.test(trimmed)) continue;

    const timestampMatch = trimmed.match(TIMESTAMP_PATTERN);
    if (timestampMatch) {
      const speaker = timestampMatch[2].trim();
      const content = timestampMatch[3]?.trim() ?? "";
      const role = roleFromSpeaker(speaker);
      current = createMessage(role, speaker, content, line);
      messages.push(current);
      continue;
    }

    const legacyMatch = legacyRules.find((rule) => trimmed.startsWith(rule.prefix));
    if (legacyMatch) {
      const content = trimmed.slice(legacyMatch.prefix.length).trim();
      current = createMessage(legacyMatch.role, legacyMatch.speaker ?? "", content, line);
      messages.push(current);
      continue;
    }

    if (current) {
      current.content = current.content ? `${current.content}\n${trimmed}` : trimmed;
      current.raw = `${current.raw}\n${line}`;
    }
  }

  if (!messages.length) {
    return parseByPrefix("qingqing", rawText, legacyRules);
  }

  return messages;
}
