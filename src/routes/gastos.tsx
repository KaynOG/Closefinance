import { AppSelect } from "@/components/AppSelect";
import { appConfirm } from "@/lib/app-dialog";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, isSameMonth, parseBRL, INVOICE_PAYMENT_TAG_PREFIX, parseInvoicePaymentTag, parseDebtTag, parseSubscriptionTag, isCardPurchaseTx, isCashFlowExpense, computeInvoicesForMonth, type Essential, type PaymentMethod, type Transaction } from "@/lib/store";
import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, TrendingDown } from "lucide-react";
import { TrendAreaChart, CategoryBarChart } from "@/components/charts/lazy";
import { TxEditModal } from "@/components/TxEditModal";
import { notify } from "@/lib/notify";
import { TutorialBox } from "@/components/TutorialBox";
import { playExpense } from "@/lib/sound";
import { StatementExport } from "@/components/StatementExport";

export const Route = createFileRoute("/gastos")({
  head: () => ({ meta: [
      { property: "og:title", content: "Gastos — CloseFinance" },
      { property: "og:description", content: "Planilha moderna de gastos com gráficos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Gastos — CloseFinance" }, { name: "description", content: "Planilha moderna de gastos com gráficos." }] }),
  component: GastosPage,
});

const ORANGE = "#FF6B1A";
const ORANGE_DEEP = "#C2410C";

