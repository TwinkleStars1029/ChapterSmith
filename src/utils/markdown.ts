import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({
  breaks: true,
  gfm: true
});

export function renderMarkdown(input: string): string {
  if (!input) return "";
  const raw = marked.parse(input);
  return DOMPurify.sanitize(raw);
}
