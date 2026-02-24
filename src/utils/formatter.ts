import type { Chapter, ChatMessage } from "../types";

function labelForMessage(message: ChatMessage): string {
  if (message.speaker) return message.speaker;
  switch (message.role) {
    case "user":
      return "User";
    case "assistant":
      return "Assistant";
    case "system":
      return "System";
    default:
      return "Unknown";
  }
}

export function formatChapterText(chapter: Chapter): string {
  return chapter.messages
    .map((message) => {
      const label = labelForMessage(message);
      const content = message.content.replace(/\r\n/g, "\n");
      return `[${label}] ${content}`;
    })
    .join("\n");
}
