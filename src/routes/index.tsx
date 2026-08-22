import { createFileRoute, Link } from "@tanstack/react-router";
import { ChartTooltip } from "@/components/ChartTooltip";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, isSameMonth, INVOICE_PAYMENT_TAG_PREFIX, isCashFlowExpense, computeInvoicesForMonth } from "@/lib/store";
import { pickGreeting } from "@/lib/greetings";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

/** Fonte mono (JetBrains Mono) usada nos eixos/labels dos gráficos. */
const MONO = "'JetBrains Mono', ui-monospace, monospace";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  BarChart,
  Bar as RBar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  HeartPulse,
  CreditCard,
  Target,
  Lightbulb,
  BarChart3,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GraduationCap,
  X,
} from "lucide-react";
// ThemeToggle agora é fixo no AppShell — não precisa importar aqui
import { areTutorialsEnabled, isTutorialNoticeDismissed, dismissTutorialNotice, onTutorialsChange } from "@/lib/tutorials";
import { getRank } from "@/lib/ranks";
import { Trophy } from "lucide-react";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — CloseFinance" },
      {
        name: "description",
        content: "Sua saúde financeira em tempo real: gastos, ganhos, cartões e missões diárias.",
      },
    ],
  }),
  component: DashboardPage,
});

const CYAN = "#22C3CC";
const ORANGE = "#FF6B1A";



const DAILY_TIPS = [
  "Pague-se primeiro: separe 10% da renda assim que ela cair.",
  "Antes de comprar, aguarde 24h. O desejo passa, a economia fica.",
  "Use o cartão como meio de pagamento, nunca como extensão da renda.",
  "Acompanhe pequenos gastos — eles somam mais do que parecem.",
  "Defina um teto mensal para lazer e respeite como uma conta fixa.",
  "Reserva de emergência primeiro, investimentos depois.",
  "Invista em livros de finanças: 'Pai Rico, Pai Pobre' e 'Hábitos Atômicos' pagam a leitura em poucas semanas.",
  "Reserve 30 min por semana para estudar investimentos — juros compostos começam com conhecimento.",
  "Um curso ou certificação pode render mais que qualquer aplicação: invista em você.",
  "Ouça um podcast de finanças no trajeto — educação financeira é hábito, não evento.",
  "Antes de investir num ativo, aprenda a diferença entre ativo e passivo (Pai Rico, Pai Pobre).",
  "Aplique a regra 1% de Hábitos Atômicos: melhore uma rotina financeira por dia.",
];


