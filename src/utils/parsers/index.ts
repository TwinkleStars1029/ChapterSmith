import type { ChatMessage, SourceApp } from "../../types";
import { parseGpt } from "./gpt";
import { parseQingqing } from "./qingqing";
import { parseTavern } from "./tavern";
import { parseGemini } from "./gemini";
import { parseChatBackup } from "./chatbackup";

export function parseBySource(source: SourceApp, rawText: string): ChatMessage[] {
  switch (source) {
    case "gpt":
      return parseGpt(rawText);
    case "qingqing":
      return parseQingqing(rawText);
    case "tavern":
      return parseTavern(rawText);
    case "gemini":
      return parseGemini(rawText);
    case "chatbackup":
      return parseChatBackup(rawText);
    default:
      return [];
  }
}
