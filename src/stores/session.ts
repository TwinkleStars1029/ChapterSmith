import { defineStore } from "pinia";
import type { Chapter, ChatMessage, ImportSettings, SourceApp } from "../types";
import { adjustChapterSize } from "../utils/segmenter";

const defaultSettings: ImportSettings = {
  sourceApp: "gpt",
  chapterSize: 20
};

export const useSessionStore = defineStore("session", {
  state: () => ({
    settings: { ...defaultSettings } as ImportSettings,
    rawText: "",
    messages: [] as ChatMessage[],
    chapters: [] as Chapter[],
    selectedChapterId: null as string | null,
    parseError: "" as string
  }),
  getters: {
    selectedChapter(state): Chapter | null {
      if (!state.selectedChapterId) return null;
      return state.chapters.find((chapter) => chapter.id === state.selectedChapterId) ?? null;
    }
  },
  actions: {
    setSettings(settings: Partial<ImportSettings>) {
      this.settings = { ...this.settings, ...settings };
    },
    setRawText(rawText: string) {
      this.rawText = rawText;
    },
    setMessages(messages: ChatMessage[]) {
      this.messages = messages;
    },
    setChapters(chapters: Chapter[]) {
      this.chapters = chapters;
      this.selectedChapterId = chapters[0]?.id ?? null;
    },
    selectChapter(id: string) {
      this.selectedChapterId = id;
    },
    updateChapterTitle(id: string, title: string) {
      this.chapters = this.chapters.map((chapter) =>
        chapter.id === id ? { ...chapter, title } : chapter
      );
    },
    adjustChapter(index: number, delta: number) {
      const updated = adjustChapterSize(this.chapters, index, delta);
      this.chapters = updated;
      if (!this.selectedChapterId && updated[0]) {
        this.selectedChapterId = updated[0].id;
      }
      if (this.selectedChapterId) {
        const exists = updated.some((chapter) => chapter.id === this.selectedChapterId);
        if (!exists) {
          this.selectedChapterId = updated[0]?.id ?? null;
        }
      }
    },
    resetAll() {
      this.rawText = "";
      this.messages = [];
      this.chapters = [];
      this.selectedChapterId = null;
      this.parseError = "";
    },
    setParseError(message: string) {
      this.parseError = message;
    }
  }
});
