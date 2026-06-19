import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, isSameMonth } from "@/lib/store";
import { useMemo, useState } from "react";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

export const Route = createFileRoute("/ganhos")({
  head: () => ({ meta: [{ title: "Ganhos — CloseFinance" }, { name: "description", content: "Planilha moderna de ganhos com gráficos." }] }),
  component: GanhosPage,
});

const CYAN = "#22C3CC";
const CYAN_DARK = "#006F77";

function GanhosPage() {
  const [{ transactions, categories }, api] = useStore();
  const today = new Date();
  const incomeCats = categories.filter(c => c.kind !== "expense");

  const [form, setForm] = useState({ amount: "", description: "", date: today.toISOString().slice(0, 10), categoryId: incomeCats[0]?.id ?? "", tag: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(form.amount.replace(",", "."));
    if (!amt || amt <= 0) return;
    api.addTransaction({ type: "income", amount: amt, description: form.description.trim(), date: form.date, categoryId: form.categoryId || undefined, tag: form.tag.trim() || undefined });
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

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Stat label="Recebido este mês" value={formatBRL(monthIncome)} accent="teal" sub="entradas confirmadas" />
        <Stat label="Média (6 meses)" value={formatBRL(avg6)} accent="success" sub="renda média mensal" />
        <Stat label="Total histórico" value={formatBRL(incomes.reduce((s, t) => s + t.amount, 0))} accent="violet" sub={`${incomes.length} lançamentos`} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="lg:col-span-2">
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

        <GlassCard>
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
        <GlassCard>
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
            <Field label="Etiqueta (parâmetro livre)">
              <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="Ex: bônus-Q4, projeto-X" className={inputCls} />
            </Field>
            <button type="submit" className="w-full rounded-xl font-semibold py-3 transition active:scale-[0.98] glow-violet" style={{ background: CYAN, color: "#001012" }}>
              <Plus className="size-4 inline mr-1.5" /> Adicionar ganho
            </button>
          </form>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Planilha de ganhos" subtitle={`${incomes.length} lançamentos`} />
          {incomes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum ganho ainda.</p> : (
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
                  {incomes.map(t => {
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
                        <td className="py-2.5 px-3"><button onClick={() => api.removeTransaction(t.id)} className="text-muted-foreground hover:text-[#FF4D6D] p-1"><Trash2 className="size-4" /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </section>
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
