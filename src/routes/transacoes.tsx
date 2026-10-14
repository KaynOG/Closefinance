import { createFileRoute } from "@tanstack/react-router";
import { TutorialBox } from "@/components/TutorialBox";
import { TUTORIALS } from "@/lib/tutorial-content";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { useStore, formatBRL, parseBRL, computeInvoicesForMonth, type TxType, type Essential, type VirtualInvoiceRow } from "@/lib/store";
import { useMemo, useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, Receipt, RefreshCw } from "lucide-react";
import { notify } from "@/lib/notify";
import { FinancialHealthBeta } from "@/components/FinancialHealthBeta";
import { StatementExport } from "@/components/StatementExport";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/transacoes")({
  head: () => ({ meta: [
      { property: "og:title", content: "Transações — CloseFinance" },
      { property: "og:description", content: "Cadastre entradas, salários e gastos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Transações — CloseFinance" }, { name: "description", content: "Cadastre entradas, salários e gastos." }] }),
  component: TxPage,
});

function TxPage() {
  const [{ transactions, categories, cards }, api] = useStore();

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
    const amt = parseBRL(form.amount);
    if (!amt || amt <= 0) return;
    api.addTransaction({
      type: form.type,
      amount: amt,
      description: form.description.trim(),
      date: form.date,
      categoryId: form.categoryId || undefined,
      essential: form.type === "expense" ? form.essential : undefined,
      cardId: form.type === "expense" ? form.cardId || undefined : undefined,
      paymentMethod: form.type === "expense" && form.cardId ? "credit" : undefined,
    });
    notify(
      form.type === "income"
        ? `Ganho de ${formatBRL(amt)} adicionado com sucesso!`
        : `Gasto de ${formatBRL(amt)} registrado com sucesso!`
    );
    setForm({ ...form, amount: "", description: "" });
  }

  const invoices = useMemo<VirtualInvoiceRow[]>(() => {
    const months = new Set(transactions.filter(t => t.type === "expense" && t.paymentMethod === "credit").map(t => t.date.slice(0, 7)));
    return [...months].flatMap(month => computeInvoicesForMonth(transactions, cards, new Date(`${month}-01T12:00:00`)));
  }, [transactions, cards]);

  const currentInvoices = useMemo<VirtualInvoiceRow[]>(() => {
    return computeInvoicesForMonth(transactions, cards, new Date());
  }, [transactions, cards]);
  const currentInvoicesTotal = currentInvoices.reduce((s, i) => s + i.amount, 0);

  const nowLabel = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const [syncing, setSyncing] = useState(false);
  async function syncInvoices() {
    setSyncing(true);
    try {
      await api.refresh?.();
      notify(`Fatura sincronizada — ${formatBRL(currentInvoicesTotal)} no mês.`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AppShell>
      <TutorialBox {...TUTORIALS.transacoes} />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Lançamentos</p>
          <h1 className="text-3xl font-bold">Transações (BETA)</h1>
        </div>
        <StatementExport mode="all" />
      </header>

      {/* Fatura atual */}
      <GlassCard className="mb-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary"><Receipt className="size-4" /></div>
            <div>
              <h2 className="text-base font-semibold">Fatura atual</h2>
              <p className="text-[11px] font-mono text-muted-foreground capitalize">{nowLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={syncInvoices}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted/40 hover:bg-muted border border-border px-2.5 py-1.5 text-xs font-mono transition disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
            <p className="font-mono text-lg text-danger" >{formatBRL(currentInvoicesTotal)}</p>
          </div>
        </div>
        {currentInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem gastos no crédito neste mês ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {currentInvoices.map(inv => {
              const card = cards.find(c => c.id === inv.cardId);
              return (
                <li key={inv.id} className="flex items-center gap-3 py-2.5">
                  <div className="size-8 rounded-lg grid place-items-center bg-primary/15 text-primary" style={card?.color ? { background: `color-mix(in oklab, ${card.color} 15%, transparent)`, color: card.color } : undefined}>
                    <Receipt className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{inv.description}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">Fecha {new Date(inv.date + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                  </div>
                  <p className="font-mono text-sm shrink-0 text-danger" >{formatBRL(inv.amount)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

      <div className="space-y-4">
        <FinancialHealthBeta transactions={transactions} categories={categories} cards={cards} />

        <TransactionHistory transactions={transactions} invoices={invoices} categories={categories} cards={cards} onRemove={api.removeTransaction} />

        <GlassCard>
          <SectionTitle title="Novo lançamento" subtitle="entrada ou gasto" />
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" onClick={() => setForm({ ...form, type: "income" })}
                className={`rounded-xl p-3 text-sm font-medium border transition ${form.type === "income" ? "bg-success/15 border-success text-success" : "border-border hover:bg-muted/40"}`}>
                <ArrowDownCircle className="size-4 inline mr-1.5" /> Entrada
              </Button>
              <Button type="button" onClick={() => setForm({ ...form, type: "expense" })}
                className={`rounded-xl p-3 text-sm font-medium border transition ${form.type === "expense" ? "bg-danger/15 border-danger text-danger" : "border-border hover:bg-muted/40"}`}>
                <ArrowUpCircle className="size-4 inline mr-1.5" /> Gasto
              </Button>
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
                    <Button type="button" onClick={() => setForm({ ...form, essential: "essential" })}
                      className={`rounded-xl p-2.5 text-xs font-mono border transition ${form.essential === "essential" ? "bg-primary/20 border-primary" : "border-border hover:bg-muted/40"}`}>Essencial</Button>
                    <Button type="button" onClick={() => setForm({ ...form, essential: "non_essential" })}
                      className={`rounded-xl p-2.5 text-xs font-mono border transition ${form.essential === "non_essential" ? "bg-danger/20 border-danger" : "border-border hover:bg-muted/40"}`}>Não essencial</Button>
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

            <Button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 transition glow-violet">
              <Plus className="size-4 inline mr-1.5" /> Adicionar
            </Button>
          </form>
        </GlassCard>
      </div>
    </AppShell>
  );
}

const inputCls = "w-full rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-muted/60 transition font-mono";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
