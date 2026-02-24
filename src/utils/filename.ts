export function sanitizeFilename(input: string): string {
  const trimmed = input.trim();
  const safe = trimmed.replace(/[\\/:*?"<>|]/g, "_");
  return safe.length ? safe : "untitled";
}

export function chapterFilename(index: number, title: string): string {
  const safe = sanitizeFilename(title);
  return `ch${index}_${safe}.txt`;
}
