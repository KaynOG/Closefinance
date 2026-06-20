import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, isSameMonth } from "@/lib/store";
import { useState, useMemo } from "react";
import { Plus, Trash2, CreditCard as CC, AlertTriangle, CheckCircle2, ShieldAlert, TrendingUp, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/cartoes")({
  head: () => ({ meta: [{ title: "Cartões — CloseFinance" }, { name: "description", content: "Gerencie seus cartões, limites e datas." }] }),
  component: CardsPage,
});

const PALETTE = ["#540BD3", "#FFCC00", "#006F77", "#820432", "#2BD9A1", "#FF4D6D", "#B388FF"];

type Tone = "success" | "ok" | "warn" | "danger";
function statusFromPct(pct: number): { label: string; tone: Tone; color: string; note: string } {
  if (pct >= 90) return { label: "Crítico", tone: "danger", color: "#FF4D6D", note: "Gasto excessivo — perigo de estouro do limite." };
  if (pct >= 70) return { label: "Alerta", tone: "warn", color: "#FF6B1A", note: "Uso elevado — considere segurar gastos não essenciais." };
  if (pct >= 40) return { label: "Saudável", tone: "ok", color: "#FFCC00", note: "Uso moderado — está no controle, atenção ao fim do mês." };
  return { label: "Excelente", tone: "success", color: "#2BD9A1", note: "Uso baixo do limite — ótima saúde de crédito." };
}

