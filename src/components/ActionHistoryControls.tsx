import { Undo2, Redo2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moveHistory, useActionHistory } from '@/lib/action-history';

export function ActionHistoryControls() {
  const history = useActionHistory();
  return <>
    <Button variant="ghost" size="icon" aria-label="Desfazer exclusão" title={history.undo.at(-1)?.label ? `Desfazer: ${history.undo.at(-1)?.label}` : 'Desfazer exclusão'} disabled={!history.undo.length || history.busy} onClick={() => { void moveHistory('undo'); }}>
      {history.busy ? <Loader2 className="animate-spin" /> : <Undo2 />}
    </Button>
    <Button variant="ghost" size="icon" aria-label="Refazer exclusão" title="Refazer exclusão" disabled={!history.redo.length || history.busy} onClick={() => { void moveHistory('redo'); }}><Redo2 /></Button>
  </>;
}