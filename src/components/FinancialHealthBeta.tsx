import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui-kit";
import {
  formatBRL,
  monthExpenseTotal,
  isCashFlowExpense,
  isCreditPurchase,
  isSameMonth,
  type Transaction,
  type Category,
  type Card,
} from "@/lib/store";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

type Tip = {
  id: string;
  title: string;
  description: string;
  monthlySaving: number;
  severity: "info" | "warn" | "critical" | "good";
};

const STORAGE_KEY = "cf.financial-health.applied.v1";

function loadApplied(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function FinancialHealthBeta({
  transactions,
  categories,
  cards,
}: {
  transactions: Transaction[];
  categories: Category[];
  cards: Card[];
}) {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<Record<string, boolean>>(() => loadApplied());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applied));
    } catch {
      /* ignore */
    }
  }, [applied]);

  const { income, expense, nonEssential, topCategory, tips, score, savingsRate } = useMemo(() => {
    const now = new Date();
    const income = transactions
      .filter(t => t.type === "income" && isSameMonth(t.date, now))
      .reduce((s, t) => s + t.amount, 0);
    const expense = monthExpenseTotal(transactions, cards, now);

    const cashExpenses = transactions.filter(t => isSameMonth(t.date, now) && isCashFlowExpense(t));
    const creditExpenses = transactions.filter(t => isSameMonth(t.date, now) && isCreditPurchase(t));
    const allExpenseTx = [...cashExpenses, ...creditExpenses];

    const nonEssential = allExpenseTx
      .filter(t => t.essential === "non_essential")
      .reduce((s, t) => s + t.amount, 0);

    // Top category
    const byCat = new Map<string, number>();
    for (const t of allExpenseTx) {
      const k = t.categoryId || "__none__";
      byCat.set(k, (byCat.get(k) || 0) + t.amount);
    }
    let topCategory: { name: string; amount: number } | null = null;
    for (const [k, v] of byCat) {
      if (!topCategory || v > topCategory.amount) {
        const cat = categories.find(c => c.id === k);
        topCategory = { name: cat?.name ?? "Sem categoria", amount: v };
      }
    }

    const savingsRate = income > 0 ? (income - expense) / income : 0;
    const tips: Tip[] = [];

    if (income === 0 && expense === 0) {
      tips.push({
        id: "no-data",
        title: "Comece registrando seus lançamentos",
        description:
          "Sem transações no mês ainda. Adicione seus ganhos e gastos para receber uma análise personalizada.",
        monthlySaving: 0,
        severity: "info",
      });
    } else {
      if (expense > income && income > 0) {
        tips.push({
          id: "overspending",
          title: "Você está gastando mais do que ganha",
          description: `Seus gastos (${formatBRL(expense)}) superam a renda (${formatBRL(
            income
          )}). Priorize cortar o excedente de ${formatBRL(expense - income)} até o fim do mês.`,
          monthlySaving: expense - income,
          severity: "critical",
        });
      }

      if (nonEssential > 0 && expense > 0 && nonEssential / expense > 0.3) {
        const cut = nonEssential * 0.3;
        tips.push({
          id: "cut-non-essential",
          title: "Reduza 30% dos gastos não essenciais",
          description: `Gastos não essenciais somam ${formatBRL(
            nonEssential
          )} (${Math.round((nonEssential / expense) * 100)}% do total). Cortar 30% libera ${formatBRL(cut)}/mês.`,
          monthlySaving: cut,
          severity: "warn",
        });
      }

      if (topCategory && expense > 0 && topCategory.amount / expense > 0.25) {
        const cut = topCategory.amount * 0.15;
        tips.push({
          id: `top-cat-${topCategory.name}`,
          title: `Revise seus gastos em "${topCategory.name}"`,
          description: `Essa categoria representa ${Math.round(
            (topCategory.amount / expense) * 100
          )}% dos seus gastos. Trocar por alternativas mais baratas pode economizar ${formatBRL(cut)}/mês.`,
          monthlySaving: cut,
          severity: "warn",
        });
      }

      if (income > 0 && savingsRate < 0.2) {
        const target = income * 0.2 - (income - expense);
        if (target > 0) {
          tips.push({
            id: "save-20",
            title: "Guarde ao menos 20% da sua renda",
            description: `Hoje você está poupando ${Math.round(
              Math.max(0, savingsRate) * 100
            )}%. Ajustar rotina para chegar a 20% significa reservar mais ${formatBRL(target)}/mês.`,
            monthlySaving: target,
            severity: "info",
          });
        }
      }

      tips.push({
        id: "emergency-fund",
        title: "Monte uma reserva de emergência",
        description:
          "Separe automaticamente uma parcela fixa todo mês em uma conta rendendo ao menos 100% do CDI, até acumular 6x seus gastos essenciais.",
        monthlySaving: Math.max(50, income * 0.05),
        severity: "info",
      });

      tips.push({
        id: "cancel-subs",
        title: "Cancele assinaturas esquecidas",
        description:
          "Streaming, apps e mensalidades pouco usadas costumam somar bem mais do que aparentam. Revise o extrato do cartão dos últimos 3 meses.",
        monthlySaving: Math.max(30, nonEssential * 0.1),
        severity: "info",
      });

      if (income > 0 && savingsRate >= 0.2) {
        tips.push({
          id: "healthy",
          title: "Você está no caminho certo",
          description: `Sua taxa de poupança está em ${Math.round(
            savingsRate * 100
          )}%. Aproveite para começar a investir o que sobra.`,
          monthlySaving: 0,
          severity: "good",
        });
      }
    }

    // Score: base 50 + savings rate + non-essential penalty
    let score = 50;
    if (income > 0) score += Math.round(Math.min(40, savingsRate * 100));
    if (expense > income && income > 0) score -= 30;
    if (expense > 0 && nonEssential / expense > 0.3) score -= 10;
    score = Math.max(0, Math.min(100, score));

    return { income, expense, nonEssential, topCategory, tips, score, savingsRate };
  }, [transactions, categories, cards]);

  const appliedSaving = tips
    .filter(t => applied[t.id])
    .reduce((s, t) => s + t.monthlySaving, 0);

  const baseNet = income - expense;
  const projectedNet = baseNet + appliedSaving;

  const months = 6;
  const projection = Array.from({ length: months }, (_, i) => ({
    label: monthLabel(i + 1),
    current: baseNet * (i + 1),
    projected: projectedNet * (i + 1),
  }));

  const maxAbs = Math.max(
    1,
    ...projection.flatMap(p => [Math.abs(p.current), Math.abs(p.projected)])
  );

  const scoreColor =
    score >= 75 ? "#2BD9A1" : score >= 50 ? "#FFCC00" : score >= 30 ? "#FF8FA3" : "#FF4D6D";

  return (
    <GlassCard>
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-left">
          <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary">
            <Activity className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Saúde financeira</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                Beta
              </span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground">análise + mapa de projeção</p>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase text-muted-foreground">Score</p>
            <p className="font-mono text-lg font-bold" style={{ color: scoreColor }}>
              {score}
            </p>
          </div>
          <span className="size-7 rounded-lg grid place-items-center bg-white/5 hover:bg-white/10 transition">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </span>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-5">

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Ganhos" value={formatBRL(income)} tone="income" icon={<TrendingUp className="size-3" />} />
            <MiniStat label="Gastos" value={formatBRL(expense)} tone="expense" icon={<TrendingDown className="size-3" />} />
            <MiniStat
              label="Sobra"
              value={formatBRL(baseNet)}
              tone={baseNet >= 0 ? "income" : "expense"}
              icon={<Sparkles className="size-3" />}
            />
          </div>

          {/* Tips */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="size-4 text-secondary" />
              <h3 className="text-sm font-semibold">Dicas para você</h3>
              <span className="text-[10px] font-mono text-muted-foreground">
                marque as que já aplica
              </span>
            </div>
            <ul className="space-y-2">
              {tips.map(t => {
                const checked = !!applied[t.id];
                return (
                  <li
                    key={t.id}
                    className={`rounded-2xl border p-3 transition ${
                      checked
                        ? "bg-primary/10 border-primary/40"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <label className="flex gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => setApplied(a => ({ ...a, [t.id]: e.target.checked }))}
                        className="mt-1 size-4 accent-[var(--primary)]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SeverityIcon severity={t.severity} />
                          <p className="text-sm font-medium">{t.title}</p>
                          {t.monthlySaving > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2BD9A1]/15 text-[#2BD9A1]">
                              ~{formatBRL(t.monthlySaving)}/mês
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {t.description}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Projection map */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Mapa financeiro — 6 meses</h3>
              </div>
              {appliedSaving > 0 && (
                <span className="text-[10px] font-mono text-[#2BD9A1]">
                  +{formatBRL(appliedSaving)}/mês aplicando dicas
                </span>
              )}
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className="flex items-end justify-between gap-2 h-40">
                {projection.map(p => {
                  const curH = (Math.abs(p.current) / maxAbs) * 100;
                  const projH = (Math.abs(p.projected) / maxAbs) * 100;
                  return (
                    <div key={p.label} className="flex-1 flex flex-col items-center gap-1 h-full">
                      <div className="flex-1 flex items-end gap-0.5 w-full justify-center">
                        <div
                          className="w-2.5 rounded-t bg-white/25"
                          style={{ height: `${curH}%` }}
                          title={`Cenário atual: ${formatBRL(p.current)}`}
                        />
                        <div
                          className="w-2.5 rounded-t"
                          style={{
                            height: `${projH}%`,
                            background:
                              p.projected >= 0 ? "var(--primary)" : "var(--destructive)",
                          }}
                          title={`Com dicas: ${formatBRL(p.projected)}`}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground">{p.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded bg-white/25" /> Cenário atual
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded" style={{ background: "var(--primary)" }} />
                  Com dicas aplicadas
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Em 6 meses (atual)</p>
                  <p className="font-mono text-sm" style={{ color: baseNet >= 0 ? "#2BD9A1" : "#FF8FA3" }}>
                    {formatBRL(baseNet * months)}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 border border-primary/30">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Em 6 meses (com dicas)</p>
                  <p className="font-mono text-sm" style={{ color: projectedNet >= 0 ? "#2BD9A1" : "#FF8FA3" }}>
                    {formatBRL(projectedNet * months)}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-2">
              Projeção linear baseada no mês atual — apenas uma estimativa, não uma garantia.
            </p>
          </div>
        </div>
      )}
    </GlassCard>

  );
}

function MiniStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "income" | "expense";
  icon: React.ReactNode;
}) {
  const color = tone === "income" ? "#2BD9A1" : "#FF8FA3";
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
      <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="font-mono text-sm mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: Tip["severity"] }) {
  if (severity === "critical") return <AlertTriangle className="size-3.5 text-[#FF4D6D]" />;
  if (severity === "warn") return <AlertTriangle className="size-3.5 text-[#FFCC00]" />;
  if (severity === "good") return <CheckCircle2 className="size-3.5 text-[#2BD9A1]" />;
  return <Lightbulb className="size-3.5 text-primary" />;
}

function monthLabel(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return names[d.getMonth()];
}
