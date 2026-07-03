import { useState } from "react";
import type { Transaction, Category, Card, Bank, PaymentMethod, TxType, Essential } from "@/lib/store";
import { X, Save } from "lucide-react";

export interface TxEditModalProps {
  tx: Transaction;
  categories: Category[];
  cards: Card[];
  banks: Bank[];
  onSave: (patch: Partial<Transaction>) => void | Promise<void>;
  onClose: () => void;
}

export function TxEditModal({ tx, categories, cards, banks, onSave, onClose }: TxEditModalProps) {
  const [form, setForm] = useState({
    date: tx.date,
    description: tx.description,
    amount: String(tx.amount),
    categoryId: tx.categoryId ?? "",
    tag: tx.tag ?? "",
    essential: (tx.essential ?? "essential") as Essential,
    paymentMethod: (tx.paymentMethod ?? "debit") as PaymentMethod,
    cardId: tx.cardId ?? "",
    bankId: tx.bankId ?? "",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseBRL(form.amount);
    if (!amt || amt <= 0) return;
    const patch: Partial<Transaction> = {
      date: form.date, description: form.description.trim(), amount: amt,
      categoryId: form.categoryId || undefined, tag: form.tag.trim() || undefined,
    };
    if (tx.type === "expense") {
      patch.essential = form.essential;
      patch.paymentMethod = form.paymentMethod;
      patch.cardId = form.paymentMethod === "credit" ? form.cardId || undefined : undefined;
      patch.bankId = form.paymentMethod !== "credit" && form.paymentMethod !== "cash" ? form.bankId || undefined : undefined;
    } else {
      patch.bankId = form.bankId || undefined;
    }
    await onSave(patch);
    onClose();
  }

  const cats = categories.filter(c => tx.type === "income" ? c.kind !== "expense" : c.kind !== "income");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={onClose}>
      <form onSubmit={save} onClick={e => e.stopPropagation()}
        className="w-full max-w-md glass-strong rounded-3xl p-6 space-y-3 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">Editar {tx.type === "income" ? "ganho" : "gasto"}{tx.installmentTotal ? ` (parcela ${tx.installmentNo}/${tx.installmentTotal})` : ""}</h3>
          <button type="button" data-no-sound onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10"><X className="size-4" /></button>
        </div>

        <Row label="Data"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inp} /></Row>
        <Row label="Descrição"><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inp} /></Row>
        <Row label="Valor (R$)"><input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} inputMode="decimal" className={inp} /></Row>
        <Row label="Categoria">
          <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className={inp}>
            <option value="">Sem categoria</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Row>
        <Row label="Etiqueta"><input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="parâmetro livre" className={inp} /></Row>

        {tx.type === "expense" && (
          <>
            <Row label="Tipo">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm({ ...form, essential: "essential" })}
                  className={`rounded-xl py-2 text-xs font-mono border transition ${form.essential === "essential" ? "bg-[#006F77]/20 border-[#006F77]" : "border-border"}`}>Essencial</button>
                <button type="button" onClick={() => setForm({ ...form, essential: "non_essential" })}
                  className={`rounded-xl py-2 text-xs font-mono border transition ${form.essential === "non_essential" ? "bg-[#820432]/20 border-[#820432]" : "border-border"}`}>Não essencial</button>
              </div>
            </Row>
            <Row label="Método de pagamento">
              <div className="grid grid-cols-4 gap-2">
                {(["credit","debit","pix","cash"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setForm({ ...form, paymentMethod: m })}
                    className={`rounded-xl py-2 text-[11px] font-mono border transition ${form.paymentMethod === m ? "bg-primary/20 border-primary text-foreground" : "border-border text-muted-foreground hover:bg-white/5"}`}>
                    {m === "credit" ? "Crédito" : m === "debit" ? "Débito" : m === "pix" ? "Pix" : "Dinheiro"}
                  </button>
                ))}
              </div>
            </Row>
            {form.paymentMethod === "credit" && cards.length > 0 && (
              <Row label="Cartão">
                <select value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })} className={inp}>
                  <option value="">—</option>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Row>
            )}
            {(form.paymentMethod === "debit" || form.paymentMethod === "pix") && banks.length > 0 && (
              <Row label="Banco">
                <select value={form.bankId} onChange={e => setForm({ ...form, bankId: e.target.value })} className={inp}>
                  <option value="">—</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Row>
            )}
          </>
        )}
        {tx.type === "income" && banks.length > 0 && (
          <Row label="Banco (opcional)">
            <select value={form.bankId} onChange={e => setForm({ ...form, bankId: e.target.value })} className={inp}>
              <option value="">—</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Row>
        )}

        <button type="submit" data-sound="success" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 mt-2 glow-violet flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <Save className="size-4" /> Salvar alterações
        </button>
      </form>
    </div>
  );
}

const inp = "w-full rounded-xl bg-white/5 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white/10 font-mono";
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}

