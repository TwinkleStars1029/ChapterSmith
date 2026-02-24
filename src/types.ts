export type ChatRole = "user" | "assistant" | "system" | "unknown";
export type SourceApp = "gpt" | "qingqing" | "tavern" | "gemini" | "chatbackup";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  speaker: string;
  content: string;
  source: SourceApp;
  raw: string;
}

export interface Chapter {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface ImportSettings {
  sourceApp: SourceApp;
  chapterSize: number;
}
