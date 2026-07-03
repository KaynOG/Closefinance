import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, isSameMonth, type Transaction } from "@/lib/store";
import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, TrendingUp } from "lucide-react";
import { TutorialBox } from "@/components/TutorialBox";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { TxEditModal } from "@/components/TxEditModal";
import { notify } from "@/lib/notify";
import { playCashRegister } from "@/lib/sound";

export const Route = createFileRoute("/ganhos")({
  head: () => ({ meta: [{ title: "Ganhos — CloseFinance" }, { name: "description", content: "Planilha moderna de ganhos com gráficos." }] }),
  component: GanhosPage,
});

const CYAN = "#22C3CC";
const CYAN_DARK = "#006F77";

function GanhosPage() {
  const [{ transactions, categories, cards, banks }, api] = useStore();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [fMonth, setFMonth] = useState("all");
  const [fCategory, setFCategory] = useState("all");
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");
  const [fSearch, setFSearch] = useState("");
  const today = new Date();
  const incomeCats = categories.filter(c => c.kind !== "expense");

  const [form, setForm] = useState({ amount: "", description: "", date: today.toISOString().slice(0, 10), categoryId: incomeCats[0]?.id ?? "", tag: "", destination: "none" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseBRL(form.amount);
    if (!amt || amt <= 0) return;
    const dest = form.destination;
    const bankId = dest && dest !== "none" && dest !== "cash" ? dest : undefined;
    const paymentMethod = dest === "cash" ? "cash" as const : undefined;
    api.addTransaction({
      type: "income", amount: amt, description: form.description.trim(), date: form.date,
      categoryId: form.categoryId || undefined, tag: form.tag.trim() || undefined,
      bankId, paymentMethod,
    });
    notify(`Ganho de ${formatBRL(amt)} adicionado com sucesso!`);
    playCashRegister();
    setForm({ ...form, amount: "", description: "", tag: "" });
  }

  const incomes = transactions.filter(t => t.type === "income").sort((a, b) => b.date.localeCompare(a.date));
  const monthIncome = incomes.filter(t => isSameMonth(t.date, today)).reduce((s, t) => s + t.amount, 0);
  const avg6 = useMemo(() => {
    let total = 0;
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      total += incomes.filter(t => isSameMonth(t.date, d)).reduce((s, t) => s + t.amount, 0);
    }
    return total / 6;
  }, [incomes]);

  const series = useMemo(() => {
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      out.push({ month: d.toLocaleDateString("pt-BR", { month: "short" }), valor: incomes.filter(t => isSameMonth(t.date, d)).reduce((s, t) => s + t.amount, 0) });
    }
    return out;
  }, [incomes]);

  const byCat = useMemo(() => {
    return incomeCats.map(c => ({ name: c.name, valor: incomes.filter(t => isSameMonth(t.date, today) && t.categoryId === c.id).reduce((s, t) => s + t.amount, 0), color: c.color })).filter(c => c.valor > 0);
  }, [incomes, incomeCats]);

  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Receitas</p>
        <h1 className="text-3xl lg:text-4xl font-bold">Ganhos <TrendingUp className="inline size-7" style={{ color: CYAN }} /></h1>
      </header>

      <TutorialBox
        storageKey="ganhos"
        title="Como registrar seus ganhos"
        steps={[
          "Role até o bloco 'Novo ganho' e preencha o valor recebido.",
          "Adicione uma descrição (ex: Salário, Freela) e a data em que o dinheiro entrou.",
          "Se o valor caiu em uma conta, selecione o banco — o saldo é creditado automaticamente.",
          "Clique em Adicionar. Pronto! O ganho aparece no histórico e nos gráficos.",
        ]}
        tip="Cadastre ganhos recorrentes (como salário) sempre na mesma data — facilita comparar meses."
      />



      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Stat label="Recebido este mês" value={formatBRL(monthIncome)} accent="teal" sub="entradas confirmadas" />
        <Stat label="Média (6 meses)" value={formatBRL(avg6)} accent="success" sub="renda média mensal" />
        <Stat label="Total histórico" value={formatBRL(incomes.reduce((s, t) => s + t.amount, 0))} accent="violet" sub={`${incomes.length} lançamentos`} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard hideKey="ganhos-1" hideLabel="Evolução dos ganhos" className="lg:col-span-2">
          <SectionTitle title="Evolução dos ganhos" subtitle="últimos 12 meses" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CYAN} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.7)" }} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.6)" }} />
                <Tooltip contentStyle={{ background: "#14062E", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} formatter={(v: number) => formatBRL(v)} />
                <Area type="monotone" dataKey="valor" stroke={CYAN} fill="url(#gCyan)" strokeWidth={2.5} animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard hideKey="ganhos-2" hideLabel="Ganhos por categoria">
          <SectionTitle title="Por categoria" subtitle="mês atual" />
          <div className="h-72">
            {byCat.length === 0 ? <p className="text-sm text-muted-foreground">Sem ganhos categorizados este mês.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCat} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={90} tick={{ fill: "rgba(255,255,255,0.75)" }} />
                  <Tooltip contentStyle={{ background: "#14062E", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="valor" radius={[0, 8, 8, 0]} animationDuration={800}>
                    {byCat.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <GlassCard hideKey="ganhos-3" hideLabel="Novo ganho">
          <SectionTitle title="Novo ganho" />
          <form onSubmit={submit} className="space-y-3">
            <Field label="Valor (R$)"><input required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00" inputMode="decimal" className={inputCls} /></Field>
            <Field label="Descrição"><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Salário, freelance..." className={inputCls} /></Field>
            <Field label="Data"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} /></Field>
            <Field label="Categoria">
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                <option value="">Sem categoria</option>
                {incomeCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Recebido em">
              <select value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className={inputCls}>
                <option value="none">Não informar</option>
                <option value="cash">💵 Dinheiro físico (caixa)</option>
                {banks.length > 0 && <option disabled>— Bancos —</option>}
                {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Etiqueta (parâmetro livre)">
              <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="Ex: bônus-Q4, projeto-X" className={inputCls} />
            </Field>
            <button type="submit" className="w-full rounded-xl font-semibold py-3 transition active:scale-[0.98] glow-violet" style={{ background: CYAN, color: "#001012" }}>
              <Plus className="size-4 inline mr-1.5" /> Adicionar ganho
            </button>
          </form>
        </GlassCard>

        <GlassCard hideKey="ganhos-4" hideLabel="Planilha de ganhos">
          <SectionTitle title="Planilha de ganhos" subtitle={`${incomes.length} lançamentos`} />
          {(() => {
            const monthsSet = Array.from(new Set(incomes.map(t => t.date.slice(0, 7)))).sort((a, b) => b.localeCompare(a));
            const minN = parseBRL(fMin);
            const maxN = parseBRL(fMax);
            const q = fSearch.trim().toLowerCase();
            const filtered = incomes.filter(t => {
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
                  <select value={fMonth} onChange={e => setFMonth(e.target.value)} className={inputCls}>
                    <option value="all">Todos os meses</option>
                    {monthsSet.map(m => {
                      const [y, mm] = m.split("-");
                      const label = new Date(parseInt(y), parseInt(mm) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
                      return <option key={m} value={m}>{label}</option>;
                    })}
                  </select>
                  <select value={fCategory} onChange={e => setFCategory(e.target.value)} className={inputCls}>
                    <option value="all">Todas as categorias</option>
                    <option value="none">Sem categoria</option>
                    {incomeCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input value={fMin} onChange={e => setFMin(e.target.value)} placeholder="Valor mín." inputMode="decimal" className={inputCls} />
                  <input value={fMax} onChange={e => setFMax(e.target.value)} placeholder="Valor máx." inputMode="decimal" className={inputCls} />
                  <button type="button" onClick={() => { setFMonth("all"); setFCategory("all"); setFMin(""); setFMax(""); setFSearch(""); }}
                    disabled={!cleared}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-mono hover:bg-white/5 disabled:opacity-40 md:col-span-2">
                    Limpar filtros
                  </button>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground mb-2">
                  {filtered.length} de {incomes.length} · total {formatBRL(filtered.reduce((s, t) => s + t.amount, 0))}
                </p>
                {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum ganho encontrado para os filtros.</p> : (
                  <div className="overflow-x-auto -mx-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground border-b border-white/10">
                          <th className="py-2 px-3">Data</th>
                          <th className="py-2 px-3">Descrição</th>
                          <th className="py-2 px-3">Categoria</th>
                          <th className="py-2 px-3">Etiqueta</th>
                          <th className="py-2 px-3 text-right">Valor</th>
                          <th className="py-2 px-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(t => {
                          const cat = categories.find(c => c.id === t.categoryId);
                          return (
                            <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">{new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                              <td className="py-2.5 px-3">{t.description || "—"}</td>
                              <td className="py-2.5 px-3">
                                {cat ? <span className="inline-flex items-center gap-1.5 text-xs"><span className="size-2 rounded-full" style={{ background: cat.color }} />{cat.name}</span> : <span className="text-muted-foreground text-xs">—</span>}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{t.tag || "—"}</td>
                              <td className="py-2.5 px-3 font-mono text-right" style={{ color: CYAN }}>+{formatBRL(t.amount)}</td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <button onClick={() => setEditing(t)} className="text-muted-foreground hover:text-secondary p-1"><Pencil className="size-4" /></button>
                                <button onClick={() => api.removeTransaction(t.id)} className="text-muted-foreground hover:text-[#FF4D6D] p-1"><Trash2 className="size-4" /></button>
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
