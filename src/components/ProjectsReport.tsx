import { useMemo } from "react";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { formatBRL } from "@/lib/store";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)", "var(--chart-7)"];

type P = { id: string; name: string };
type E = { project_id: string; name: string; amount: number; date: string };

export function ProjectsReport({ projects, expenses }: { projects: P[]; expenses: E[] }) {
  const data = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const rows = projects.map((p, i) => {
      const xs = expenses.filter(e => e.project_id === p.id);
      const sum = xs.reduce((s, e) => s + e.amount, 0);
      const biggest = xs.reduce<E | null>((b, e) => (!b || e.amount > b.amount ? e : b), null);
      const months = new Set(xs.map(e => e.date.slice(0, 7))).size;
      return { p, color: COLORS[i % COLORS.length], sum, count: xs.length, biggest, avgMonth: months ? sum / months : 0, share: total ? (sum / total) * 100 : 0 };
    });
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { label: MONTHS[d.getMonth()], values: rows.map(r => expenses.filter(e => e.project_id === r.p.id && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0)) };
    });
    const max = Math.max(1, ...months.flatMap(m => m.values));
    const sorted = [...rows].sort((a, b) => b.sum - a.sum);
    return { total, rows, months, max, top: sorted[0] };
  }, [projects, expenses]);

  if (!projects.length) return null;

  return (
    <GlassCard className="mt-6">
      <SectionTitle title="Relatório de gastos dos projetos" subtitle="comparativo entre projetos e evolução mês a mês" />
      <p className="text-sm mb-4">
        Total investido em projetos: <strong className="font-mono">{formatBRL(data.total)}</strong>
        {data.top && data.top.sum > 0 && <> · O projeto com mais gastos é <strong>{data.top.p.name}</strong> ({data.top.share.toFixed(0)}% do total).</>}
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs font-mono text-muted-foreground border-b border-border">
            <th className="py-2 pr-3">Projeto</th><th className="py-2 pr-3">Total</th><th className="py-2 pr-3">% do total</th><th className="py-2 pr-3">Lançamentos</th><th className="py-2 pr-3">Média/mês</th><th className="py-2">Maior gasto</th>
          </tr></thead>
          <tbody>
            {data.rows.map(r => <tr key={r.p.id} className="border-b border-border/50">
              <td className="py-2 pr-3"><span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm" style={{ background: r.color }} />{r.p.name}</span></td>
              <td className="py-2 pr-3 font-mono">{formatBRL(r.sum)}</td>
              <td className="py-2 pr-3 font-mono">
                <div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded bg-muted overflow-hidden"><div className="h-full" style={{ width: `${r.share}%`, background: r.color }} /></div>{r.share.toFixed(0)}%</div>
              </td>
              <td className="py-2 pr-3 font-mono">{r.count}</td>
              <td className="py-2 pr-3 font-mono">{formatBRL(r.avgMonth)}</td>
              <td className="py-2 text-xs">{r.biggest ? `${r.biggest.name} · ${formatBRL(r.biggest.amount)}` : "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>

      <h3 className="font-semibold text-sm mb-2">Gastos mês a mês por projeto</h3>
      <div className="flex flex-wrap gap-3 mb-3">
        {data.rows.map(r => <span key={r.p.id} className="inline-flex items-center gap-1.5 text-xs"><span className="size-3 rounded-sm" style={{ background: r.color }} />{r.p.name}</span>)}
      </div>
      <div className="flex items-end gap-3 h-56 border-b border-border pb-1">
        {data.months.map((m, i) => <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-1 min-w-0">
          <div className="flex items-end gap-0.5 w-full h-full justify-center">
            {m.values.map((v, j) => <div key={j} title={`${data.rows[j].p.name}: ${formatBRL(v)}`} className="flex-1 max-w-6 rounded-t transition-all duration-700"
              style={{ height: `${(v / data.max) * 100}%`, minHeight: v ? 3 : 0, background: data.rows[j].color }} />)}
          </div>
          <span className="text-xs font-mono">{m.label}</span>
        </div>)}
      </div>
    </GlassCard>
  );
}
