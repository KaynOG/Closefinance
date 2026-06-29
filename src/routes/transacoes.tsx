import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { useStore, formatBRL, computeInvoicesForMonth, type TxType, type Essential, type VirtualInvoiceRow } from "@/lib/store";
import { useMemo, useState } from "react";
import { Plus, Trash2, ArrowDownCircle, ArrowUpCircle, Receipt } from "lucide-react";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/transacoes")({
  head: () => ({ meta: [{ title: "Transações — CloseFinance" }, { name: "description", content: "Cadastre entradas, salários e gastos." }] }),
  component: TxPage,
});

type TxFilter = "all" | TxType | "invoices";

function TxPage() {
  const [{ transactions, categories, cards }, api] = useStore();
  const [filter, setFilter] = useState<TxFilter>("all");

  const [form, setForm] = useState({
    type: "expense" as TxType,
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    categoryId: "",
    essential: "essential" as Essential,
    cardId: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(form.amount.replace(",", "."));
    if (!amt || amt <= 0) return;
    api.addTransaction({
      type: form.type,
      amount: amt,
      description: form.description.trim(),
      date: form.date,
      categoryId: form.categoryId || undefined,
      essential: form.type === "expense" ? form.essential : undefined,
      cardId: form.type === "expense" ? form.cardId || undefined : undefined,
    });
    notify(
      form.type === "income"
        ? `Ganho de ${formatBRL(amt)} adicionado com sucesso!`
        : `Gasto de ${formatBRL(amt)} registrado com sucesso!`
    );
    setForm({ ...form, amount: "", description: "" });
  }

  type ListItem = (typeof transactions)[number] | VirtualInvoiceRow;
  const invoices = useMemo<VirtualInvoiceRow[]>(() => {
    const now = new Date();
    const out: VirtualInvoiceRow[] = [];
    for (let i = -2; i <= 11; i++) {
      const ref = new Date(now.getFullYear(), now.getMonth() + i, 1);
      out.push(...computeInvoicesForMonth(transactions, cards, ref));
    }
    return out;
  }, [transactions, cards]);

  const filtered: ListItem[] = ([...transactions, ...(filter === "income" ? [] : invoices)] as ListItem[])
    .filter(t => filter === "all" ? true : t.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Lançamentos</p>
        <h1 className="text-3xl font-bold">Transações</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        <GlassCard>
          <SectionTitle title="Novo lançamento" subtitle="entrada ou gasto" />
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ ...form, type: "income" })}
                className={`rounded-xl p-3 text-sm font-medium border transition ${form.type === "income" ? "bg-[#2BD9A1]/15 border-[#2BD9A1] text-[#2BD9A1]" : "border-border hover:bg-white/5"}`}>
                <ArrowDownCircle className="size-4 inline mr-1.5" /> Entrada
              </button>
              <button type="button" onClick={() => setForm({ ...form, type: "expense" })}
                className={`rounded-xl p-3 text-sm font-medium border transition ${form.type === "expense" ? "bg-[#820432]/20 border-[#820432] text-[#FF8FA3]" : "border-border hover:bg-white/5"}`}>
                <ArrowUpCircle className="size-4 inline mr-1.5" /> Gasto
              </button>
            </div>

            <Field label="Valor (R$)"><input required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00" inputMode="decimal" className={inputCls} /></Field>
            <Field label="Descrição"><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: Salário, Supermercado..." className={inputCls} /></Field>
            <Field label="Data"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} /></Field>
            <Field label="Categoria">
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>

            {form.type === "expense" && (
              <>
                <Field label="Classificação">
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setForm({ ...form, essential: "essential" })}
                      className={`rounded-xl p-2.5 text-xs font-mono border transition ${form.essential === "essential" ? "bg-[#006F77]/20 border-[#006F77]" : "border-border hover:bg-white/5"}`}>Essencial</button>
                    <button type="button" onClick={() => setForm({ ...form, essential: "non_essential" })}
                      className={`rounded-xl p-2.5 text-xs font-mono border transition ${form.essential === "non_essential" ? "bg-[#820432]/20 border-[#820432]" : "border-border hover:bg-white/5"}`}>Não essencial</button>
                  </div>
                </Field>
                {cards.length > 0 && (
                  <Field label="Cartão (opcional)">
                    <select value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })} className={inputCls}>
                      <option value="">À vista / outro</option>
                      {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                )}
              </>
            )}

            <button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 transition glow-violet">
              <Plus className="size-4 inline mr-1.5" /> Adicionar
            </button>
          </form>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Histórico</h2>
            <div className="flex gap-1 rounded-xl bg-white/5 p-1 text-xs font-mono">
              {(["all","income","expense"] as const).map(k => (
                <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-lg transition ${filter === k ? "bg-primary text-primary-foreground" : "hover:bg-white/5"}`}>
                  {k === "all" ? "Todas" : k === "income" ? "Entradas" : "Gastos"}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma transação ainda. Comece adicionando uma ao lado.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {filtered.map((t) => {
                const isInv = "virtual" in t && (t as VirtualInvoiceRow).virtual === true;
                const tx = isInv ? null : (t as (typeof transactions)[number]);
                const cat = tx ? categories.find(c => c.id === tx.categoryId) : undefined;
                const card = cards.find(c => c.id === t.cardId);
                const iconBg = isInv ? "#FF6B1A" : (cat?.color ?? (t.type === "income" ? "#2BD9A1" : "#540BD3"));
                const iconFg = isInv ? "#FF6B1A" : (cat?.color ?? (t.type === "income" ? "#2BD9A1" : "#B388FF"));
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <div className="size-9 rounded-xl grid place-items-center"
                      style={{ background: iconBg + "22", color: iconFg }}>
                      {isInv ? <Receipt className="size-4" /> : t.type === "income" ? <ArrowDownCircle className="size-4" /> : <ArrowUpCircle className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{t.description || (t.type === "income" ? "Entrada" : "Gasto")}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}
                        {isInv
                          ? ` · fatura consolidada${card ? ` · ${card.name}` : ""} · não soma ao mês`
                          : ` · ${cat?.name ?? "Sem categoria"}${card ? ` · ${card.name}` : ""}${tx?.essential ? ` · ${tx.essential === "essential" ? "essencial" : "não essencial"}` : ""}`}
                      </p>
                    </div>
                    <p className={`font-mono text-sm shrink-0 ${t.type === "income" ? "text-[#2BD9A1]" : "text-[#FF8FA3]"}`}>
                      {t.type === "income" ? "+" : "-"}{formatBRL(t.amount)}
                    </p>
                    {!isInv ? (
                      <button onClick={() => api.removeTransaction(t.id)} className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-[#FF4D6D] hover:bg-white/5">
                        <Trash2 className="size-4" />
                      </button>
                    ) : (
                      <div className="shrink-0 w-8" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>
    </AppShell>
  );
}

const inputCls = "w-full rounded-xl bg-white/5 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white/10 transition font-mono";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
