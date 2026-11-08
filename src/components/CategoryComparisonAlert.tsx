import { useMemo, useState } from "react";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui-kit";
import { AppSelect } from "@/components/AppSelect";
import { formatBRL, isCashFlowExpense, type Transaction, type Category } from "@/lib/store";
import { monthKey } from "@/lib/manual-invoices";

type Props = { transactions: Transaction[]; categories: Category[] };

export function CategoryComparisonAlert({ transactions, categories }: Props) {
  const now = new Date();
  const cur = monthKey(now);
  const prev = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const todayIso = now.toISOString().slice(0, 10);

  const totals = useMemo(() => {
    const m: Record<string, { cur: number; prev: number }> = {};
    for (const t of transactions) {
      if (t.type !== "expense" || !isCashFlowExpense(t) || t.date > todayIso) continue;
      const k = t.date.slice(0, 7);
      if (k !== cur && k !== prev) continue;
      const id = t.categoryId ?? "";
      m[id] ??= { cur: 0, prev: 0 };
      if (k === cur) m[id].cur += t.amount; else m[id].prev += t.amount;
    }
    return m;
  }, [transactions, cur, prev, todayIso]);

  const name = (id: string) => categories.find(c => c.id === id)?.name ?? "Sem categoria";
  const increases = Object.entries(totals)
    .map(([id, v]) => ({ id, ...v, diff: v.cur - v.prev }))
    .filter(x => x.diff > 0.009 && x.prev > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 4);

  const used = Object.keys(totals);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const catA = a || used[0] || "";
  const catB = b || used[1] || used[0] || "";
  const va = totals[catA] ?? { cur: 0, prev: 0 };
  const vb = totals[catB] ?? { cur: 0, prev: 0 };

  if (used.length === 0) return null;

  const pct = (c: number, p: number) => (p > 0 ? Math.round(((c - p) / p) * 100) : null);

  return (
    <GlassCard className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="size-4 text-warning" />
        <h3 className="font-semibold">Gastos acima do mês anterior</h3>
      </div>
      {increases.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma categoria gastou mais que no mês passado até agora. Continue assim!</p>
      ) : (
        <ul className="space-y-2">
          {increases.map(x => (
            <li key={x.id} className="flex items-center justify-between gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 font-medium"><TrendingUp className="size-4 text-warning" />{name(x.id)}</span>
              <span className="font-mono text-xs">+{formatBRL(x.diff)} ({pct(x.cur, x.prev)}%) · {formatBRL(x.prev)} → {formatBRL(x.cur)}</span>
            </li>
          ))}
        </ul>
      )}
      {increases.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Atenção: vale revisar esses gastos antes do fim do mês para não comprometer sua sobra.
        </p>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Comparar categorias</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[{ v: catA, set: setA, t: va }, { v: catB, set: setB, t: vb }].map((s, i) => {
            const p = pct(s.t.cur, s.t.prev);
            const up = s.t.cur > s.t.prev;
            return (
              <div key={i} className="rounded-xl border border-border p-3">
                <AppSelect aria-label={`Categoria ${i + 1}`} value={s.v} onChange={e => s.set(e.target.value)} className="w-full">
                  {used.map(id => <option key={id || "none"} value={id}>{name(id)}</option>)}
                </AppSelect>
                <div className="mt-2 text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Este mês</span><span className="font-mono">{formatBRL(s.t.cur)}</span>
                </div>
                <div className="text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Mês anterior</span><span className="font-mono">{formatBRL(s.t.prev)}</span>
                </div>
                <div className={`mt-1 text-xs font-mono flex items-center gap-1 ${up ? "text-warning" : "text-success"}`}>
                  {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {p === null ? "sem dados no mês anterior" : `${p > 0 ? "+" : ""}${p}%`}
                </div>
              </div>
            );
          })}
        </div>
        {catA !== catB && (
          <p className="mt-2 text-xs text-muted-foreground">
            Neste mês, {name(catA)} soma {formatBRL(va.cur)} e {name(catB)} soma {formatBRL(vb.cur)} — diferença de {formatBRL(Math.abs(va.cur - vb.cur))}.
          </p>
        )}
      </div>
    </GlassCard>
  );
}
