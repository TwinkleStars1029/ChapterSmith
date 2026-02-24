import { parseByPrefix, type PrefixRule } from "./base";
import type { ChatMessage } from "../../types";

const rules: PrefixRule[] = [
  { prefix: "User:", role: "user", speaker: "User" },
  { prefix: "User：", role: "user", speaker: "User" },
  { prefix: "Assistant:", role: "assistant", speaker: "Assistant" },
  { prefix: "Assistant：", role: "assistant", speaker: "Assistant" },
  { prefix: "System:", role: "system", speaker: "System" },
  { prefix: "System：", role: "system", speaker: "System" }
];

export function parseGpt(rawText: string): ChatMessage[] {
  return parseByPrefix("gpt", rawText, rules);
}
