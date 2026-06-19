import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, isSameMonth } from "@/lib/store";
import { useMemo } from "react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, HeartPulse, CreditCard } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Finlux" },
      { name: "description", content: "Visão geral da sua saúde financeira, gastos, ganhos e limites de cartão." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [{ transactions, categories, cards }] = useStore();
  const today = new Date();

  const month = useMemo(() => {
    const tx = transactions.filter((t) => isSameMonth(t.date, today));
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const essential = tx.filter(t => t.type === "expense" && t.essential === "essential").reduce((s, t) => s + t.amount, 0);
    const nonEssential = tx.filter(t => t.type === "expense" && t.essential === "non_essential").reduce((s, t) => s + t.amount, 0);
    return { tx, income, expense, essential, nonEssential, balance: income - expense };
  }, [transactions]);

  // Card usage
  const cardUsage = useMemo(() => {
    return cards.map((c) => {
      const used = transactions
        .filter(t => t.cardId === c.id && t.type === "expense" && isSameMonth(t.date, today))
        .reduce((s, t) => s + t.amount, 0);
      return { ...c, used, available: Math.max(0, c.limit - used), pct: c.limit ? Math.min(100, (used / c.limit) * 100) : 0 };
    });
  }, [cards, transactions]);

  const totalLimit = cardUsage.reduce((s, c) => s + c.limit, 0);
  const totalUsed = cardUsage.reduce((s, c) => s + c.used, 0);
  const totalAvailable = Math.max(0, totalLimit - totalUsed);

  // Health score 0-100
  const health = useMemo(() => {
    if (month.income === 0 && month.expense === 0) return { score: 70, label: "Sem dados suficientes", tone: "yellow" as const };
    const savingsRate = month.income > 0 ? (month.balance / month.income) : -1;
    const essentialRatio = month.expense > 0 ? month.essential / month.expense : 1;
    let score = 50;
    score += savingsRate * 50; // saving > 0 boosts
    score += (essentialRatio - 0.5) * 20;
    const cardUsageRatio = totalLimit > 0 ? totalUsed / totalLimit : 0;
    score -= cardUsageRatio * 25;
    score = Math.round(Math.max(0, Math.min(100, score)));
    const label = score >= 75 ? "Excelente" : score >= 55 ? "Saudável" : score >= 35 ? "Atenção" : "Crítico";
    const tone = score >= 75 ? "success" : score >= 55 ? "teal" : score >= 35 ? "yellow" : "danger";
    return { score, label, tone };
  }, [month, totalLimit, totalUsed]);

  // Last 6 months series
  const series = useMemo(() => {
    const out: { month: string; receitas: number; despesas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const tx = transactions.filter(t => isSameMonth(t.date, d));
      out.push({
        month: d.toLocaleDateString("pt-BR", { month: "short" }),
        receitas: tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
        despesas: tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return out;
  }, [transactions]);

  // Spending per category
  const byCat = useMemo(() => {
    return categories.map(c => ({
      name: c.name,
      value: month.tx.filter(t => t.type === "expense" && t.categoryId === c.id).reduce((s, t) => s + t.amount, 0),
      color: c.color,
    })).filter(c => c.value > 0);
  }, [categories, month.tx]);

  return (
    <AppShell>
      <header className="mb-8">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          {today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold mt-1">
          Olá, vamos cuidar do seu <span className="text-gradient">dinheiro</span>.
        </h1>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Receitas do mês" value={formatBRL(month.income)} accent="success" sub="Entradas confirmadas" />
        <Stat label="Despesas do mês" value={formatBRL(month.expense)} accent="crimson" sub={`${formatBRL(month.essential)} essenciais`} />
        <Stat label="Saldo previsto" value={formatBRL(month.balance)} accent={month.balance >= 0 ? "teal" : "danger"} sub="Receitas − Despesas" />
        <Stat label="Cartões disponível" value={formatBRL(totalAvailable)} accent="violet" sub={`de ${formatBRL(totalLimit)}`} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Health */}
        <GlassCard className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse className="size-5 text-secondary" />
            <h3 className="font-semibold">Saúde financeira</h3>
          </div>
          <HealthRing score={health.score} tone={health.tone} />
          <p className="text-center mt-4 font-display text-lg font-semibold">{health.label}</p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex justify-between font-mono"><span className="text-muted-foreground">Taxa de poupança</span><span>{month.income > 0 ? `${Math.round((month.balance / month.income) * 100)}%` : "—"}</span></li>
            <li className="flex justify-between font-mono"><span className="text-muted-foreground">Essenciais vs. total</span><span>{month.expense > 0 ? `${Math.round((month.essential / month.expense) * 100)}%` : "—"}</span></li>
            <li className="flex justify-between font-mono"><span className="text-muted-foreground">Uso de cartão</span><span>{totalLimit > 0 ? `${Math.round((totalUsed / totalLimit) * 100)}%` : "—"}</span></li>
          </ul>
        </GlassCard>

        {/* Trend */}
        <GlassCard className="lg:col-span-2">
          <SectionTitle title="Fluxo dos últimos 6 meses" subtitle="receitas vs. despesas" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2BD9A1" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#2BD9A1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#540BD3" stopOpacity={0.7}/>
                    <stop offset="100%" stopColor="#540BD3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "#14062E", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }} formatter={(v: number) => formatBRL(v)} />
                <Area type="monotone" dataKey="receitas" stroke="#2BD9A1" fill="url(#gIncome)" strokeWidth={2} animationDuration={800} />
                <Area type="monotone" dataKey="despesas" stroke="#540BD3" fill="url(#gExpense)" strokeWidth={2} animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      {/* Cards dashboard */}
      <section className="mb-8">
        <SectionTitle title="Limite dos cartões" subtitle="usado e disponível por cartão neste mês" />
        {cards.length === 0 ? (
          <GlassCard><p className="text-sm text-muted-foreground">Cadastre seus cartões em <a className="text-secondary underline" href="/cartoes">Cartões</a> para ver o uso aqui.</p></GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cardUsage.map((c) => (
              <div key={c.id} className="glass rounded-3xl p-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(400px 200px at 100% 0%, ${c.color}, transparent 60%)` }} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                      <p className="font-semibold">{c.name}</p>
                    </div>
                    <CreditCard className="size-4 text-muted-foreground" />
                  </div>
                  <p className="mt-4 font-mono text-xs text-muted-foreground">Usado</p>
                  <p className="text-2xl font-bold">{formatBRL(c.used)}</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.pct}%`, background: `linear-gradient(90deg, ${c.color}, #FFCC00)` }} />
                  </div>
                  <div className="mt-3 flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Disponível</span>
                    <span>{formatBRL(c.available)} / {formatBRL(c.limit)}</span>
                  </div>
                  <p className="mt-2 text-[11px] font-mono text-muted-foreground">
                    Libera dia {c.dueDay} · fechamento dia {c.closingDay}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Categories pie + Essential split */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <GlassCard>
          <SectionTitle title="Gastos por categoria" subtitle="distribuição do mês atual" />
          <div className="h-64">
            {byCat.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem gastos categorizados este mês.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCat} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} animationDuration={700}>
                    {byCat.map((entry, i) => (<Cell key={i} fill={entry.color} stroke="rgba(0,0,0,0)" />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#14062E", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }} formatter={(v: number) => formatBRL(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Essenciais vs. Não essenciais" subtitle="onde seu dinheiro está indo" />
          <div className="space-y-5 mt-2">
            <Bar label="Essenciais" value={month.essential} total={month.expense || 1} color="#006F77" icon={<TrendingDown className="size-4" />} />
            <Bar label="Não essenciais" value={month.nonEssential} total={month.expense || 1} color="#820432" icon={<TrendingUp className="size-4" />} />
            <div className="rounded-2xl bg-white/5 p-4 mt-4 border border-border">
              <p className="font-mono text-xs text-muted-foreground">Dica</p>
              <p className="text-sm mt-1">Manter gastos não essenciais abaixo de <span className="font-semibold text-secondary">30%</span> do total ajuda a aumentar sua poupança e melhora a saúde financeira.</p>
            </div>
          </div>
        </GlassCard>
      </section>
    </AppShell>
  );
}

function Bar({ label, value, total, color, icon }: { label: string; value: number; total: number; color: string; icon: React.ReactNode }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">{icon}{label}</span>
        <span className="font-mono text-muted-foreground">{formatBRL(value)} · {pct}%</span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, #FFCC00)` }} />
      </div>
    </div>
  );
}

function HealthRing({ score, tone }: { score: number; tone: "violet" | "yellow" | "teal" | "crimson" | "success" | "danger" }) {
  const radius = 60;
  const c = 2 * Math.PI * radius;
  const offset = c - (score / 100) * c;
  const colorMap: Record<string, string> = {
    violet: "#540BD3", yellow: "#FFCC00", teal: "#006F77", crimson: "#820432",
    success: "#2BD9A1", danger: "#FF4D6D",
  };
  return (
    <div className="flex justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
        <circle cx="80" cy="80" r={radius} stroke={colorMap[tone]} strokeWidth="12" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms ease" }} />
        <text x="80" y="86" textAnchor="middle" className="fill-foreground" style={{ transform: "rotate(90deg)", transformOrigin: "80px 80px", fontFamily: "Poppins", fontWeight: 700, fontSize: 32 }}>
          {score}
        </text>
      </svg>
    </div>
  );
}
