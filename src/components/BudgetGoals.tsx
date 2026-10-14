import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, RotateCcw, Save, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CatPieChart } from "@/components/charts/lazy";
import { useStore } from "@/lib/store";
import { notify } from "@/lib/notify";
import { BUDGET_GROUPS, DEFAULT_PERCENTAGES, localMonth, monthBudget, type BudgetMonth } from "@/lib/budget-goals";

const dotClasses = { freedom: "bg-budget-freedom", comfort: "bg-budget-comfort", pleasures: "bg-budget-pleasures", knowledge: "bg-budget-knowledge", fixed: "bg-budget-fixed", goals: "bg-budget-goals" };
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function BudgetGoals() {
  const [month, setMonth] = useState(localMonth());
  return <MonthlyBudget key={month} month={month} onMonthChange={setMonth} />;
}

function MonthlyBudget({ month, onMonthChange }: { month: string; onMonthChange: (month: string) => void }) {
  const [state, api, user] = useStore();
  const stored = user?.budgetPlan?.months[month];
  const [draft, setDraft] = useState<BudgetMonth | null>(null);
  const values = draft ?? stored ?? { percentages: { ...DEFAULT_PERCENTAGES }, savedAmount: 0 };
  const [saving, setSaving] = useState(false);
  const actual = useMemo(() => monthBudget(state.transactions, state.categories, month, values.savedAmount), [state.transactions, state.categories, month, values.savedAmount]);
  const total = BUDGET_GROUPS.reduce((sum, g) => sum + values.percentages[g.id], 0);
  const currentSavings = state.banks.reduce((sum, b) => sum + b.savedAmount, 0);
  const label = new Date(`${month}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const targetData = BUDGET_GROUPS.map(g => ({ name: g.name, value: values.percentages[g.id], color: `var(--budget-${g.id})` })).filter(g => g.value > 0);
  const actualData: Array<{ name: string; value: number; color: string }> = BUDGET_GROUPS.map(g => ({ name: g.name, value: actual.groups[g.id], color: `var(--budget-${g.id})` })).filter(g => g.value > 0);
  if (actual.unassigned > 0) actualData.push({ name: "Sem vínculo", value: actual.unassigned, color: "var(--muted-foreground)" });
  if (actual.remaining > 0) actualData.push({ name: "Não destinado", value: actual.remaining, color: "var(--border)" });
  function moveMonth(delta: number) {
    const d = new Date(`${month}-01T12:00:00`);
    d.setMonth(d.getMonth() + delta);
    onMonthChange(localMonth(d));
  }
  async function save() {
    if (total !== 100 || !user) return;
    setSaving(true);
    try {
      const result = await api.updateProfile({ budgetPlan: { months: { ...user.budgetPlan?.months, [month]: values } } });
      if (result?.ok) { setDraft(null); notify("Metas deste mês salvas."); }
    } finally { setSaving(false); }
  }
  return (
    <section className="mb-10 min-w-0" aria-labelledby="budget-title">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="budget-title" className="flex items-center gap-2 text-xl font-bold"><Target className="size-5 text-primary" /> Quadro de metas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Renda registrada em {label}: <strong className="text-foreground">{money(actual.income)}</strong></p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Mês anterior" title="Mês anterior" onClick={() => moveMonth(-1)}><ChevronLeft /></Button>
          <input aria-label="Mês do quadro de metas" type="month" max={localMonth()} value={month} onChange={e => { if (e.target.value && e.target.value <= localMonth()) onMonthChange(e.target.value); }} className="min-w-0 rounded-md border border-border bg-background p-2 font-mono text-sm text-foreground" />
          <Button variant="ghost" size="icon" aria-label="Próximo mês" title="Próximo mês" disabled={month >= localMonth()} onClick={() => moveMonth(1)}><ChevronRight /></Button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr_1.2fr]">
        <div className="min-w-0">
          <h3 className="mb-3 font-semibold">Sua meta</h3>
          <div className="h-80 min-w-0">{targetData.length > 0 ? <CatPieChart data={targetData} /> : <EmptyChart text="Nenhum percentual definido" />}</div>
          <p className={`mt-3 text-center font-mono text-sm ${total === 100 ? "text-success" : "text-warning"}`}>{total}% da renda destinada</p>
        </div>
        <div className="min-w-0">
          <h3 className="mb-3 font-semibold">Seu mês real</h3>
          <div className="h-80 min-w-0">{actualData.length > 0 ? <CatPieChart data={actualData} /> : <EmptyChart text="Sem lançamentos neste mês" />}</div>
          <p className="mt-3 text-center font-mono text-sm text-muted-foreground">{money(actual.allocated)} destinados {actual.income > 0 ? `· ${(actual.allocated / actual.income * 100).toFixed(1)}% da renda` : "· sem renda registrada"}</p>
        </div>
        <div className="min-w-0">
          <h3 className="mb-3 font-semibold">Controle de orçamento</h3>
          <div className="space-y-3">
            {BUDGET_GROUPS.map(g => <div key={g.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <label id={`budget-label-${g.id}`} className="flex min-w-0 items-center gap-2 font-medium"><span className={`size-2.5 shrink-0 rounded-full ${dotClasses[g.id]}`} />{g.name}</label>
                <span className="shrink-0 font-mono text-primary">{values.percentages[g.id]}%</span>
              </div>
              <Slider className="budget-slider" aria-labelledby={`budget-label-${g.id}`} min={0} max={100} step={1} value={[values.percentages[g.id]]} onValueChange={([value]) => { if (value !== undefined) setDraft({ ...values, percentages: { ...values.percentages, [g.id]: value } }); }} />
            </div>)}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <Button variant="ghost" size="sm" title="Restaurar percentuais sugeridos" onClick={() => setDraft({ ...values, percentages: { ...DEFAULT_PERCENTAGES } })}><RotateCcw /> Redefinir</Button>
            <Button onClick={save} disabled={total !== 100 || saving || !user}><Save />{saving ? "Salvando…" : "Salvar metas"}</Button>
          </div>
          {total !== 100 && <p role="status" className="mt-2 text-xs text-warning">{total < 100 ? `Faltam ${100 - total}% para distribuir.` : `Reduza ${total - 100}% para totalizar 100%.`}</p>}
        </div>
      </div>

      <div className="my-5 grid gap-4 border-y border-border py-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Patrimônio guardado / investido nos bancos</p>
          <p className="mt-1 text-xl font-semibold text-primary">{money(currentSavings)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Saldo atual acumulado — não representa o valor poupado em {label}.</p>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Quanto você guardou / investiu em {label}?</span>
          <input aria-label="Valor poupado no mês" type="number" min="0" step="0.01" value={values.savedAmount} onChange={e => setDraft({ ...values, savedAmount: Math.max(0, Number(e.target.value) || 0) })} className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm text-foreground" />
          <span className="mt-1 block text-xs text-muted-foreground">Apenas valores que não estejam lançados em categorias de Liberdade financeira. Salve junto das metas.</span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[530px] text-sm">
          <thead className="text-xs text-muted-foreground"><tr className="border-b border-border"><th className="py-3 text-left font-medium">Grupo</th><th className="text-right font-medium">Meta / renda</th><th className="text-right font-medium">Realizado / renda</th><th className="text-right font-medium">Diferença</th></tr></thead>
          <tbody>{BUDGET_GROUPS.map(g => {
            const target = actual.income * values.percentages[g.id] / 100;
            const real = actual.groups[g.id];
            const delta = real - target;
            return <tr key={g.id} className="border-b border-border"><th scope="row" className="py-3 text-left font-medium"><span className="flex items-center gap-2"><span className={`size-2 shrink-0 rounded-full ${dotClasses[g.id]}`} />{g.name}</span></th><td className="text-right font-mono text-xs">{money(target)}<span className="block text-muted-foreground">{values.percentages[g.id]}%</span></td><td className="text-right font-mono text-xs">{money(real)}<span className="block text-muted-foreground">{actual.income > 0 ? `${(real / actual.income * 100).toFixed(1)}%` : "—"}</span></td><td className="text-right font-mono text-xs">{delta > 0 ? "+" : ""}{money(delta)}</td></tr>;
          })}</tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>Sem vínculo: {money(actual.unassigned)} · {actual.remaining >= 0 ? "Não destinado" : "Acima da renda"}: {money(Math.abs(actual.remaining))}</p>
        <Button asChild variant="link" size="sm"><Link to="/categorias">Vincular categorias</Link></Button>
      </div>
    </section>
  );
}

function EmptyChart({ text }: { text: string }) {
  return <div className="grid h-full place-items-center text-sm text-muted-foreground"><div className="flex flex-col items-center gap-4"><Target className="size-16 text-primary/40" />{text}</div></div>;
}