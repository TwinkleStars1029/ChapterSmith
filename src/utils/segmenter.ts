import type { Chapter, ChatMessage } from "../types";
import { makeId } from "./id";

const TITLE_SNIPPET_LENGTH = 10;

function defaultTitle(index: number, messages: ChatMessage[]): string {
  return `第${index + 1}章`;
}

export function segmentMessages(messages: ChatMessage[], chapterSize: number): Chapter[] {
  const size = Math.max(1, Math.floor(chapterSize || 1));
  const chapters: Chapter[] = [];

  for (let i = 0; i < messages.length; i += size) {
    const slice = messages.slice(i, i + size);
    chapters.push({
      id: makeId("chapter"),
      title: defaultTitle(chapters.length, slice),
      messages: slice
    });
  }

  return chapters;
}

export function adjustChapterSize(
  chapters: Chapter[],
  index: number,
  delta: number
): Chapter[] {
  if (index < 0 || index >= chapters.length) return chapters;
  const nextIndex = index + 1;
  if (nextIndex >= chapters.length) return chapters;

  const current = chapters[index];
  const next = chapters[nextIndex];

  if (delta === 0) return chapters;

  if (delta > 0) {
    const moveCount = Math.min(delta, next.messages.length);
    if (moveCount === 0) return chapters;
    const moved = next.messages.slice(0, moveCount);
    const updatedCurrent: Chapter = {
      ...current,
      messages: [...current.messages, ...moved]
    };
    const updatedNext: Chapter = {
      ...next,
      messages: next.messages.slice(moveCount)
    };
    const updated = chapters.slice();
    updated[index] = updatedCurrent;
    if (updatedNext.messages.length === 0) {
      updated.splice(nextIndex, 1);
    } else {
      updated[nextIndex] = updatedNext;
    }
    return updated;
  }

  const available = Math.max(0, current.messages.length - 1);
  const moveCount = Math.min(Math.abs(delta), available);
  if (moveCount === 0) return chapters;
  const moved = current.messages.slice(-moveCount);
  const updatedCurrent: Chapter = {
    ...current,
    messages: current.messages.slice(0, -moveCount)
  };
  const updatedNext: Chapter = {
    ...next,
    messages: [...moved, ...next.messages]
  };
  const updated = chapters.slice();
  updated[index] = updatedCurrent;
  updated[nextIndex] = updatedNext;
  return updated;
}
