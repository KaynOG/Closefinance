import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { recoveryChanges, reverseChanges, type Change, type Snapshot } from './action-history-core';

type Entry = { label: string; changes: Change[]; local?: { key: string; before: string | null; after: string | null } };
type History = { undo: Entry[]; redo: Entry[]; busy: boolean; revision: number };
const empty: History = { undo: [], redo: [], busy: false, revision: 0 };
let state = empty;
let owner: string | null = null;
const listeners = new Set<() => void>();
function emit(patch: Partial<History>) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); }
export function clearActionHistory() { owner = null; emit({ ...empty, revision: state.revision + 1 }); }
export function useActionHistory() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => state, () => empty);
}
function commit(entry: Entry) {
  if (!entry.changes.length && !entry.local) return;
  emit({ undo: [...state.undo, entry].slice(-20), redo: [] });
  toast.success(entry.label, { action: { label: 'Desfazer', onClick: () => { void moveHistory('undo'); } } });
}
async function snapshot(): Promise<Snapshot> {
  const { data, error } = await supabase.rpc('financial_recovery_snapshot');
  if (error) throw error;
  return data as unknown as Snapshot;
}
/** Serialize destructive actions and refuse deletion if its safety snapshot fails. */
export async function withUndo<T>(label: string, action: () => Promise<T>): Promise<T | undefined> {
  if (state.busy) { toast.info('Aguarde a ação atual terminar.'); return; }
  emit({ busy: true });
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error('Entre novamente para continuar.');
    if (owner && owner !== data.user.id) clearActionHistory();
    owner = data.user.id;
    const before = await snapshot();
    const result = await action();
    const after = await snapshot();
    commit({ label, changes: recoveryChanges(before, after) });
    return result;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Não foi possível concluir a ação com segurança.');
    return;
  } finally { emit({ busy: false }); }
}
export function rememberLocalDeletion(label: string, key: string, before: string | null, after: string | null) {
  if (before === after) return;
  commit({ label, changes: [], local: { key, before, after } });
}
export async function moveHistory(direction: 'undo' | 'redo') {
  const entry = state[direction].at(-1);
  if (!entry || state.busy) return;
  emit({ busy: true });
  try {
    if (entry.local) {
      const { key, before, after } = entry.local;
      const expected = direction === 'undo' ? after : before;
      if (localStorage.getItem(key) !== expected) throw new Error('Este registro mudou. Suas alterações foram preservadas.');
      const value = direction === 'undo' ? before : after;
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
      window.dispatchEvent(new Event('storage'));
    } else {
      const { data } = await supabase.auth.getUser();
      if (!owner || data.user?.id !== owner) throw new Error('Entre novamente na mesma conta.');
      const { error } = await supabase.rpc('restore_financial_action', { p_changes: (direction === 'undo' ? entry.changes : reverseChanges(entry.changes)) as never });
      if (error) throw new Error(error.message);
    }
    emit(direction === 'undo'
      ? { undo: state.undo.slice(0, -1), redo: [...state.redo, entry], revision: state.revision + 1 }
      : { redo: state.redo.slice(0, -1), undo: [...state.undo, entry], revision: state.revision + 1 });
    window.dispatchEvent(new Event('cf:records-restored'));
    toast.success(direction === 'undo' ? 'Exclusão desfeita.' : 'Exclusão refeita.');
  } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível recuperar os dados.'); }
  finally { emit({ busy: false }); }
}