import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui-kit";
import { DottedArcGauge } from "@/components/ui/animated-dashboard-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
import { analyzeHealth } from "@/lib/financial-health";
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
  const [detail, setDetail] = useState(false);
  const [applied, setApplied] = useState<Record<string, boolean>>(() => loadApplied());


  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applied));
    } catch {
      /* ignore */
    }
  }, [applied]);

  const analysis = useMemo(() => analyzeHealth(transactions, categories, cards), [transactions, categories, cards]);
  const income = analysis.current.income;
  const expense = analysis.current.expense;
  const tips: Tip[] = analysis.insights;
  const score = analysis.score;

  // Detalhamento do mês: categorias e lançamentos que mais impactaram
  const impact = useMemo(() => {
    const now = new Date();
    const expenses = transactions.filter(
      t => isSameMonth(t.date, now) && (isCashFlowExpense(t) || isCreditPurchase(t)),
    );
    const incomes = transactions.filter(t => t.type === "income" && isSameMonth(t.date, now));
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);

    const map = new Map<string, number>();
    for (const t of expenses) {
      const k = t.categoryId || "__none__";
      map.set(k, (map.get(k) || 0) + t.amount);
    }
    const cats = Array.from(map.entries())
      .map(([k, amount]) => {
        const c = categories.find(x => x.id === k);
        return {
          id: k,
          name: c?.name ?? "Sem categoria",
          color: c?.color ?? "var(--muted-foreground)",
          amount,
          share: totalExp > 0 ? (amount / totalExp) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 8);
    const topIncomes = [...incomes].sort((a, b) => b.amount - a.amount).slice(0, 5);
    return { cats, topExpenses, topIncomes, totalExp };
  }, [transactions, categories]);


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
        <div className="flex items-center gap-2 text-left">
          <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary">
            <Activity className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Saúde financeira (BETA)</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                Beta
              </span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground">análise + mapa de projeção</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase text-muted-foreground">Score</p>
            <p className="font-mono text-lg font-bold" style={{ color: scoreColor }}>
              {score}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? "Retrair" : "Expandir"}
            aria-expanded={open}
            className="size-8 rounded-lg grid place-items-center bg-white/5 hover:bg-white/10 transition"
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-5">

          {/* Medidor animado — clique para ver o detalhamento do mês */}
          <button
            type="button"
            onClick={() => setDetail(true)}
            data-no-sound
            className="w-full text-left rounded-lg transition hover:brightness-110 focus:outline-none focus:ring-1 focus:ring-primary/50"
            aria-label="Ver categorias e lançamentos que mais impactaram o mês"
          >
            <DottedArcGauge
              centerLabel="Sobra do mês"
              centerValue={formatBRL(baseNet)}
              progress={Math.max(0.04, Math.min(1, score / 100))}
              leftLabel="Ganhos"
              leftValue={formatBRL(income)}
              leftHint={`score ${score}/100`}
              rightLabel="Gastos"
              rightValue={formatBRL(expense)}
              rightHint={income > 0 ? `${Math.round((expense / income) * 100)}% da renda` : undefined}
              footer={
                <span className="font-mono text-[10px] text-muted-foreground">
                  toque no medidor para ver o que mais impactou o mês
                </span>
              }
            />
          </button>


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
      <Dialog open={detail} onOpenChange={setDetail}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">O que mais impactou seu mês</DialogTitle>
            <DialogDescription className="font-mono text-[11px]">
              sobra {formatBRL(baseNet)} · ganhos {formatBRL(income)} · gastos {formatBRL(expense)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Categorias
              </h4>
              {impact.cats.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem gastos neste mês.</p>
              ) : (
                <ul className="space-y-2">
                  {impact.cats.slice(0, 8).map(c => (
                    <li key={c.id}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="size-2 rounded-[2px] shrink-0" style={{ background: c.color }} />
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="font-mono shrink-0">
                          {formatBRL(c.amount)}{" "}
                          <span className="text-muted-foreground">{Math.round(c.share)}%</span>
                        </span>
                      </div>
                      <div className="mt-1 h-px w-full bg-border overflow-hidden">
                        <div
                          className="h-px transition-all duration-700"
                          style={{ width: `${c.share}%`, background: c.color }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Maiores gastos
              </h4>
              <ul className="divide-y divide-border">
                {impact.topExpenses.length === 0 && (
                  <li className="text-xs text-muted-foreground py-1">Nenhum lançamento.</li>
                )}
                {impact.topExpenses.map(t => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                    <span className="truncate">
                      {t.description || "Sem descrição"}
                      <span className="font-mono text-muted-foreground">
                        {" "}· {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    </span>
                    <span className="font-mono shrink-0 text-[#FF8FA3]">−{formatBRL(t.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Maiores ganhos
              </h4>
              <ul className="divide-y divide-border">
                {impact.topIncomes.length === 0 && (
                  <li className="text-xs text-muted-foreground py-1">Nenhum ganho registrado.</li>
                )}
                {impact.topIncomes.map(t => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                    <span className="truncate">
                      {t.description || "Sem descrição"}
                      <span className="font-mono text-muted-foreground">
                        {" "}· {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    </span>
                    <span className="font-mono shrink-0 text-[#2BD9A1]">+{formatBRL(t.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
