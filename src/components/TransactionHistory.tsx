import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, ChevronDown, Receipt, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui-kit";
import { appConfirm } from "@/lib/app-dialog";
import { EMPTY_HISTORY_FILTERS, filterHistory, type HistoryFilters } from "@/lib/transaction-history";
import { formatBRL, type Transaction, type VirtualInvoiceRow, type Category, type Card } from "@/lib/store";

const inputClass = "w-full min-w-0 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-primary";
const dateLabel = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
export function TransactionHistory({ transactions, invoices, categories, cards, onRemove }: {
  transactions: Transaction[]; invoices: VirtualInvoiceRow[]; categories: Category[]; cards: Card[];
  onRemove: (id: string) => unknown;
}) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>({ ...EMPTY_HISTORY_FILTERS });
  const [view, setView] = useState("all");
  const [pending, setPending] = useState<string | null>(null);
  const result = useMemo(() => filterHistory(transactions, invoices, filters), [transactions, invoices, filters]);
  const set = (key: keyof HistoryFilters, value: string) => setFilters(previous => ({ ...previous, [key]: value }));
  async function remove(row: Transaction) {
    if (!await appConfirm(`Excluir “${row.description || "lançamento"}” de ${formatBRL(row.amount)}?`)) return;
    setPending(row.id);
    try { await onRemove(row.id); } finally { setPending(null); }
  }
  const groups = [
    { id: "income", title: "Entradas", rows: result.income, total: result.incomeTotal, Icon: ArrowDownCircle, color: "text-success" },
    { id: "expense", title: "Gastos", rows: result.expenses, total: result.expenseTotal, Icon: ArrowUpCircle, color: "text-danger" },
    { id: "invoices", title: "Faturas", rows: result.invoices, total: result.invoiceTotal, Icon: Receipt, color: "text-primary" },
  ];
  return <GlassCard>
    <Button type="button" variant="ghost" className="w-full justify-between px-0" aria-expanded={open} aria-controls="transaction-history" onClick={() => setOpen(previous => !previous)}>
      <span className="text-lg font-bold">Histórico</span><ChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
    </Button>
    <div className={`collapse-reveal ${open ? "is-open" : ""}`} inert={!open}>
      <div id="transaction-history" className="overflow-hidden">
        <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 xl:grid-cols-4">
          <FilterField label="Buscar descrição"><input className={inputClass} value={filters.search} onChange={e => set("search", e.target.value)} placeholder="Buscar…" /></FilterField>
          <FilterField label="Data inicial"><input type="date" className={inputClass} value={filters.start} onChange={e => set("start", e.target.value)} /></FilterField>
          <FilterField label="Data final"><input type="date" className={inputClass} value={filters.end} onChange={e => set("end", e.target.value)} /></FilterField>
          <FilterField label="Ordem"><select className={inputClass} value={filters.sort} onChange={e => set("sort", e.target.value)}><option value="newest">Mais recentes primeiro</option><option value="oldest">Mais antigos primeiro</option></select></FilterField>
          <FilterField label="Categoria"><select className={inputClass} value={filters.category} onChange={e => set("category", e.target.value)}><option value="all">Todas</option><option value="none">Sem categoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FilterField>
          <FilterField label="Cartão"><select className={inputClass} value={filters.card} onChange={e => set("card", e.target.value)}><option value="all">Todos</option>{cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FilterField>
          <FilterField label="Forma de pagamento"><select className={inputClass} value={filters.payment} onChange={e => set("payment", e.target.value)}><option value="all">Todas</option><option value="credit">Crédito</option><option value="debit">Débito</option><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="unspecified">Não informada</option></select></FilterField>
          <FilterField label="Classificação"><select className={inputClass} value={filters.essential} onChange={e => set("essential", e.target.value)}><option value="all">Todas</option><option value="essential">Essencial</option><option value="non_essential">Não essencial</option></select></FilterField>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Tipo de histórico" className="flex flex-wrap gap-1">{[{ id: "all", title: "Todos" }, ...groups].map(group => <Button key={group.id} size="sm" variant={view === group.id ? "default" : "outline"} aria-pressed={view === group.id} onClick={() => setView(group.id)}>{group.title}</Button>)}</div>
          <Button size="sm" variant="ghost" onClick={() => { setFilters({ ...EMPTY_HISTORY_FILTERS }); setView("all"); }}><RotateCcw />Limpar filtros</Button>
        </div>
        {!result.valid && <p role="alert" className="mb-3 text-sm text-danger">A data final deve ser igual ou posterior à data inicial.</p>}
        <div className="space-y-6">
          {groups.filter(group => view === "all" || view === group.id).map(({ id, title, rows, total, Icon, color }) => <section key={id} aria-label={title} className="border-t border-border pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className={`flex items-center gap-2 font-semibold ${color}`}><Icon className="size-4" />{title}<span className="text-xs font-normal text-muted-foreground">{rows.length}</span></h3><p className={`font-mono font-semibold ${color}`}>{formatBRL(total)}</p></div>
            {id === "expense" && result.settlementTotal > 0 && <p className="mb-3 text-xs text-muted-foreground">Pagamentos de fatura: {formatBRL(result.settlementTotal)} · separados do total de compras e gastos.</p>}
            {id === "invoices" && <p className="mb-3 text-xs text-muted-foreground">Consolidado das compras no crédito · não soma novamente aos gastos.{filters.category !== "all" || filters.essential !== "all" ? " Faturas não possuem categoria ou classificação individual." : ""}</p>}
            {rows.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Nenhum registro para os filtros selecionados.</p> : <ul className="divide-y divide-border">{rows.map(row => {
              const virtual = "virtual" in row;
              const tx = virtual ? undefined : row;
              const category = categories.find(c => c.id === tx?.categoryId);
              const card = cards.find(c => c.id === row.cardId);
              const tag = tx?.tag ?? "";
              const source = tag.startsWith("__pf__:") ? "Pagamento de fatura" : tag.startsWith("__dv__:") ? "Parcela dívida" : tag.startsWith("__rc__:") ? "Parcela recebida" : tag.startsWith("__sub__:") ? "Assinatura" : tag.startsWith("__cp__") ? "Parcela crédito" : tag.startsWith("__pj__:") ? "Projeto" : "";
              return <li key={row.id} className="flex items-start gap-3 py-3"><Icon className={`mt-1 size-4 shrink-0 ${color}`} /><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{row.description || (id === "income" ? "Entrada" : "Gasto")}</p><p className="mt-1 break-words text-xs text-muted-foreground">{dateLabel(row.date)}{category ? ` · ${category.name}` : ""}{card ? ` · ${card.name}` : ""}{source ? ` · ${source}` : ""}{tx?.installmentNo ? ` ${tx.installmentNo}/${tx.installmentTotal}` : ""}{tx?.essential ? ` · ${tx.essential === "essential" ? "Essencial" : "Não essencial"}` : ""}</p></div><div className="flex shrink-0 flex-col items-end gap-1"><span className={`font-mono text-sm ${color}`}>{formatBRL(row.amount)}</span>{tx && <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-danger" disabled={pending !== null} aria-label={`Excluir ${row.description || "lançamento"}`} title="Excluir lançamento" onClick={() => remove(tx)}><Trash2 /></Button>}</div></li>;
            })}</ul>}
          </section>)}
        </div>
      </div>
    </div>
  </GlassCard>;
}
function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="min-w-0 space-y-1"><span className="block text-xs text-muted-foreground">{label}</span>{children}</label>;
}