function GastosPage() {
  const [{ transactions, categories, cards, banks, debts, subscriptions }, api] = useStore();
  const today = new Date();
  const expenseCats = categories.filter(c => c.kind !== "income");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [fMonth, setFMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [fCategory, setFCategory] = useState("all");
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");
  const [fSearch, setFSearch] = useState("");

  const [form, setForm] = useState({
    amount: "", description: "", date: today.toISOString().slice(0, 10),
    categoryId: expenseCats[0]?.id ?? "", essential: "essential" as Essential,
    paymentMethod: "debit" as PaymentMethod, cardId: "", bankId: "", tag: "",
    installments: "1",
    isInvoicePayment: false, invoiceCardId: "",
  });

  const invoiceCat = categories.find(c => c.name === "Adiantamento/Pagamento de fatura");

  // Etiqueta exibida na planilha: cada lançamento automático ganha um rótulo
  // próprio em vez do código interno (ex.: __cp__ vira "Parcela crédito").
  function tagLabel(t: Transaction) {
    const pf = parseInvoicePaymentTag(t.tag);
    if (pf) {
      const cn = cards.find(c => c.id === pf.cardId)?.name ?? "cartão";
      return <span style={{ color: "#2BD9A1" }}>Pgto fatura · {cn}{pf.userTag ? ` · ${pf.userTag}` : ""}</span>;
    }
    const dv = parseDebtTag(t.tag);
    if (dv) {
      const dn = debts.find(d => d.id === dv)?.name ?? "dívida";
      return <span style={{ color: "#FF6B1A" }}>Parcela dívida{t.installmentTotal ? ` ${t.installmentNo}/${t.installmentTotal}` : ""} · {dn}</span>;
    }
    if (isCardPurchaseTx(t)) {
      const cn = cards.find(c => c.id === t.cardId)?.name;
      return <span style={{ color: "var(--credit)" }}>Parcela crédito{t.installmentTotal ? ` ${t.installmentNo}/${t.installmentTotal}` : ""}{cn ? ` · ${cn}` : ""}</span>;
    }
    const subId = parseSubscriptionTag(t.tag);
    if (subId) {
      const sn = subscriptions.find(s => s.id === subId)?.name ?? "assinatura";
      return <span>Assinatura · <span className="text-destructive">{sn}</span></span>;
    }
    return <>{t.tag || "—"}</>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseBRL(form.amount);
    if (!amt || amt <= 0) return;

    // Pagamento de fatura: registra o gasto (saída do banco/pix/dinheiro) e
    // marca o lançamento com tag especial. O limite do cartão só será liberado
    // automaticamente quando a data do lançamento chegar (cálculo feito na aba
    // Cartões e no Dashboard).
    if (form.isInvoicePayment) {
      if (!form.invoiceCardId) { notify("Escolha o cartão da fatura."); return; }
      const card = cards.find(c => c.id === form.invoiceCardId);
      if (!card) return;
      const pm: PaymentMethod = form.paymentMethod === "credit" ? "debit" : form.paymentMethod;
      const userTag = form.tag.trim();
      const taggedTag = `${INVOICE_PAYMENT_TAG_PREFIX}${card.id}${userTag ? `|${userTag}` : ""}`;
      await api.addTransaction({
        type: "expense", amount: amt,
        description: form.description.trim() || `Pagamento fatura ${card.name}`,
        date: form.date,
        categoryId: invoiceCat?.id || form.categoryId || undefined,
        essential: "essential",
        paymentMethod: pm,
        bankId: (pm === "debit" || pm === "pix") ? form.bankId || undefined : undefined,
        tag: taggedTag,
      });
      const todayStr = new Date().toISOString().slice(0, 10);
      const willApplyNow = form.date <= todayStr;
      notify(willApplyNow
        ? `Pagamento de fatura de ${formatBRL(amt)} aplicado ao limite do cartão ${card.name}.`
        : `Pagamento de fatura de ${formatBRL(amt)} agendado · libera o limite do ${card.name} em ${new Date(form.date + "T00:00:00").toLocaleDateString("pt-BR")}.`);
      setForm({ ...form, amount: "", description: "", tag: "", installments: "1", isInvoicePayment: false, invoiceCardId: "" });
      return;
    }

    const inst = form.paymentMethod === "credit" ? Math.max(1, Math.min(36, parseInt(form.installments) || 1)) : 1;
    const amtPerInst = inst > 1 ? Math.round((amt / inst) * 100) / 100 : amt;
    await api.addTransaction({
      type: "expense", amount: amtPerInst, description: form.description.trim(), date: form.date,
      categoryId: form.categoryId || undefined, essential: form.essential,
      paymentMethod: form.paymentMethod,
      cardId: form.paymentMethod === "credit" ? form.cardId || undefined : undefined,
      bankId: (form.paymentMethod === "debit" || form.paymentMethod === "pix") ? form.bankId || undefined : undefined,
      tag: form.tag.trim() || undefined,
      installmentTotal: inst > 1 ? inst : undefined,
    });
    notify(`Gasto de ${formatBRL(amtPerInst)}${inst > 1 ? ` (${inst}x)` : ""} registrado com sucesso!`);
    playExpense();
    setForm({ ...form, amount: "", description: "", tag: "", installments: "1" });
  }

  // Lista completa de despesas (mantém as compras no crédito visíveis com badge)
  const expenses = transactions.filter(t => t.type === "expense").sort((a, b) => b.date.localeCompare(a.date));
  // Totais: crédito NÃO conta como saída — vira fatura consolidada por cartão/mês.
  const monthInvoices = useMemo(() => computeInvoicesForMonth(transactions, cards, today), [transactions, cards]);
  const monthInvoicesTotal = monthInvoices.reduce((s, i) => s + i.amount, 0);
  const monthExp = expenses.filter(t => isSameMonth(t.date, today) && isCashFlowExpense(t)).reduce((s, t) => s + t.amount, 0) + monthInvoicesTotal;
  const essential = expenses.filter(t => isSameMonth(t.date, today) && isCashFlowExpense(t) && t.essential === "essential").reduce((s, t) => s + t.amount, 0);

  const series = useMemo(() => {
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const direct = expenses.filter(t => isSameMonth(t.date, d) && isCashFlowExpense(t)).reduce((s, t) => s + t.amount, 0);
      const inv = computeInvoicesForMonth(transactions, cards, d).reduce((s, x) => s + x.amount, 0);
      out.push({ month: d.toLocaleDateString("pt-BR", { month: "short" }), valor: direct + inv });
    }
    return out;
  }, [expenses, transactions, cards]);

  const byCat = useMemo(() => {
    return expenseCats.map(c => ({ name: c.name, valor: expenses.filter(t => isSameMonth(t.date, today) && isCashFlowExpense(t) && t.categoryId === c.id).reduce((s, t) => s + t.amount, 0), color: c.color })).filter(c => c.valor > 0).sort((a, b) => b.valor - a.valor);
  }, [expenses, expenseCats]);

  return (
    <AppShell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Saídas</p>
          <h1 className="text-3xl lg:text-4xl font-bold">Gastos <TrendingDown className="inline size-7" style={{ color: ORANGE }} /></h1>
        </div>
        <StatementExport mode="expense" />
      </header>

      <TutorialBox
        storageKey="gastos"
        title="Como registrar seus gastos"
        steps={[
          "Em 'Novo gasto', informe o valor e uma descrição clara (ex: Mercado, Uber).",
          "Escolha a categoria — ajuda a ver para onde o dinheiro está indo.",
          "Marque como Essencial ou Não essencial para entender prioridades.",
          "Selecione o método (Crédito, Débito, Pix, Dinheiro) e, se for cartão, escolha qual.",
          "Para parcelar, ajuste o número de parcelas — cada uma cai no fechamento do cartão.",
        ]}
        tip="Compras no crédito não somam ao gasto do mês direto: elas viram a 'Fatura do cartão' do mês de fechamento."
      />



      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Stat label="Gasto este mês" value={formatBRL(monthExp)} accent="crimson" sub={`${expenses.filter(t => isSameMonth(t.date, today)).length} lançamentos`} />
        <Stat label="Essenciais" value={formatBRL(essential)} accent="teal" sub={monthExp ? `${Math.round((essential / monthExp) * 100)}% do total` : "—"} />
        <Stat label="Não essenciais" value={formatBRL(monthExp - essential)} accent="yellow" sub="onde dá pra cortar" />
      </section>

      {monthInvoices.length > 0 && (
        <GlassCard hideKey="gastos-invoices" hideLabel="Faturas do mês" className="mb-6">
          <SectionTitle title="Faturas do mês (crédito consolidado)" subtitle="cada compra no crédito vira fatura mensal por cartão · esse valor é a saída real do mês" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {monthInvoices.map(inv => {
              const card = cards.find(c => c.id === inv.cardId);
              return (
                <div key={inv.id} className="rounded-2xl border border-border bg-white/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2.5 rounded-full shrink-0" style={{ background: card?.color ?? "#FF6B1A" }} />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{inv.description}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">vence/fecha {new Date(inv.date + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm whitespace-nowrap" style={{ color: ORANGE }}>-{formatBRL(inv.amount)}</p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard hideKey="gastos-1" hideLabel="Evolução dos gastos" className="lg:col-span-2">
          <SectionTitle title="Evolução dos gastos" subtitle="últimos 12 meses" />
          <div className="h-72">
            <TrendAreaChart data={series} color={ORANGE} gradientId="gOrange" />
          </div>
        </GlassCard>

        <GlassCard hideKey="gastos-2" hideLabel="Top categorias">
          <SectionTitle title="Top categorias" subtitle="mês atual" />
          <div className="h-72">
            {byCat.length === 0 ? <p className="text-sm text-muted-foreground">Sem gastos categorizados este mês.</p> : (
              <CategoryBarChart data={byCat} />
            )}
          </div>
        </GlassCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <GlassCard hideKey="gastos-3" hideLabel="Novo gasto">
          <SectionTitle title="Novo gasto" />
          <form onSubmit={submit} className="space-y-3">
            <Field label="Valor (R$)"><input required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00" inputMode="decimal" className={inputCls} /></Field>
            <Field label="Descrição"><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mercado, conta de luz..." className={inputCls} /></Field>
            <Field label="Data"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} /></Field>
            <Field label="Pagamento de fatura?">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm({ ...form, isInvoicePayment: false, invoiceCardId: "" })}
                  className={`rounded-xl p-2.5 text-xs font-mono border transition active:scale-95 ${!form.isInvoicePayment ? "bg-white/10 border-primary" : "border-border hover:bg-white/5"}`}>Não</button>
                <button type="button" onClick={() => setForm({ ...form, isInvoicePayment: true, invoiceCardId: form.invoiceCardId || (cards[0]?.id ?? ""), categoryId: invoiceCat?.id || form.categoryId })}
                  className={`rounded-xl p-2.5 text-xs font-mono border transition active:scale-95 ${form.isInvoicePayment ? "bg-[#540BD3]/20 border-[#540BD3]" : "border-border hover:bg-white/5"}`}>Sim</button>
              </div>
            </Field>
            {form.isInvoicePayment && (
              <Field label="Cartão da fatura">
                {cards.length === 0 ? (
                  <p className="text-xs font-mono text-muted-foreground">Cadastre um cartão na aba Cartões.</p>
                ) : (
                  <AppSelect value={form.invoiceCardId} onChange={e => setForm({ ...form, invoiceCardId: e.target.value })} className={inputCls}>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.name} · usado {formatBRL((c.usedManual ?? 0))}</option>)}
                  </AppSelect>
                )}
                <p className="text-[10px] font-mono text-muted-foreground mt-1">O valor pago será liberado no limite usado do cartão.</p>
              </Field>
            )}
            <Field label="Categoria">
              <AppSelect value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                <option value="">Sem categoria</option>
                {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </AppSelect>
            </Field>
            <Field label="Classificação">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm({ ...form, essential: "essential" })}
                  className={`rounded-xl p-2.5 text-xs font-mono border transition active:scale-95 ${form.essential === "essential" ? "bg-[#006F77]/20 border-[#006F77]" : "border-border hover:bg-white/5"}`}>Essencial</button>
                <button type="button" onClick={() => setForm({ ...form, essential: "non_essential" })}
                  className={`rounded-xl p-2.5 text-xs font-mono border transition active:scale-95 ${form.essential === "non_essential" ? "bg-[#820432]/20 border-[#820432]" : "border-border hover:bg-white/5"}`}>Não essencial</button>
              </div>
            </Field>
            <Field label="Método de pagamento">
              <div className="grid grid-cols-4 gap-1.5">
                {(["credit","debit","pix","cash"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setForm({ ...form, paymentMethod: m })}
                    className={`rounded-xl py-2 text-[10px] font-mono border transition active:scale-95 ${form.paymentMethod === m ? "bg-primary/20 border-primary text-foreground" : "border-border text-muted-foreground hover:bg-white/5"}`}>
                    {m === "credit" ? "Crédito" : m === "debit" ? "Débito" : m === "pix" ? "Pix" : "Dinheiro"}
                  </button>
                ))}
              </div>
            </Field>
            {form.paymentMethod === "credit" && (
              <>
                {cards.length > 0 && (
                  <Field label="Cartão">
                    <AppSelect value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })} className={inputCls}>
                      <option value="">—</option>
                      {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </AppSelect>
                  </Field>
                )}
                <Field label={`Parcelas (até 36x)${parseInt(form.installments) > 1 ? ` · ${form.installments}x de ${formatBRL((parseBRL(form.amount) || 0) / (parseInt(form.installments) || 1))}` : ""}`}>
                  <div className="flex items-center gap-2">
                    <input type="range" min={1} max={36} value={form.installments} onChange={e => setForm({ ...form, installments: e.target.value })} className="flex-1 accent-[var(--primary)]" />
                    <input type="number" min={1} max={36} value={form.installments} onChange={e => setForm({ ...form, installments: e.target.value })} className={`${inputCls} w-16 text-center`} />
                  </div>
                  {parseInt(form.installments) > 1 && (
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">Vamos criar {form.installments} lançamentos mensais a partir da data informada.</p>
                  )}
                </Field>
              </>
            )}
            {(form.paymentMethod === "debit" || form.paymentMethod === "pix") && banks.length > 0 && (
              <Field label="Banco">
                <AppSelect value={form.bankId} onChange={e => setForm({ ...form, bankId: e.target.value })} className={inputCls}>
                  <option value="">—</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </AppSelect>
              </Field>
            )}
            <Field label="Etiqueta (parâmetro livre)">
              <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="Ex: viagem-japão, presente" className={inputCls} />
            </Field>
            <button type="submit" data-sound="success" className="w-full rounded-xl font-semibold py-3 text-white transition active:scale-[0.98]" style={{ background: ORANGE }}>
              <Plus className="size-4 inline mr-1.5" /> Adicionar gasto
            </button>
          </form>
        </GlassCard>

        <GlassCard hideKey="gastos-4" hideLabel="Planilha de gastos">
          <SectionTitle title="Planilha de gastos" subtitle={`${expenses.length} lançamentos`} />
          {(() => {
            const monthsSet = Array.from(new Set(expenses.map(t => t.date.slice(0, 7)))).sort((a, b) => b.localeCompare(a));
            const minN = parseBRL(fMin);
            const maxN = parseBRL(fMax);
            const q = fSearch.trim().toLowerCase();
            const filtered = expenses.filter(t => {
              if (fMonth !== "all" && t.date.slice(0, 7) !== fMonth) return false;
              if (fCategory !== "all" && (t.categoryId || "none") !== fCategory) return false;
              if (!isNaN(minN) && t.amount < minN) return false;
              if (!isNaN(maxN) && t.amount > maxN) return false;
              if (q && !(t.description ?? "").toLowerCase().includes(q)) return false;
              return true;
            });
            const cleared = fMonth !== "all" || fCategory !== "all" || fMin || fMax || fSearch;
            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
                  <input value={fSearch} onChange={e => setFSearch(e.target.value)} placeholder="Buscar descrição..." className={inputCls + " md:col-span-2"} />
                  <AppSelect aria-label="Filtrar mês" value={fMonth} onChange={e => setFMonth(e.target.value)} className={inputCls}>
                    <option value="all">Todos os meses</option>
                    {monthsSet.map(m => {
                      const [y, mm] = m.split("-");
                      const label = new Date(parseInt(y), parseInt(mm) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
                      return <option key={m} value={m}>{label}</option>;
                    })}
                  </AppSelect>
                  <AppSelect aria-label="Filtrar categoria" value={fCategory} onChange={e => setFCategory(e.target.value)} className={inputCls}>
                    <option value="all">Todas as categorias</option>
                    <option value="none">Sem categoria</option>
                    {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </AppSelect>
                  <input value={fMin} onChange={e => setFMin(e.target.value)} placeholder="Valor mín." inputMode="decimal" className={inputCls} />
                  <input value={fMax} onChange={e => setFMax(e.target.value)} placeholder="Valor máx." inputMode="decimal" className={inputCls} />
                  <button type="button" onClick={() => { setFMonth("all"); setFCategory("all"); setFMin(""); setFMax(""); setFSearch(""); }}
                    disabled={!cleared}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-mono hover:bg-white/5 disabled:opacity-40 md:col-span-2">
                    Limpar filtros
                  </button>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground mb-2">
                  {filtered.length} de {expenses.length} · total {formatBRL(filtered.reduce((s, t) => s + t.amount, 0))}
                </p>
                {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum gasto encontrado para os filtros.</p> : (
                  <div className="overflow-x-auto -mx-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground border-b border-white/10">
                          <th className="py-2 px-3">Data</th>
                          <th className="py-2 px-3">Descrição</th>
                          <th className="py-2 px-3">Categoria</th>
                          <th className="py-2 px-3">Pgto</th>
                          <th className="py-2 px-3">Etiqueta</th>
                          <th className="py-2 px-3 text-right">Valor</th>
                          <th className="py-2 px-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(t => {
                          const cat = categories.find(c => c.id === t.categoryId);
                          const pmLabel = t.paymentMethod === "credit" ? "Crédito" : t.paymentMethod === "debit" ? "Débito" : t.paymentMethod === "pix" ? "Pix" : t.paymentMethod === "cash" ? "Dinheiro" : "—";
                          return (
                            <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">{new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                              <td className="py-2.5 px-3">
                                {t.description || "—"}
                                {t.installmentTotal ? <span className="ml-1.5 text-[10px] font-mono text-secondary">({t.installmentNo}/{t.installmentTotal})</span> : null}
                              </td>
                              <td className="py-2.5 px-3">{cat ? <span className="inline-flex items-center gap-1.5 text-xs"><span className="size-2 rounded-full" style={{ background: cat.color }} />{cat.name}</span> : <span className="text-muted-foreground text-xs">—</span>}</td>
                              <td className="py-2.5 px-3 text-[10px] font-mono text-muted-foreground">{pmLabel}</td>
                              <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{tagLabel(t)}</td>
                              <td className="py-2.5 px-3 font-mono text-right" style={{ color: ORANGE }}>-{formatBRL(t.amount)}</td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <button onClick={() => setEditing(t)} className="text-muted-foreground hover:text-secondary p-1"><Pencil className="size-4" /></button>
                                <button onClick={async () => {
                                  if (t.installmentGroupId && t.installmentTotal && t.installmentTotal > 1) {
                                    const all = await appConfirm(`Deseja apagar todas as ${t.installmentTotal} parcelas desta compra ou somente esta parcela?`, { title: "Apagar parcelas", confirmLabel: "Todas as parcelas", cancelLabel: "Só esta parcela", destructive: true });
                                    api.removeTransaction(t.id, all ? { wholeGroup: true } : undefined);
                                  } else { api.removeTransaction(t.id); }
                                }} className="text-muted-foreground hover:text-[#FF4D6D] p-1"><Trash2 className="size-4" /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            );
          })()}
        </GlassCard>
      </section>
      {editing && (
        <TxEditModal tx={editing} categories={categories} cards={cards} banks={banks}
          onSave={async (patch) => { await api.updateTransaction(editing.id, patch); }}
          onClose={() => setEditing(null)} />
      )}
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
