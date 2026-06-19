import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, isSameMonth } from "@/lib/store";
import { pickGreeting } from "@/lib/greetings";
import { useMemo, useState } from "react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, CartesianGrid, BarChart, Bar as RBar,
} from "recharts";
import { TrendingUp, TrendingDown, HeartPulse, CreditCard, Target, Lightbulb, CheckCircle2, Circle, BarChart3 } from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — CloseFinance" },
      { name: "description", content: "Sua saúde financeira em tempo real: gastos, ganhos, cartões e missões diárias." },
    ],
  }),
  component: DashboardPage,
});

const CYAN = "#22C3CC";
const ORANGE = "#FF6B1A";

const DAILY_MISSIONS = [
  { id: "m1", title: "Registre um gasto de hoje", desc: "Mantenha a planilha viva." },
  { id: "m2", title: "Classifique como essencial ou não", desc: "Crie consciência de prioridades." },
  { id: "m3", title: "Veja seu saldo do mês", desc: "Olhar é o primeiro passo do controle." },
  { id: "m4", title: "Anote uma meta da semana", desc: "Pequenas metas, grandes resultados." },
];

const DAILY_TIPS = [
  "Pague-se primeiro: separe 10% da renda assim que ela cair.",
  "Antes de comprar, aguarde 24h. O desejo passa, a economia fica.",
  "Use o cartão como meio de pagamento, nunca como extensão da renda.",
  "Acompanhe pequenos gastos — eles somam mais do que parecem.",
  "Defina um teto mensal para lazer e respeite como uma conta fixa.",
  "Reserva de emergência primeiro, investimentos depois.",
];