function CardsPage() {
  const [{ cards, transactions }, api] = useStore();
  const today = new Date();

  const [form, setForm] = useState({
    name: "", limit: "", usedManual: "", closingDay: "1", dueDay: "10", color: PALETTE[0],
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const lim = parseFloat(form.limit.replace(",", "."));
    if (!form.name.trim() || !lim) return;
    api.addCard({
      name: form.name.trim(), limit: lim,
      usedManual: parseFloat(form.usedManual.replace(",", ".")) || 0,
      closingDay: Math.max(1, Math.min(28, parseInt(form.closingDay) || 1)),
      dueDay: Math.max(1, Math.min(28, parseInt(form.dueDay) || 10)),
      color: form.color,
    });
    setForm({ name: "", limit: "", usedManual: "", closingDay: "1", dueDay: "10", color: PALETTE[0] });
  }

  const overview = useMemo(() => {
    const enriched = cards.map((c) => {
      const usedTx = transactions.filter(t => t.cardId === c.id && t.type === "expense" && isSameMonth(t.date, today)).reduce((s, t) => s + t.amount, 0);
      const manual = c.usedManual ?? 0;
      const used = usedTx + manual;
      const pct = c.limit ? Math.min(100, (used / c.limit) * 100) : 0;
      return { ...c, usedTx, usedManualVal: manual, used, available: Math.max(0, c.limit - used), pct, status: statusFromPct(pct) };
    });
    const totalLimit = enriched.reduce((s, c) => s + c.limit, 0);
    const totalUsed = enriched.reduce((s, c) => s + c.used, 0);
    const totalAvail = Math.max(0, totalLimit - totalUsed);
    const totalPct = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
    const status = statusFromPct(totalPct);
    return { enriched, totalLimit, totalUsed, totalAvail, totalPct, status };
  }, [cards, transactions]);

  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Crédito</p>
        <h1 className="text-3xl font-bold">Cartões e limites</h1>
      </header>

      {/* Overview / dashboard dos cartões */}
      {cards.length > 0 && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Stat label="Limite total" value={formatBRL(overview.totalLimit)} accent="violet" sub={`${cards.length} ${cards.length === 1 ? "cartão" : "cartões"}`} />
            <Stat label="Usado no mês" value={formatBRL(overview.totalUsed)} accent="crimson" sub={`${Math.round(overview.totalPct)}% do limite`} />
            <Stat label="Disponível" value={formatBRL(overview.totalAvail)} accent="success" sub="restante neste ciclo" />
            <Stat label="Status de crédito" value={overview.status.label} accent={overview.status.tone === "success" ? "success" : overview.status.tone === "ok" ? "yellow" : overview.status.tone === "warn" ? "crimson" : "danger"} sub="quanto + perto do teto, pior" />
          </section>

          <GlassCard className="mb-6">
            <SectionTitle title="Saúde geral dos cartões" subtitle="visão consolidada · uso vs. limite" />
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-muted-foreground">0%</span>
              <span style={{ color: overview.status.color }}>{Math.round(overview.totalPct)}% usado</span>
              <span className="text-muted-foreground">100%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full transition-all duration-700"
                style={{ width: `${overview.totalPct}%`, background: `linear-gradient(90deg, #2BD9A1, #FFCC00 55%, #FF6B1A 80%, #FF4D6D 100%)` }} />
            </div>
            <div className="mt-4 flex items-start gap-2 text-sm rounded-2xl p-3 border" style={{ borderColor: overview.status.color + "55", background: overview.status.color + "12" }}>
              <HeartPulse className="size-4 mt-0.5 shrink-0" style={{ color: overview.status.color }} />
              <p><span className="font-semibold" style={{ color: overview.status.color }}>{overview.status.label}.</span> {overview.status.note}</p>
            </div>
          </GlassCard>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        <GlassCard>
          <SectionTitle title="Novo cartão" />
          <form onSubmit={submit} className="space-y-3">
            <Field label="Nome"><input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Nubank Roxinho" /></Field>
            <Field label="Limite total (R$)"><input className={inputCls} value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} inputMode="decimal" placeholder="0,00" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Fechamento (dia)"><input className={inputCls} type="number" min={1} max={28} value={form.closingDay} onChange={e => setForm({ ...form, closingDay: e.target.value })} /></Field>
              <Field label="Vencimento (dia)"><input className={inputCls} type="number" min={1} max={28} value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} /></Field>
            </div>
            <Field label="Cor de identificação">
              <div className="flex flex-wrap gap-2">
                {PALETTE.map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`size-8 rounded-full border-2 transition ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ background: c }} aria-label={c} />
                ))}
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="size-8 rounded-full bg-transparent cursor-pointer" />
              </div>
            </Field>
            <button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 glow-violet">
              <Plus className="size-4 inline mr-1.5" /> Adicionar cartão
            </button>
          </form>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
          {cards.length === 0 && (
            <GlassCard className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Você ainda não tem cartões. Cadastre seu primeiro ao lado.</p>
            </GlassCard>
          )}
          {overview.enriched.map((c) => {
            const thisClose = new Date(today.getFullYear(), today.getMonth(), c.closingDay);
            const lastClose = new Date(today.getFullYear(), today.getMonth() - 1, c.closingDay);
            const fatura = transactions
              .filter(t => t.cardId === c.id && t.type === "expense")
              .filter(t => { const d = new Date(t.date + "T00:00:00"); return d > lastClose && d <= thisClose; })
              .reduce((s, t) => s + t.amount, 0);
            const StatusIcon = c.status.tone === "danger" ? ShieldAlert : c.status.tone === "warn" ? AlertTriangle : c.status.tone === "ok" ? TrendingUp : CheckCircle2;
            return (
              <div key={c.id} className="relative rounded-3xl p-6 overflow-hidden glass-strong">
                <div className="absolute inset-0 opacity-40" style={{ background: `linear-gradient(135deg, ${c.color}66, transparent 60%)` }} />
                <div className="relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Cartão</p>
                      <h3 className="text-xl font-bold mt-1">{c.name}</h3>
                    </div>
                    <CC className="size-6 opacity-70" />
                  </div>
                  <p className="mt-6 font-mono text-xs text-muted-foreground">Limite total</p>
                  <p className="text-2xl font-bold">{formatBRL(c.limit)}</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.pct}%`, background: `linear-gradient(90deg, ${c.color}, ${c.status.color})` }} />
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-muted-foreground">Limite usado</span>
                      <span style={{ color: c.status.color }}>{Math.round(c.pct)}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={Math.round(c.pct)} readOnly aria-label="Limite usado"
                      className="w-full cursor-default appearance-none h-2 rounded-full bg-white/10 outline-none"
                      style={{ accentColor: c.status.color, background: `linear-gradient(90deg, ${c.color} 0%, ${c.status.color} ${Math.round(c.pct)}%, rgba(255,255,255,0.10) ${Math.round(c.pct)}%, rgba(255,255,255,0.10) 100%)` }} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div><p className="text-muted-foreground">Usado no mês</p><p className="text-foreground text-sm">{formatBRL(c.used)} <span className="text-muted-foreground">({Math.round(c.pct)}%)</span></p></div>
                    <div><p className="text-muted-foreground">Disponível</p><p className="text-foreground text-sm">{formatBRL(c.available)}</p></div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-white/5 border border-border p-3 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <p className="text-muted-foreground">Fatura do mês</p>
                      <p className="text-sm" style={{ color: "#FF8FA3" }}>{formatBRL(fatura)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Limite a liberar</p>
                      <p className="text-sm" style={{ color: "#2BD9A1" }}>{formatBRL(fatura)}</p>
                    </div>
                    <p className="col-span-2 text-[10px] text-muted-foreground leading-snug">Vence dia {c.dueDay} · pagar a fatura libera esse limite no cartão.</p>
                  </div>
                  <div className="mt-3 rounded-2xl p-3 border flex items-start gap-2 text-xs" style={{ borderColor: c.status.color + "55", background: c.status.color + "12" }}>
                    <StatusIcon className="size-4 mt-0.5 shrink-0" style={{ color: c.status.color }} />
                    <div>
                      <p className="font-semibold" style={{ color: c.status.color }}>{c.status.label}</p>
                      <p className="text-muted-foreground mt-0.5 leading-snug">{c.status.note}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-[11px] font-mono text-muted-foreground">
                    <span>Fecha dia {c.closingDay} · Vence dia {c.dueDay}</span>
                    <button onClick={() => api.removeCard(c.id)} className="rounded-lg p-1.5 hover:text-[#FF4D6D] hover:bg-white/10"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

const inputCls = "w-full rounded-xl bg-white/5 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white/10 transition font-mono";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span><div className="mt-1.5">{children}</div></label>;
}
