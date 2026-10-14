export type RecordOrder = "oldest" | "newest" | "custom";

export function orderRecords<T extends { id: string; createdAt: string; sortOrder?: number }>(records: T[], order: RecordOrder): T[] {
  return [...records].sort((a, b) => {
    const date = a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
    return order === "custom" ? (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || date : order === "newest" ? -date : date;
  });
}

export function moveRecord<T extends { id: string }>(records: T[], id: string, direction: -1 | 1): string[] {
  const ids = records.map(record => record.id);
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return ids;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return ids;
}