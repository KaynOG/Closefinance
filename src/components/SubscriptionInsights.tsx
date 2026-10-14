import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, useStore } from "@/lib/store";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const LEVELS = [
  { v: "none", label: "Não usei", score: 0 },
  { v: "low", label: "Usei pouco", score: 1 },
  { v: "medium", label: "Usei médio", score: 2 },
  { v: "active", label: "Usei ativamente", score: 3 },
] as const;
type Log = { subscription_id: string; week_start: string; level: string };

function weekStart(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export function SubscriptionInsights() {
  const [{ subscriptions, transactions }, , user] = useStore();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const week = weekStart();
  const active = subscriptions.filter(s => s.active);

  useEffect(() => {
    if (!user) return;
    supabase.from("subscription_usage_logs").select("subscription_id,week_start,level").eq("user_id", user.id)
      .then(({ data }) => { setLogs(data ?? []); setLoaded(true); });
    setDismissed(localStorage.getItem(`cf_subweek_${user.id}`) === week);
  }, [user?.id, week]);

  const pending = active.filter(s => !logs.some(l => l.subscription_id === s.id && l.week_start === week));
  const showAsk = loaded && !dismissed && pending.length > 0;

  async function saveAnswers() {
    if (!user) return;
    const rows = Object.entries(answers).map(([subscription_id, level]) => ({ user_id: user.id, subscription_id, week_start: week, level }));
    if (rows.length) {
      await supabase.from("subscription_usage_logs").upsert(rows, { onConflict: "subscription_id,week_start" });
      setLogs(prev => [...prev.filter(l => !(l.week_start === week && answers[l.subscription_id])), ...rows]);
    }
    localStorage.setItem(`cf_subweek_${user.id}`, week);
    setDismissed(true);
  }

  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const total = transactions.filter(t => t.subscriptionId && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0);
      return { label: MONTHS[d.getMonth()], total };
    });
  }, [transactions]);
  const max = Math.max(1, ...monthly.map(m => m.total));

  const report = active.map(s => {
    const mine = logs.filter(l => l.subscription_id === s.id).sort((a, b) => b.week_start.localeCompare(a.week_start)).slice(0, 4);
    const avg = mine.length ? mine.reduce((a, l) => a + (LEVELS.find(x => x.v === l.level)?.score ?? 0), 0) / mine.length : null;
    return { s, avg, weeks: mine.length, monthly: s.amount / s.recurrenceMonths };
  });
  const toCancel = report.filter(r => r.avg !== null && r.avg < 1.25);
  const saving = toCancel.reduce((a, r) => a + r.monthly, 0);

  return <>
    <GlassCard className="mb-6">
      <SectionTitle title="Comparativo mensal" subtitle="gasto com assinaturas nos últimos 6 meses" />
      <div className="flex items-end gap-3 h-44">
        {monthly.map((m, i) => <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground whitespace-nowrap">{m.total ? `R$ ${Math.round(m.total).toLocaleString("pt-BR")}` : "—"}</span>
          <div className="w-full rounded-t-md bg-primary transition-all duration-700" style={{ height: `${(m.total / max) * 100}%`, minHeight: 2 }} />
          <span className="text-xs font-mono">{m.label}</span>
        </div>)}
      </div>
    </GlassCard>

    <GlassCard className="mb-6">
      <SectionTitle title="Relatório de uso" subtitle="com base nas suas respostas semanais (últimas 4 semanas)" />
      {report.every(r => r.avg === null) ? <p className="text-sm text-muted-foreground">Responda a pergunta semanal para gerar o relatório.</p> : <>
        <ul className="space-y-2 mb-4">
          {report.map(r => {
            const lvl = r.avg === null ? "Sem respostas" : r.avg >= 2.5 ? "Uso ativo" : r.avg >= 1.75 ? "Uso médio" : r.avg >= 1.25 ? "Uso baixo" : "Quase não usa";
            return <li key={r.s.id} className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-2 text-sm">
              <span className="font-medium truncate">{r.s.name}</span>
              <span className="font-mono text-[10px] sm:text-xs text-muted-foreground text-right">{lvl}{r.weeks ? ` · ${r.weeks} sem.` : ""} · {formatBRL(r.monthly)}/mês</span>
            </li>;
          })}
        </ul>
        {toCancel.length ? <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm flex gap-3">
          <AlertTriangle className="size-5 text-destructive shrink-0" />
          <p><strong>Observação:</strong> você quase não usa {toCancel.map(r => r.s.name).join(", ")}. Considere cancelar — economia de {formatBRL(saving)}/mês ({formatBRL(saving * 12)}/ano).</p>
        </div> : <div className="rounded-xl border border-border p-4 text-sm flex gap-3"><CheckCircle2 className="size-5 text-primary shrink-0" /><p>Você está usando bem suas assinaturas. Continue acompanhando!</p></div>}
      </>}
    </GlassCard>

    {showAsk && <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[85vh] overflow-auto rounded-2xl border border-border bg-card p-5 shadow-xl">
        <h2 className="text-lg font-bold">Como foi seu uso nesta semana?</h2>
        <p className="text-sm text-muted-foreground mb-4">Conte com que frequência usou cada serviço.</p>
        <div className="space-y-4">
          {pending.map(s => <div key={s.id}>
            <p className="text-sm font-medium mb-1.5">{s.name}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {LEVELS.map(l => <button key={l.v} type="button" onClick={() => setAnswers(a => ({ ...a, [s.id]: l.v }))}
                className={`rounded-lg border px-2 py-2 text-xs transition ${answers[s.id] === l.v ? "border-primary bg-primary/15" : "border-border"}`}>{l.label}</button>)}
            </div>
          </div>)}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={saveAnswers}>Depois</Button>
          <Button onClick={saveAnswers} disabled={!Object.keys(answers).length}>Salvar respostas</Button>
        </div>
      </div>
    </div>}
  </>;
}
