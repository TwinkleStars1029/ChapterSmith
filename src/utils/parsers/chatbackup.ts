import type { ChatMessage, ChatRole } from "../../types";
import { makeId } from "../id";

const Q_HEADER = /^#{2,}\s*Q\s*:\s*(.*)$/i;
const A_HEADER = /^#{2,}\s*A\s*:\s*(.*)$/i;

function createMessage(role: ChatRole, speaker: string, content: string, raw: string): ChatMessage {
  return {
    id: makeId("msg"),
    role,
    speaker,
    content,
    source: "chatbackup",
    raw
  };
}

export function parseChatBackup(rawText: string): ChatMessage[] {
  const lines = rawText.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const qMatch = trimmed.match(Q_HEADER);
    if (qMatch) {
      const initial = qMatch[1]?.trim() ?? "";
      current = createMessage("user", "Q", initial, line);
      messages.push(current);
      continue;
    }

    const aMatch = trimmed.match(A_HEADER);
    if (aMatch) {
      const initial = aMatch[1]?.trim() ?? "";
      current = createMessage("assistant", "A", initial, line);
      messages.push(current);
      continue;
    }

    if (!current) continue;

    if (!trimmed && !current.content) {
      continue;
    }

    if (!current.content) {
      current.content = line.trimEnd();
    } else {
      current.content = `${current.content}\n${line.trimEnd()}`;
    }
    current.raw = `${current.raw}\n${line}`;
  }

  return messages.map((message) => ({
    ...message,
    content: message.content.trimEnd()
  }));
}
