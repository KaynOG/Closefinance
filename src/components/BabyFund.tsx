import { appConfirm } from "@/lib/app-dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, parseBRL } from "@/lib/store";
import { PiggyBank, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Saving = { id: string; month: string; amount: number; note: string | null };
const soft = (c: string, p = 18) => `color-mix(in oklab, ${c} ${p}%, transparent)`;
const curMonth = () => new Date().toISOString().slice(0, 7);
const fmtMonth = (m: string) => { const [y, mo] = m.split("-"); return `${mo}/${y}`; };

export function BabyFund({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Saving[]>([]);
  const [month, setMonth] = useState(curMonth());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    supabase.from("baby_savings").select("id,month,amount,note").eq("user_id", userId).order("month", { ascending: false })
      .then(({ data }) => setRows((data ?? []).map(d => ({ ...d, amount: Number(d.amount) }))));
  }, [userId]);

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const thisMonth = rows.filter(r => r.month === curMonth()).reduce((s, r) => s + r.amount, 0);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const v = parseBRL(amount);
    if (v <= 0 || !month) { toast.error("Informe um valor"); return; }
    const { data, error } = await supabase.from("baby_savings").insert({ user_id: userId, month, amount: v, note: note.trim() || null }).select("id,month,amount,note").single();
    if (error || !data) { toast.error("Não foi possível salvar"); return; }
    setRows(p => [{ ...data, amount: Number(data.amount) }, ...p].sort((a, b) => b.month.localeCompare(a.month)));
    setAmount(""); setNote("");
    toast.success("Fundo do bebê atualizado 🐷");
  }
  async function remove(id: string) {
    if (!await appConfirm("Apagar este registro do fundo?")) return;
    const { error } = await supabase.from("baby_savings").delete().eq("id", id);
    if (!error) setRows(p => p.filter(r => r.id !== id));
  }

  const field = "w-full rounded-2xl border-2 bg-background/60 px-4 py-2.5 text-sm outline-none";
  const c = "var(--baby-butter)";
  return (
    <div className="rounded-3xl border-2 p-5 mb-6" style={{ borderColor: soft(c, 60), background: soft(c, 12) }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-semibold flex items-center gap-2"><PiggyBank className="size-5" style={{ color: c }} /> Fundo para o bebê</h2>
        <div className="flex gap-4 text-sm font-mono">
          <span>Este mês: <strong>{formatBRL(thisMonth)}</strong></span>
          <span>Total poupado: <strong>{formatBRL(total)}</strong></span>
        </div>
      </div>
      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className={field} style={{ borderColor: soft(c, 60) }} aria-label="Mês" />
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Valor poupado (R$)" inputMode="decimal" className={field} style={{ borderColor: soft(c, 60) }} />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Observação (opcional)" className={field} style={{ borderColor: soft(c, 60) }} />
        <button type="submit" className="rounded-full bg-primary text-primary-foreground font-semibold py-2.5 text-sm">Poupar 🐷</button>
      </form>
      {rows.length > 0 && <ul className="space-y-2">
        {rows.map(r => <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-2 text-sm" style={{ background: soft(c, 18) }}>
          <span className="font-mono">{fmtMonth(r.month)}</span>
          <span className="flex-1 truncate text-muted-foreground">{r.note}</span>
          <span className="font-mono font-semibold">{formatBRL(r.amount)}</span>
          <button onClick={() => remove(r.id)} aria-label="Apagar" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
        </li>)}
      </ul>}
    </div>
  );
}
