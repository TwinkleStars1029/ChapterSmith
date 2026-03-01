import type { Chapter, ChatMessage, ImportSettings, SourceApp } from "../types";

const PROJECT_KEY = "chaptersmith_project_v1";

export interface ProjectFile {
  version: 1;
  meta: {
    createdAt: string;
    fileName?: string;
  };
  settings: ImportSettings;
  rawText: string;
  messages: ChatMessage[];
  chapters: Chapter[];
  selectedChapterId: string | null;
}

export function buildProject(payload: {
  settings: ImportSettings;
  rawText: string;
  messages: ChatMessage[];
  chapters: Chapter[];
  selectedChapterId: string | null;
  fileName?: string;
}): ProjectFile {
  return {
    version: 1,
    meta: {
      createdAt: new Date().toISOString(),
      fileName: payload.fileName
    },
    settings: payload.settings,
    rawText: payload.rawText,
    messages: payload.messages,
    chapters: payload.chapters,
    selectedChapterId: payload.selectedChapterId
  };
}

export function saveProject(project: ProjectFile): void {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
  } catch {
    // ignore write errors
  }
}

export function loadProject(): ProjectFile | null {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProjectFile;
    if (parsed?.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearProject(): void {
  try {
    localStorage.removeItem(PROJECT_KEY);
  } catch {
    // ignore
  }
}

export function validateProjectFile(input: unknown): input is ProjectFile {
  if (!input || typeof input !== "object") return false;
  const project = input as ProjectFile;
  if (project.version !== 1) return false;
  if (!project.settings) return false;
  if (typeof project.rawText !== "string") return false;
  return true;
}

export function isSourceApp(value: string): value is SourceApp {
  return ["gpt", "qingqing", "tavern", "gemini", "chatbackup"].includes(value);
}
