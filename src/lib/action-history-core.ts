export type Row = Record<string, unknown> & { id: string };
export type Snapshot = Record<string, Row[]>;
export type Change = { table: string; expected: Row | null; target: Row | null };

function normalized(row: Row | undefined) {
  if (!row) return null;
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'updated_at').sort(([a], [b]) => a.localeCompare(b)));
}

/** Only affected rows are restored, not an entire backup or unrelated new data. */
export function recoveryChanges(before: Snapshot, after: Snapshot): Change[] {
  const changes: Change[] = [];
  for (const table of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const oldRows = new Map((before[table] ?? []).map(row => [row.id, row]));
    const newRows = new Map((after[table] ?? []).map(row => [row.id, row]));
    for (const id of new Set([...oldRows.keys(), ...newRows.keys()])) {
      const target = oldRows.get(id);
      const expected = newRows.get(id);
      if (JSON.stringify(normalized(target)) !== JSON.stringify(normalized(expected))) {
        changes.push({ table, expected: expected ?? null, target: target ?? null });
      }
    }
  }
  return changes;
}

export function reverseChanges(changes: Change[]): Change[] {
  return changes.map(({ table, expected, target }) => ({ table, expected: target, target: expected }));
}