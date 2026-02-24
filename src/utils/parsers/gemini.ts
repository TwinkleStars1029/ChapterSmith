import type { ChatMessage } from "../../types";
import { makeId } from "../id";

const USER_PREFIXES = ["你：", "你:"];
const ASSISTANT_PATTERN = /^(.*)\(GEMINI\)[:：]/;

function createMessage(
  role: "user" | "assistant",
  speaker: string,
  content: string,
  raw: string
): ChatMessage {
  return {
    id: makeId("msg"),
    role,
    speaker,
    content,
    source: "gemini",
    raw
  };
}

export function parseGemini(rawText: string): ChatMessage[] {
  const lines = rawText.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === "---") continue;

    const userPrefix = USER_PREFIXES.find((prefix) => trimmed.startsWith(prefix));
    if (userPrefix) {
      const content = trimmed.slice(userPrefix.length).trim();
      current = createMessage("user", "你", content, line);
      messages.push(current);
      continue;
    }

    const assistantMatch = trimmed.match(ASSISTANT_PATTERN);
    if (assistantMatch) {
      const speaker = assistantMatch[1].trim() || "Gemini";
      const content = trimmed.slice(assistantMatch[0].length).trim();
      current = createMessage("assistant", speaker, content, line);
      messages.push(current);
      continue;
    }

    if (current) {
      current.content = current.content ? `${current.content}\n${trimmed}` : trimmed;
      current.raw = `${current.raw}\n${line}`;
    }
  }

  return messages;
}