function DashboardPage() {
  const [{ transactions, categories, cards, banks, missions }, api, user] = useStore();
  useEffect(() => { if (user) api.awardMission("view_dashboard"); }, [user?.id]);
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [forecastN, setForecastN] = useState<0 | 3 | 6>(0);
  const [showTutorialNotice, setShowTutorialNotice] = useState(false);
  const [rankUp, setRankUp] = useState<{ name: string; color: string } | null>(null);
  useEffect(() => {
    const update = () => setShowTutorialNotice(!areTutorialsEnabled() && !isTutorialNoticeDismissed());
    update();
    return onTutorialsChange(update);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    const r = getRank(missions.totalPoints, user.gender);
    const key = `cf:lastRank:${user.id}`;
    const prev = window.localStorage.getItem(key);
    if (prev && prev !== r.current.id) {
      setRankUp({ name: r.displayName, color: r.current.color });
    }
    window.localStorage.setItem(key, r.current.id);
  }, [missions.totalPoints, user?.id]);

  const [periodMonths, setPeriodMonths] = useState<3 | 6 | 12>(6);
  const [catPeriod, setCatPeriod] = useState<3 | 6 | 12>(3);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [hidden, setHidden] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("closefinance:hiddenCharts") ?? "{}"); } catch { return {}; }
  });
  function toggleHidden(key: string) {
    setHidden(h => {
      const next = { ...h, [key]: !h[key] };
      if (typeof window !== "undefined") localStorage.setItem("closefinance:hiddenCharts", JSON.stringify(next));
      return next;
    });
  }
  const greeting = useMemo(() => pickGreeting(user?.name), [user?.name]);

  const displayMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [monthOffset],
  );
  const isFutureMonth = monthOffset > 0;

  const month = useMemo(() => {
    const tx = transactions.filter((t) => isSameMonth(t.date, displayMonth));
    const invoices = computeInvoicesForMonth(transactions, cards, displayMonth);
    const invoicesTotal = invoices.reduce((s, i) => s + i.amount, 0);
    const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const directExpense = tx.filter(isCashFlowExpense).reduce((s, t) => s + t.amount, 0);
    const expense = directExpense + invoicesTotal;
    const essential = tx
      .filter((t) => isCashFlowExpense(t) && t.essential === "essential")
      .reduce((s, t) => s + t.amount, 0);
    const nonEssential = tx
      .filter((t) => isCashFlowExpense(t) && t.essential === "non_essential")
      .reduce((s, t) => s + t.amount, 0);
    return { tx, invoices, income, expense, essential, nonEssential, balance: income - expense };
  }, [transactions, cards, displayMonth]);

  // Dados de cartão puxados dos gastos (transactions) — mesma lógica da aba Cartões
  const cardUsage = useMemo(
    () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      return cards.map((c) => {
        const invoiceTag = `${INVOICE_PAYMENT_TAG_PREFIX}${c.id}`;
        // Compras no crédito em aberto (todas as parcelas até que a fatura seja paga)
        const creditOutstanding = transactions
          .filter((t) => t.cardId === c.id && t.type === "expense" && t.paymentMethod === "credit" && !t.tag?.startsWith(INVOICE_PAYMENT_TAG_PREFIX))
          .reduce((s, t) => s + t.amount, 0);
        // Débito/etc no cartão só entram no mês em exibição
        const otherThisMonth = transactions
          .filter((t) => t.cardId === c.id && t.type === "expense" && t.paymentMethod !== "credit" && isSameMonth(t.date, displayMonth) && !t.tag?.startsWith(INVOICE_PAYMENT_TAG_PREFIX))
          .reduce((s, t) => s + t.amount, 0);
        const usedTx = creditOutstanding + otherThisMonth;
        const released = transactions
          .filter((t) => t.type === "expense" && t.tag?.startsWith(invoiceTag) && t.date <= todayStr)
          .reduce((s, t) => s + t.amount, 0);
        const manualRaw = c.usedManual ?? 0;
        const totalOwed = usedTx + manualRaw;
        const used = Math.max(0, totalOwed - released);
        const manual = Math.max(0, manualRaw - Math.max(0, released - usedTx));
        return {
          ...c,
          usedTx,
          usedManualVal: manual,
          used,
          available: Math.max(0, c.limit - used),
          pct: c.limit ? Math.min(100, (used / c.limit) * 100) : 0,
        };
      });
    },
    [cards, transactions, displayMonth],
  );


  const totalLimit = cardUsage.reduce((s, c) => s + c.limit, 0);
  const totalUsed = cardUsage.reduce((s, c) => s + c.used, 0);
  const totalAvailable = Math.max(0, totalLimit - totalUsed);
  const totalCardPct = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  // Total guardado e total arrecadado (vida toda) — alimenta a saúde financeira
  const totalSaved = useMemo(() => banks.reduce((s, b) => s + (b.savedAmount || 0), 0), [banks]);
  const totalLifetimeIncome = useMemo(
    () => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  const health = useMemo(() => {
    if (month.income === 0 && month.expense === 0 && totalSaved === 0 && totalLimit === 0)
      return { score: 70, label: "Sem dados suficientes", tone: "yellow" as const, breakdown: [] as { label: string; delta: number }[] };

    let score = 100;
    const breakdown: { label: string; delta: number }[] = [];

    // 1) Uso de cartão (até -35): quanto mais limite ocupado, menos pontos
    const cardUsageRatio = totalLimit > 0 ? totalUsed / totalLimit : 0;
    const cardPenalty = Math.round(Math.min(35, cardUsageRatio * 45));
    if (cardPenalty > 0) { score -= cardPenalty; breakdown.push({ label: `Uso de cartão ${Math.round(cardUsageRatio * 100)}%`, delta: -cardPenalty }); }

    // 2) Despesas vs receitas do mês (até -35): quanto mais perto/acima, mais penalidade
    if (month.income > 0) {
      const expRatio = month.expense / month.income;
      if (expRatio > 0.7) {
        const expPenalty = Math.round(Math.min(35, (expRatio - 0.7) * 90));
        score -= expPenalty;
        breakdown.push({ label: `Despesas ${Math.round(expRatio * 100)}% da receita`, delta: -expPenalty });
      }
    } else if (month.expense > 0) {
      score -= 25;
      breakdown.push({ label: "Despesas sem receita", delta: -25 });
    }

    // 3) Reserva (até -30): pouco guardado em relação ao arrecadado
    if (totalLifetimeIncome > 0) {
      const savedRatio = totalSaved / totalLifetimeIncome;
      if (savedRatio < 0.2) {
        const savePenalty = Math.round(Math.min(30, (0.2 - savedRatio) * 150));
        score -= savePenalty;
        breakdown.push({ label: `Reserva ${Math.round(savedRatio * 100)}% do arrecadado`, delta: -savePenalty });
      }
    } else if (totalSaved === 0) {
      score -= 15;
      breakdown.push({ label: "Sem reserva guardada", delta: -15 });
    }

    score = Math.round(Math.max(0, Math.min(100, score)));
    const label = score >= 75 ? "Excelente" : score >= 55 ? "Saudável" : score >= 35 ? "Atenção" : "Crítico";
    const tone: "success" | "teal" | "yellow" | "danger" =
      score >= 75 ? "success" : score >= 55 ? "teal" : score >= 35 ? "yellow" : "danger";
    return { score, label, tone, breakdown };
  }, [month, totalLimit, totalUsed, totalSaved, totalLifetimeIncome]);

  const series = useMemo(() => {
    const out: Array<{ month: string; receitas: number; despesas: number; forecast?: boolean }> = [];
    for (let i = periodMonths - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const tx = transactions.filter((t) => isSameMonth(t.date, d));
      const invTotal = computeInvoicesForMonth(transactions, cards, d).reduce((s, x) => s + x.amount, 0);
      out.push({
        month: d.toLocaleDateString("pt-BR", { month: "short", year: periodMonths > 6 ? "2-digit" : undefined }),
        receitas: tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        despesas: tx.filter(isCashFlowExpense).reduce((s, t) => s + t.amount, 0) + invTotal,
      });
    }
    // Previsão: média dos últimos 3 meses (ignora meses zerados) + parcelas futuras já agendadas
    if (forecastN > 0) {
      const last3 = out.slice(-3);
      const nz = last3.filter(r => r.receitas + r.despesas > 0);
      const baseRec = nz.length ? nz.reduce((s, r) => s + r.receitas, 0) / nz.length : 0;
      const baseDes = nz.length ? nz.reduce((s, r) => s + r.despesas, 0) / nz.length : 0;
      for (let i = 1; i <= forecastN; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const tx = transactions.filter((t) => isSameMonth(t.date, d));
        const invTotal = computeInvoicesForMonth(transactions, cards, d).reduce((s, x) => s + x.amount, 0);
        const scheduledDes = tx.filter(isCashFlowExpense).reduce((s, t) => s + t.amount, 0) + invTotal;
        const scheduledRec = tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        out.push({
          month: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }) + " ✦",
          receitas: Math.round(Math.max(scheduledRec, baseRec)),
          despesas: Math.round(scheduledDes + baseDes),
          forecast: true,
        });
      }
    }
    return out;
  }, [transactions, cards, periodMonths, forecastN]);

  const byCat = useMemo(
    () =>
      categories
        .map((c) => ({
          name: c.name,
          value: month.tx
            .filter((t) => isCashFlowExpense(t) && t.categoryId === c.id)
            .reduce((s, t) => s + t.amount, 0),
          color: c.color,
        }))
        .filter((c) => c.value > 0),
    [categories, month.tx],
  );

  // Gastos por categoria nos últimos N meses (filtrável)
  const expenseCats = useMemo(() => categories.filter((c) => c.kind !== "income"), [categories]);
  const activeCats = useMemo(() => {
    if (selectedCats.length > 0) return expenseCats.filter((c) => selectedCats.includes(c.id));
    // default: top 5 categorias com mais gasto no período
    const totals = expenseCats.map((c) => ({
      c,
      total: transactions
        .filter((t) => {
          if (!isCashFlowExpense(t) || t.categoryId !== c.id) return false;
          const d = new Date(t.date + "T00:00:00");
          const limit = new Date(today.getFullYear(), today.getMonth() - (catPeriod - 1), 1);
          return d >= limit;
        })
        .reduce((s, t) => s + t.amount, 0),
    }));
    return totals
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((x) => x.c);
  }, [expenseCats, transactions, catPeriod, selectedCats]);

  const catSeries = useMemo(() => {
    const out: Array<Record<string, string | number>> = [];
    for (let i = catPeriod - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const row: Record<string, string | number> = {
        month: d.toLocaleDateString("pt-BR", { month: "short", year: catPeriod > 6 ? "2-digit" : undefined }),
      };
      for (const c of activeCats) {
        row[c.name] = transactions
          .filter((t) => isCashFlowExpense(t) && t.categoryId === c.id && isSameMonth(t.date, d))
          .reduce((s, t) => s + t.amount, 0);
      }
      out.push(row);
    }
    return out;
  }, [catPeriod, activeCats, transactions]);

  const catTotals = useMemo(
    () =>
      activeCats.map((c) => ({
        ...c,
        total: catSeries.reduce((s, row) => s + (Number(row[c.name]) || 0), 0),
      })),
    [activeCats, catSeries],
  );
  const catGrandTotal = catTotals.reduce((s, c) => s + c.total, 0);

  // Annual goal — vinculada ao "guardado" nos bancos
  const goal = user?.yearlyGoal ?? 0;
  const yearSaved = totalSaved;
  const goalPct = goal > 0 ? Math.max(0, Math.min(100, (yearSaved / goal) * 100)) : 0;

  // tip of the day
  const tip = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];

  const monthLabel = displayMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthSub = monthOffset === 0
    ? "Mês atual"
    : monthOffset < 0 ? `${Math.abs(monthOffset)} ${Math.abs(monthOffset) === 1 ? "mês atrás" : "meses atrás"}`
    : `${monthOffset} ${monthOffset === 1 ? "mês à frente · previsão" : "meses à frente · previsão"}`;

  return (
    <AppShell>
      <header className="mb-8">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          {today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold mt-1">
          <span className="text-gradient">{greeting}</span>
        </h1>
      </header>

      {rankUp && (
        <div className="mb-4 rounded-2xl border p-4 flex items-center gap-3 flex-wrap animate-in fade-in slide-in-from-top-2"
          style={{ borderColor: rankUp.color + "66", background: rankUp.color + "12" }}>
          <div className="size-10 rounded-xl grid place-items-center shrink-0"
            style={{ background: rankUp.color + "26", color: rankUp.color }}>
            <Trophy className="size-5" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold">Parabéns! Você subiu de nível 🎉</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sua saúde financeira evoluiu — agora você é <span className="font-semibold" style={{ color: rankUp.color }}>{rankUp.name}</span>. Continue com o mesmo ritmo!
            </p>
          </div>
          <button onClick={() => setRankUp(null)}
            aria-label="Dispensar" className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5">
            <X className="size-4" />
          </button>
        </div>
      )}



      {showTutorialNotice && (
        <div className="mb-4 rounded-2xl border border-secondary/40 bg-secondary/10 p-4 flex items-center gap-3 flex-wrap">
          <div className="size-10 rounded-xl grid place-items-center bg-secondary/20 text-secondary shrink-0">
            <GraduationCap className="size-5" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold">Quer um guia rápido pelo CloseFinance?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ative os tutoriais no <Link to="/perfil" className="text-secondary underline underline-offset-2">Perfil</Link> para receber dicas em Ganhos, Gastos, Categorias, Bancos e Cartões.
            </p>
          </div>
          <Link to="/perfil" className="rounded-xl bg-secondary text-secondary-foreground font-semibold px-4 py-2 text-xs hover:opacity-90 transition">
            Ir para Perfil
          </Link>
          <button onClick={() => { dismissTutorialNotice(); setShowTutorialNotice(false); }}
            aria-label="Dispensar" className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5">
            <X className="size-4" />
          </button>
        </div>
      )}

      <ChartVisibilityBar hidden={hidden} onToggle={toggleHidden} />

      <GlassCard hideKey="index-1" hideLabel="Seletor de mês" className="mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => setMonthOffset(o => o - 1)} aria-label="Mês anterior"
              className="rounded-xl p-2 border border-border hover:bg-white/5 active:scale-95 transition">
              <ChevronLeft className="size-4" />
            </button>
            <div className="min-w-[180px] text-center">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{monthSub}</p>
              <p className="font-display text-base font-bold capitalize">{monthLabel}</p>
            </div>
            <button onClick={() => setMonthOffset(o => o + 1)} aria-label="Próximo mês"
              className="rounded-xl p-2 border border-border hover:bg-white/5 active:scale-95 transition">
              <ChevronRight className="size-4" />
            </button>
            {monthOffset !== 0 && (
              <button onClick={() => setMonthOffset(0)} data-no-sound
                className="ml-1 rounded-full border border-border px-3 py-1 text-[11px] font-mono text-muted-foreground hover:bg-white/5">
                hoje
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3 text-secondary" /> Previsão fluxo
            </span>
            <div className="inline-flex rounded-xl border border-border overflow-hidden text-[11px] font-mono">
              {([0, 3, 6] as const).map((n) => (
                <button key={n} onClick={() => setForecastN(n)}
                  className={`px-3 py-1.5 transition ${forecastN === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5"}`}>
                  {n === 0 ? "off" : `+${n}m`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Stat label={`Receitas · ${isFutureMonth ? "previsto" : "mês"}`} value={formatBRL(month.income)} accent="teal" sub={isFutureMonth ? "agendado / parcelas" : "Entradas confirmadas"} />
        <Stat
          label="Despesas do mês"
          value={formatBRL(month.expense)}
          accent="crimson"
          sub={`${formatBRL(month.essential)} essenciais`}
        />
        <Stat
          label="Saldo previsto"
          value={formatBRL(month.balance)}
          accent={month.balance >= 0 ? "success" : "danger"}
          sub="Receitas − Despesas"
        />
        <Stat
          label="Cartão · disponível"
          value={formatBRL(totalAvailable)}
          accent="violet"
          sub={`de ${formatBRL(totalLimit)}`}
        />
        <Stat
          label="Cartão · gasto no mês"
          value={formatBRL(totalUsed)}
          accent="crimson"
          sub={`${Math.round(totalCardPct)}% do limite`}
        />
      </section>

      {/* Limite dos cartões (resumo) + Dica + Meta */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <GlassCard hideKey="index-2" hideLabel="Limite dos cartões" className="lg:col-span-2">
          <SectionTitle
            title="Limite dos cartões"
            subtitle={cards.length === 0 ? "cadastre um cartão para começar" : `${cards.length} cartão(ões) · ${Math.round(totalCardPct)}% do limite total`}
            action={
              <Link to="/cartoes" className="text-xs font-mono text-secondary hover:underline">
                ver todos →
              </Link>
            }
          />
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum cartão cadastrado ainda. Vá em{" "}
              <Link to="/cartoes" className="text-secondary underline">Cartões</Link> para adicionar.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-2xl bg-white/5 border border-border p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Limite total</p>
                  <p className="text-lg font-bold font-mono mt-1">{formatBRL(totalLimit)}</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-border p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Usado</p>
                  <p className="text-lg font-bold font-mono mt-1" style={{ color: "#FF6B1A" }}>{formatBRL(totalUsed)}</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-border p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Disponível</p>
                  <p className="text-lg font-bold font-mono mt-1" style={{ color: "#2BD9A1" }}>{formatBRL(totalAvailable)}</p>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden mb-4">
                <div
                  className="h-full transition-all duration-700"
                  style={{ width: `${totalCardPct}%`, background: "linear-gradient(90deg, #540BD3, #FFCC00)" }}
                />
              </div>
              <ul className="space-y-2.5">
                {cardUsage.slice(0, 3).map((c) => (
                  <li key={c.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="size-2 rounded-full" style={{ background: c.color }} />
                        {c.name}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {formatBRL(c.used)} / {formatBRL(c.limit)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full transition-all duration-700" style={{ width: `${c.pct}%`, background: c.color }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </GlassCard>

        <div className="space-y-4">
          <GlassCard hideKey="index-3" hideLabel="Dica do dia">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="size-4 text-secondary" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Dica do dia</p>
            </div>
            <p className="text-sm leading-relaxed">{tip}</p>
          </GlassCard>
          <GlassCard hideKey="index-4" hideLabel="Meta anual">
            <div className="flex items-center gap-2 mb-3">
              <Target className="size-4 text-secondary" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Meta anual</p>
            </div>
            {goal > 0 ? (
              <>
                <p className="text-xl font-bold">
                  {formatBRL(yearSaved)}{" "}
                  <span className="font-mono text-xs text-muted-foreground">/ {formatBRL(goal)}</span>
                </p>
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${goalPct}%`, background: "var(--gradient-primary)" }}
                  />
                </div>
                <p className="mt-2 text-xs font-mono text-muted-foreground">{Math.round(goalPct)}% concluído</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Cadastre sua meta no seu perfil para ver o progresso aqui.
              </p>
            )}
          </GlassCard>
        </div>
      </section>

      {/* Essenciais vs Não essenciais — logo após os cartões, mais destaque */}
      {!hidden.essentials && (
        <section className="mb-6">
          <GlassCard hideKey="index-10" hideLabel="Essenciais vs. Não essenciais">
            <SectionTitle title="Essenciais vs. Não essenciais" subtitle="onde seu dinheiro está indo este mês" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
              <div className="space-y-5">
                <Bar
                  label="Essenciais"
                  value={month.essential}
                  total={month.expense || 1}
                  color="#006F77"
                  icon={<TrendingDown className="size-4" />}
                />
                <Bar
                  label="Não essenciais"
                  value={month.nonEssential}
                  total={month.expense || 1}
                  color="#820432"
                  icon={<TrendingUp className="size-4" />}
                />
              </div>
              <div className="rounded-2xl bg-white/5 p-4 border border-border">
                <p className="font-mono text-xs text-muted-foreground">Insight</p>
                <p className="text-sm mt-1 leading-relaxed">
                  Manter gastos não essenciais abaixo de <span className="font-semibold text-secondary">30%</span> do total ajuda a poupar mais e melhora sua saúde financeira.
                </p>
              </div>
            </div>
          </GlassCard>
        </section>
      )}


      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <GlassCard hideKey="index-5" hideLabel="Saúde financeira" className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse className="size-5 text-secondary" />
            <h3 className="font-semibold">Saúde financeira</h3>
          </div>
          <HealthRing score={health.score} tone={health.tone} />
          <p className="text-center mt-4 font-display text-lg font-semibold">{health.label}</p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex justify-between font-mono">
              <span className="text-muted-foreground">Taxa de poupança</span>
              <span>{month.income > 0 ? `${Math.round((month.balance / month.income) * 100)}%` : "—"}</span>
            </li>
            <li className="flex justify-between font-mono">
              <span className="text-muted-foreground">Essenciais</span>
              <span>{month.expense > 0 ? `${Math.round((month.essential / month.expense) * 100)}%` : "—"}</span>
            </li>
            <li className="flex justify-between font-mono">
              <span className="text-muted-foreground">Uso de cartão</span>
              <span>{totalLimit > 0 ? `${Math.round((totalUsed / totalLimit) * 100)}%` : "—"}</span>
            </li>
          </ul>
        </GlassCard>

        {!hidden.flow && (<GlassCard hideKey="index-6" hideLabel="Fluxo de caixa" className="lg:col-span-2">
          <SectionTitle
            title={`Fluxo dos últimos ${periodMonths} meses`}
            subtitle="ganhos em ciano · gastos em laranja"
            action={
              <div className="inline-flex rounded-xl border border-border overflow-hidden text-[11px] font-mono">
                {([3, 6, 12] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPeriodMonths(n)}
                    className={`px-3 py-1.5 transition ${periodMonths === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5"}`}
                  >
                    {n === 12 ? "1 ano" : `${n} m`}
                  </button>
                ))}
              </div>
            }
          />

          <motion.div
            className="h-64"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CYAN} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={11}
                  tick={{ fill: "rgba(255,255,255,0.7)", fontFamily: MONO }}
                />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.6)", fontFamily: MONO }} />
                <Tooltip cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }} content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="receitas"
                  name="Ganhos"
                  stroke={CYAN}
                  fill="url(#dCyan)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  animationDuration={1100}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  name="Gastos"
                  stroke={ORANGE}
                  fill="url(#dOrange)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  animationDuration={1100}
                  animationBegin={180}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </GlassCard>)}
      </section>

      {!hidden.cards && (<section className="mb-8">
        <SectionTitle title="Limite dos cartões" subtitle="usado e disponível por cartão neste mês" />
        {cards.length === 0 ? (
          <GlassCard hideKey="index-7" hideLabel="Cartões">
            <p className="text-sm text-muted-foreground">
              Cadastre seus cartões em{" "}
              <Link to="/cartoes" className="text-secondary underline">
                Cartões
              </Link>
              .
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {cardUsage.map((c) => (
              <div
                key={c.id}
                className="glass rounded-3xl p-5 relative overflow-hidden hover:translate-y-[-2px] transition-transform duration-300"
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ background: `radial-gradient(400px 200px at 100% 0%, ${c.color}, transparent 60%)` }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                      <p className="font-semibold">{c.name}</p>
                    </div>
                    <CreditCard className="size-4 text-muted-foreground" />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">Usado</p>
                      <p className="text-2xl font-bold">{formatBRL(c.used)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-muted-foreground">Limite</p>
                      <p className="text-lg font-bold font-mono">{formatBRL(c.limit)}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.pct}%`, background: `linear-gradient(90deg, ${c.color}, #FFCC00)` }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Disponível</span>
                    <span className="font-semibold">{formatBRL(c.available)}</span>
                  </div>
                  <p className="mt-2 text-[11px] font-mono text-muted-foreground">
                    Libera dia {c.dueDay} · fechamento dia {c.closingDay}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>)}

      {!hidden.catHistory && (<section className="mb-8">
        <GlassCard hideKey="index-8" hideLabel="Gastos por categoria · histórico">
          <SectionTitle
            title="Gastos por categoria · histórico"
            subtitle={
              selectedCats.length > 0
                ? `${activeCats.length} categoria(s) selecionada(s)`
                : "top 5 categorias do período"
            }
            action={
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-secondary" />
                <div className="inline-flex rounded-xl border border-border overflow-hidden text-[11px] font-mono">
                  {([3, 6, 12] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setCatPeriod(n)}
                      className={`px-3 py-1.5 transition ${catPeriod === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5"}`}
                    >
                      {n === 12 ? "1 ano" : `${n} meses`}
                    </button>
                  ))}
                </div>
              </div>
            }
          />

          {expenseCats.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cadastre categorias de gasto em{" "}
              <Link to="/categorias" className="text-secondary underline">
                Categorias
              </Link>
              .
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {expenseCats.map((c) => {
                  const active = selectedCats.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCats((s) => (active ? s.filter((x) => x !== c.id) : [...s, c.id]))}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono transition ${active ? "border-transparent text-foreground" : "border-border text-muted-foreground hover:bg-white/5"}`}
                      style={active ? { background: c.color + "33", borderColor: c.color } : undefined}
                    >
                      <span className="size-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </button>
                  );
                })}
                {selectedCats.length > 0 && (
                  <button
                    onClick={() => setSelectedCats([])}
                    className="text-[11px] font-mono text-muted-foreground hover:text-foreground underline ml-1"
                  >
                    limpar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                <motion.div className="h-72" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, ease: "easeOut" }}>
                  {activeCats.length === 0 ? (
                    <div className="h-full grid place-items-center text-sm text-muted-foreground">
                      Sem gastos no período.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={catSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="month"
                          stroke="rgba(255,255,255,0.5)"
                          fontSize={11}
                          tick={{ fill: "rgba(255,255,255,0.7)", fontFamily: MONO }}
                        />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.6)", fontFamily: MONO }} />
                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: 11, color: "#fff" }}
                          formatter={(value) => <span style={{ color: "#fff" }}>{value}</span>}
                        />
                        {activeCats.map((c, i) => (
                          <RBar
                            key={c.id}
                            dataKey={c.name}
                            stackId="a"
                            fill={c.color}
                            radius={[6, 6, 0, 0]}
                            animationDuration={800}
                            animationBegin={i * 90}
                            animationEasing="ease-out"
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>

                <div className="rounded-2xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          Categoria
                        </th>
                        <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">
                          Total
                        </th>
                        <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {catTotals.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-4 text-center text-xs text-muted-foreground">
                            Sem dados
                          </td>
                        </tr>
                      )}
                      {catTotals.map((c) => (
                        <tr key={c.id} className="border-t border-border">
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-2">
                              <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                              {c.name}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{formatBRL(c.total)}</td>
                          <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                            {catGrandTotal > 0 ? Math.round((c.total / catGrandTotal) * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                      {catTotals.length > 0 && (
                        <tr className="border-t border-border bg-white/5">
                          <td className="px-3 py-2 font-semibold">Total</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold">{formatBRL(catGrandTotal)}</td>
                          <td className="px-3 py-2 text-right font-mono text-muted-foreground">100%</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </GlassCard>
      </section>)}

      {!hidden.catPie && (
        <section className="mb-8">
          <GlassCard hideKey="index-9" hideLabel="Gastos por categoria">
            <SectionTitle title="Gastos por categoria" subtitle="distribuição do mês atual" />
            <motion.div className="h-64" initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, ease: "easeOut" }}>
              {byCat.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem gastos categorizados este mês.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCat}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      animationDuration={900}
                      animationBegin={120}
                      animationEasing="ease-out"
                    >
                      {byCat.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="rgba(0,0,0,0)" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip showTotal={false} />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: "#fff" }}
                      formatter={(value) => <span style={{ color: "#fff" }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </GlassCard>
        </section>
      )}
    </AppShell>
  );
}


function ChartVisibilityBar({ hidden, onToggle }: { hidden: Record<string, boolean>; onToggle: (k: string) => void }) {
  const items = [
    { key: "flow", label: "Fluxo de caixa" },
    { key: "cards", label: "Limite cartões" },
    { key: "catHistory", label: "Histórico categorias" },
    { key: "catPie", label: "Gastos por categoria" },
    { key: "essentials", label: "Essenciais x não" },
  ];
  return (
    <GlassCard hideKey="index-11" hideLabel="Mostrar gráficos" className="mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mr-1">Mostrar gráficos:</span>
        {items.map((it) => {
          const off = hidden[it.key];
          const Ico = off ? EyeOff : Eye;
          return (
            <button key={it.key} data-no-sound onClick={() => onToggle(it.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono transition active:scale-95 ${off ? "border-border text-muted-foreground opacity-70" : "border-secondary/40 bg-secondary/10 text-secondary"}`}>
              <Ico className="size-3" /> {it.label}
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}



function Bar({
  label,
  value,
  total,
  color,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          {icon}
          {label}
        </span>
        <span className="font-mono text-muted-foreground">
          {formatBRL(value)} · {pct}%
        </span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, #FFCC00)` }}
        />
      </div>
    </div>
  );
}

function HealthRing({
  score,
  tone,
}: {
  score: number;
  tone: "violet" | "yellow" | "teal" | "crimson" | "success" | "danger";
}) {
  const radius = 60;
  const c = 2 * Math.PI * radius;
  const offset = c - (score / 100) * c;
  const colorMap: Record<string, string> = {
    violet: "#540BD3",
    yellow: "#f4fafe",
    teal: "#006F77",
    crimson: "#820432",
    success: "#2BD9A1",
    danger: "#FF4D6D",
  };
  return (
    <div className="flex justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={colorMap[tone]}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms ease" }}
        />
        <text
          x="80"
          y="86"
          textAnchor="middle"
          className="fill-foreground"
          style={{
            transform: "rotate(90deg)",
            transformOrigin: "80px 80px",
            fontFamily: "Poppins",
            fontWeight: 700,
            fontSize: 32,
          }}
        >
          {score}
        </text>
      </svg>
    </div>
  );
}