function DashboardPage() {
  const [{ transactions, categories, cards, missions }, api, user] = useStore();
  const today = new Date();
  const [periodMonths, setPeriodMonths] = useState<3 | 6 | 12>(6);
  const [catPeriod, setCatPeriod] = useState<3 | 6 | 12>(3);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const greeting = useMemo(() => pickGreeting(user?.name), [user?.name]);

  const month = useMemo(() => {
    const tx = transactions.filter((t) => isSameMonth(t.date, today));
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const essential = tx.filter(t => t.type === "expense" && t.essential === "essential").reduce((s, t) => s + t.amount, 0);
    const nonEssential = tx.filter(t => t.type === "expense" && t.essential === "non_essential").reduce((s, t) => s + t.amount, 0);
    return { tx, income, expense, essential, nonEssential, balance: income - expense };
  }, [transactions]);

  // Dados de cartão puxados dos gastos (transactions)
  const cardUsage = useMemo(() => cards.map((c) => {
    const used = transactions.filter(t => t.cardId === c.id && t.type === "expense" && isSameMonth(t.date, today)).reduce((s, t) => s + t.amount, 0);
    return { ...c, used, available: Math.max(0, c.limit - used), pct: c.limit ? Math.min(100, (used / c.limit) * 100) : 0 };
  }), [cards, transactions]);

  const totalLimit = cardUsage.reduce((s, c) => s + c.limit, 0);
  const totalUsed = cardUsage.reduce((s, c) => s + c.used, 0);
  const totalAvailable = Math.max(0, totalLimit - totalUsed);
  const totalCardPct = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  const health = useMemo(() => {
    if (month.income === 0 && month.expense === 0) return { score: 70, label: "Sem dados suficientes", tone: "yellow" as const };
    const savingsRate = month.income > 0 ? (month.balance / month.income) : -1;
    const essentialRatio = month.expense > 0 ? month.essential / month.expense : 1;
    let score = 50 + savingsRate * 50 + (essentialRatio - 0.5) * 20;
    const cardUsageRatio = totalLimit > 0 ? totalUsed / totalLimit : 0;
    score -= cardUsageRatio * 25;
    score = Math.round(Math.max(0, Math.min(100, score)));
    const label = score >= 75 ? "Excelente" : score >= 55 ? "Saudável" : score >= 35 ? "Atenção" : "Crítico";
    const tone: "success" | "teal" | "yellow" | "danger" = score >= 75 ? "success" : score >= 55 ? "teal" : score >= 35 ? "yellow" : "danger";
    return { score, label, tone };
  }, [month, totalLimit, totalUsed]);

  const series = useMemo(() => {
    const out = [];
    for (let i = periodMonths - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const tx = transactions.filter(t => isSameMonth(t.date, d));
      out.push({
        month: d.toLocaleDateString("pt-BR", { month: "short", year: periodMonths > 6 ? "2-digit" : undefined }),
        receitas: tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
        despesas: tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return out;
  }, [transactions, periodMonths]);


  const byCat = useMemo(() => categories.map(c => ({
    name: c.name,
    value: month.tx.filter(t => t.type === "expense" && t.categoryId === c.id).reduce((s, t) => s + t.amount, 0),
    color: c.color,
  })).filter(c => c.value > 0), [categories, month.tx]);

  // Annual goal
  const goal = user?.yearlyGoal ?? 0;
  const yearSaved = useMemo(() => transactions.filter(t => new Date(t.date).getFullYear() === today.getFullYear())
    .reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0), [transactions]);
  const goalPct = goal > 0 ? Math.max(0, Math.min(100, (yearSaved / goal) * 100)) : 0;

  // tip of the day
  const tip = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];

  return (
    <AppShell>
      <header className="mb-8">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          {today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold mt-1">
          <span className="text-gradient">{greeting}</span>
        </h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">Bolso fechado, financeiro guardado.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Stat label="Receitas do mês" value={formatBRL(month.income)} accent="teal" sub="Entradas confirmadas" />
        <Stat label="Despesas do mês" value={formatBRL(month.expense)} accent="crimson" sub={`${formatBRL(month.essential)} essenciais`} />
        <Stat label="Saldo previsto" value={formatBRL(month.balance)} accent={month.balance >= 0 ? "success" : "danger"} sub="Receitas − Despesas" />
        <Stat label="Cartão · disponível" value={formatBRL(totalAvailable)} accent="violet" sub={`de ${formatBRL(totalLimit)}`} />
        <Stat label="Cartão · gasto no mês" value={formatBRL(totalUsed)} accent="crimson" sub={`${Math.round(totalCardPct)}% do limite`} />
      </section>


      {/* Missions + Tip + Goal */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="lg:col-span-2">
          <SectionTitle title="Missões de hoje" subtitle={`${missions.totalPoints} pts acumulados · +10 por missão`} action={<Link to="/missoes" className="text-xs font-mono text-secondary hover:underline">ver tudo →</Link>} />
          <ul className="space-y-2">
            {DAILY_MISSIONS.map((m) => {
              const done = missions.completed.includes(m.id);
              return (
                <li key={m.id}>
                  <button onClick={() => api.toggleMission(m.id)}
                    className={`w-full flex items-start gap-3 text-left rounded-2xl p-3 border transition-all duration-200 active:scale-[0.99] ${done ? "bg-[#2BD9A1]/10 border-[#2BD9A1]/40" : "border-border hover:bg-white/5"}`}>
                    {done ? <CheckCircle2 className="size-5 text-[#2BD9A1] shrink-0 mt-0.5" /> : <Circle className="size-5 text-muted-foreground shrink-0 mt-0.5" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{m.title}</p>
                        <span className="font-mono text-[10px] rounded-md px-2 py-0.5 bg-secondary/20 text-secondary shrink-0">+10 pts</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full transition-all duration-700" style={{ width: `${(missions.completed.length / DAILY_MISSIONS.length) * 100}%`, background: "linear-gradient(90deg, #540BD3, #FFCC00)" }} />
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="size-4 text-secondary" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Dica do dia</p>
            </div>
            <p className="text-sm leading-relaxed">{tip}</p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Target className="size-4 text-secondary" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Meta anual</p>
            </div>
            {goal > 0 ? (
              <>
                <p className="text-xl font-bold">{formatBRL(yearSaved)} <span className="font-mono text-xs text-muted-foreground">/ {formatBRL(goal)}</span></p>
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full transition-all duration-700" style={{ width: `${goalPct}%`, background: "var(--gradient-primary)" }} />
                </div>
                <p className="mt-2 text-xs font-mono text-muted-foreground">{Math.round(goalPct)}% concluído</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Cadastre sua meta no seu perfil para ver o progresso aqui.</p>
            )}
          </GlassCard>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <GlassCard className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse className="size-5 text-secondary" />
            <h3 className="font-semibold">Saúde financeira</h3>
          </div>
          <HealthRing score={health.score} tone={health.tone} />
          <p className="text-center mt-4 font-display text-lg font-semibold">{health.label}</p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex justify-between font-mono"><span className="text-muted-foreground">Taxa de poupança</span><span>{month.income > 0 ? `${Math.round((month.balance / month.income) * 100)}%` : "—"}</span></li>
            <li className="flex justify-between font-mono"><span className="text-muted-foreground">Essenciais</span><span>{month.expense > 0 ? `${Math.round((month.essential / month.expense) * 100)}%` : "—"}</span></li>
            <li className="flex justify-between font-mono"><span className="text-muted-foreground">Uso de cartão</span><span>{totalLimit > 0 ? `${Math.round((totalUsed / totalLimit) * 100)}%` : "—"}</span></li>
          </ul>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <SectionTitle
            title={`Fluxo dos últimos ${periodMonths} meses`}
            subtitle="ganhos em ciano · gastos em laranja"
            action={
              <div className="inline-flex rounded-xl border border-border overflow-hidden text-[11px] font-mono">
                {([3, 6, 12] as const).map(n => (
                  <button key={n} onClick={() => setPeriodMonths(n)}
                    className={`px-3 py-1.5 transition ${periodMonths === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5"}`}>
                    {n === 12 ? "1 ano" : `${n} m`}
                  </button>
                ))}
              </div>
            } />

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CYAN} stopOpacity={0.7}/>
                    <stop offset="100%" stopColor={CYAN} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="dOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity={0.7}/>
                    <stop offset="100%" stopColor={ORANGE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.7)" }} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.6)" }} />
                <Tooltip contentStyle={{ background: "#14062E", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} formatter={(v: number) => formatBRL(v)} />
                <Area type="monotone" dataKey="receitas" name="Ganhos" stroke={CYAN} fill="url(#dCyan)" strokeWidth={2.5} animationDuration={900} />
                <Area type="monotone" dataKey="despesas" name="Gastos" stroke={ORANGE} fill="url(#dOrange)" strokeWidth={2.5} animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      <section className="mb-8">
        <SectionTitle title="Limite dos cartões" subtitle="usado e disponível por cartão neste mês" />
        {cards.length === 0 ? (
          <GlassCard><p className="text-sm text-muted-foreground">Cadastre seus cartões em <Link to="/cartoes" className="text-secondary underline">Cartões</Link>.</p></GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cardUsage.map((c) => (
              <div key={c.id} className="glass rounded-3xl p-5 relative overflow-hidden hover:translate-y-[-2px] transition-transform duration-300">
                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(400px 200px at 100% 0%, ${c.color}, transparent 60%)` }} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: c.color }} /><p className="font-semibold">{c.name}</p></div>
                    <CreditCard className="size-4 text-muted-foreground" />
                  </div>
                  <p className="mt-4 font-mono text-xs text-muted-foreground">Usado</p>
                  <p className="text-2xl font-bold">{formatBRL(c.used)}</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.pct}%`, background: `linear-gradient(90deg, ${c.color}, #FFCC00)` }} />
                  </div>
                  <div className="mt-3 flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Disponível</span>
                    <span>{formatBRL(c.available)} / {formatBRL(c.limit)}</span>
                  </div>
                  <p className="mt-2 text-[11px] font-mono text-muted-foreground">Libera dia {c.dueDay} · fechamento dia {c.closingDay}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
                  <Tooltip contentStyle={{ background: "#14062E", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fff" }} formatter={(v: number) => formatBRL(v)} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#fff" }} formatter={(value) => <span style={{ color: "#fff" }}>{value}</span>} />
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
              <p className="font-mono text-xs text-muted-foreground">Insight</p>
              <p className="text-sm mt-1">Manter gastos não essenciais abaixo de <span className="font-semibold text-secondary">30%</span> do total ajuda a poupar mais e melhora sua saúde financeira.</p>
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
  const colorMap: Record<string, string> = { violet: "#540BD3", yellow: "#FFCC00", teal: "#006F77", crimson: "#820432", success: "#2BD9A1", danger: "#FF4D6D" };
  return (
    <div className="flex justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
        <circle cx="80" cy="80" r={radius} stroke={colorMap[tone]} strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 900ms ease" }} />
        <text x="80" y="86" textAnchor="middle" className="fill-foreground" style={{ transform: "rotate(90deg)", transformOrigin: "80px 80px", fontFamily: "Poppins", fontWeight: 700, fontSize: 32 }}>{score}</text>
      </svg>
    </div>
  );
}
