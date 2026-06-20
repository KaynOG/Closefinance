import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { useStore, formatBRL } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Bell, AlertTriangle } from "lucide-react";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/calendario")({
  head: () => ({ meta: [{ title: "Calendário — CloseFinance" }, { name: "description", content: "Calendário de entradas, vencimentos e gastos." }] }),
  component: CalendarPage,
});

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function CalendarPage() {
  const [{ transactions, categories }] = useStore();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) arr.push(y);
    return arr;
  }, [currentYear]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const startWeekday = first.getDay();
    const total = last.getDate();
    const cells: { date?: Date; iso?: string }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({});
    for (let d = 1; d <= total; d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date, iso });
    }
    while (cells.length % 7 !== 0) cells.push({});
    return cells;
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; items: typeof transactions }>();
    for (const t of transactions) {
      const m = map.get(t.date) ?? { income: 0, expense: 0, items: [] };
      if (t.type === "income") m.income += t.amount; else m.expense += t.amount;
      m.items.push(t);
      map.set(t.date, m);
    }
    return map;
  }, [transactions]);

  const selectedItems = selected ? (byDay.get(selected)?.items ?? []) : [];

  return (
    <AppShell>
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Planejamento</p>
          <h1 className="text-3xl font-bold capitalize">{cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={cursor.getMonth()}
            onChange={(e) => setCursor(new Date(cursor.getFullYear(), parseInt(e.target.value), 1))}
            className="glass rounded-xl px-3 py-2 text-sm font-mono bg-transparent outline-none hover:bg-white/10 cursor-pointer">
            {MONTHS.map((m, i) => <option key={m} value={i} className="bg-[#14062E]">{m}</option>)}
          </select>
          <select
            value={cursor.getFullYear()}
            onChange={(e) => setCursor(new Date(parseInt(e.target.value), cursor.getMonth(), 1))}
            className="glass rounded-xl px-3 py-2 text-sm font-mono bg-transparent outline-none hover:bg-white/10 cursor-pointer">
            {years.map((y) => <option key={y} value={y} className="bg-[#14062E]">{y}</option>)}
          </select>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="glass rounded-xl p-2 hover:bg-white/10" aria-label="Mês anterior"><ChevronLeft className="size-5" /></button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="glass rounded-xl p-2 hover:bg-white/10" aria-label="Próximo mês"><ChevronRight className="size-5" /></button>
          <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }} className="glass rounded-xl px-3 py-2 text-xs font-mono hover:bg-white/10">Hoje</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <GlassCard>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
              <div key={d} className="text-center text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((c, i) => {
              if (!c.date) return <div key={i} />;
              const data = byDay.get(c.iso!);
              const isToday = c.iso === new Date().toISOString().slice(0,10);
              const isSel = selected === c.iso;
              return (
                <button key={i} onClick={() => setSelected(c.iso!)}
                  className={`relative min-h-[78px] rounded-2xl p-2 text-left transition group border ${
                    isSel ? "border-secondary bg-secondary/10" : "border-white/5 hover:border-white/20 bg-white/[0.02]"
                  } ${isToday ? "ring-1 ring-primary" : ""}`}>
                  <span className={`text-sm font-semibold ${isToday ? "text-secondary" : ""}`}>{c.date.getDate()}</span>
                  {data && (
                    <div className="mt-1 space-y-1">
                      {data.income > 0 && <p className="text-[10px] font-mono text-[#2BD9A1] truncate">+{formatBRL(data.income)}</p>}
                      {data.expense > 0 && <p className="text-[10px] font-mono text-[#FF8FA3] truncate">-{formatBRL(data.expense)}</p>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="h-fit lg:sticky lg:top-4">
          <SectionTitle title={selected ? "Detalhes" : "Selecione um dia"} subtitle={selected ?? "para ver as transações"} />
          {selectedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem lançamentos neste dia.</p>
          ) : (
            <ul className="space-y-2">
              {selectedItems.map((t) => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <li key={t.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {cat && <span className="size-2 rounded-full" style={{ background: cat.color }} />}
                        <p className="text-sm font-medium truncate">{t.description || (t.type === "income" ? "Entrada" : "Gasto")}</p>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground">{cat?.name ?? "Sem categoria"} · {t.essential === "essential" ? "essencial" : t.essential === "non_essential" ? "não essencial" : "—"}</p>
                    </div>
                    <p className={`font-mono text-sm ${t.type === "income" ? "text-[#2BD9A1]" : "text-[#FF8FA3]"}`}>
                      {t.type === "income" ? "+" : "-"}{formatBRL(t.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>
    </AppShell>
  );
}
