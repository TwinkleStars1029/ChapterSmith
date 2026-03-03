export function sanitizeFilename(input: string): string {
  const trimmed = input.trim();
  const safe = trimmed.replace(/[\\/:*?"<>|]/g, "_");
  return safe.length ? safe : "untitled";
}

export function chapterFilename(index: number, title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return `ch${index}.txt`;
  const safe = sanitizeFilename(trimmed);
  return `ch${index}_${safe}.txt`;
}
