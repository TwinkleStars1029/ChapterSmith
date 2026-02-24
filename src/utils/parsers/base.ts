import type { ChatMessage, ChatRole, SourceApp } from "../../types";
import { makeId } from "../id";

export interface PrefixRule {
  prefix: string;
  role: ChatRole;
  speaker?: string;
}

function createMessage(
  source: SourceApp,
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
    source,
    raw
  };
}

export function parseByPrefix(
  source: SourceApp,
  rawText: string,
  rules: PrefixRule[]
): ChatMessage[] {
  const lines = rawText.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const matched = rules.find((rule) => trimmed.startsWith(rule.prefix));
    if (matched) {
      const content = trimmed.slice(matched.prefix.length).trim();
      current = createMessage(
        source,
        matched.role,
        matched.speaker ?? matched.prefix.replace(/[:：]/g, ""),
        content,
        line
      );
      messages.push(current);
      continue;
    }

    if (current) {
      current.content = `${current.content}\n${trimmed}`;
      current.raw = `${current.raw}\n${line}`;
    } else {
      current = createMessage(source, "unknown", "Unknown", trimmed, line);
      messages.push(current);
    }
  }

  return messages;
}
