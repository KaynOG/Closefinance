import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatBRL, parseBRL } from "@/lib/store";
import { notify } from "@/lib/notify";

type Installment = { id: string; number: number; amount: number; dueDate: string };
type Props = {
  name: string;
  kind: "debt" | "receivable";
  installments: Installment[];
  onRename: (name: string) => void | Promise<void>;
  onUpdate: (installment: Installment, patch: { amount?: number; dueDate?: string }) => void | Promise<void>;
};
export function InstallmentRecordEditor({ name, kind, installments, onRename, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [rows, setRows] = useState<Array<{ id: string; amount: string; dueDate: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function start() {
    setDraftName(name);
    setRows(installments.map(i => ({ id: i.id, amount: i.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, useGrouping: false }), dueDate: i.dueDate })));
    setError(""); setOpen(true);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draftName.trim() || rows.some(r => !r.dueDate || !Number.isFinite(parseBRL(r.amount)) || parseBRL(r.amount) <= 0)) {
      setError("Informe o nome, uma data e um valor maior que zero para cada parcela."); return;
    }
    setBusy(true); setError("");
    try {
      if (draftName.trim() !== name) await onRename(draftName.trim());
      for (const row of rows) {
        const original = installments.find(i => i.id === row.id);
        if (!original) continue;
        const amount = parseBRL(row.amount);
        if (amount !== original.amount || row.dueDate !== original.dueDate) await onUpdate(original, { amount, dueDate: row.dueDate });
      }
      setOpen(false); notify("Alterações salvas e lançamentos atualizados.");
    } catch { setError("Não foi possível salvar todas as alterações. Confira os dados e tente novamente."); }
    finally { setBusy(false); }
  }
  const label = kind === "debt" ? "dívida" : "devedor";
  const field = "mt-1 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
  return <>
    <Button variant="outline" size="sm" title={`Editar ${label}`} aria-label={`Editar ${label}`} onClick={start}><Pencil className="size-4" /> Editar</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto rounded-lg bg-background text-foreground">
        <DialogHeader><DialogTitle>Editar {label}</DialogTitle><DialogDescription>{name}</DialogDescription></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm">Nome<input required value={draftName} onChange={e => setDraftName(e.target.value)} className={field} /></label>
          <div className="space-y-4">
            {rows.map((row, index) => <fieldset key={row.id} className="border-t border-border pt-3">
              <legend className="text-xs font-mono text-muted-foreground">Parcela {installments[index]?.number ?? index + 1}</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="min-w-0 text-sm">Data<input required aria-label={`Data da parcela ${index + 1}`} type="date" value={row.dueDate} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, dueDate: e.target.value } : r))} className={field} /></label>
                <label className="min-w-0 text-sm">Valor (R$)<input required aria-label={`Valor da parcela ${index + 1}`} inputMode="decimal" value={row.amount} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, amount: e.target.value } : r))} className={field} /></label>
              </div>
            </fieldset>)}
          </div>
          <p className="text-sm font-mono">Total: {formatBRL(rows.reduce((sum, r) => sum + (parseBRL(r.amount) || 0), 0))}</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar alterações"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}