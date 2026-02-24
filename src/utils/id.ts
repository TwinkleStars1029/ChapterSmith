export function makeId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const seed = Math.random().toString(36).slice(2);
  return `${prefix}_${seed}`;
}
