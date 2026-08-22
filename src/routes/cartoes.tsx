import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, isSameMonth, parseBRL, INVOICE_PAYMENT_TAG_PREFIX, CARD_PURCHASE_TAG, CARD_PURCHASE_PAID_TAG, isCardPurchaseTx, type Transaction } from "@/lib/store";
import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, CreditCard as CC, AlertTriangle, CheckCircle2, ShieldAlert, TrendingUp, HeartPulse, ChevronDown, ChevronUp, Check, ShoppingBag } from "lucide-react";
import { notify } from "@/lib/notify";
import { TutorialBox } from "@/components/TutorialBox";

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
  useEffect(() => { api.awardMission("visit_cards"); }, []);
  const today = new Date();
  const [openNew, setOpenNew] = useState(false);

  const [form, setForm] = useState({
    name: "", limit: "", usedManual: "", closingDay: "1", dueDay: "10", color: PALETTE[0],
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const lim = parseBRL(form.limit);
    if (!form.name.trim() || !lim) return;
    api.addCard({
      name: form.name.trim(), limit: lim,
      usedManual: parseBRL(form.usedManual) || 0,
      closingDay: Math.max(1, Math.min(28, parseInt(form.closingDay) || 1)),
      dueDay: Math.max(1, Math.min(28, parseInt(form.dueDay) || 10)),
      color: form.color,
    });
    setForm({ name: "", limit: "", usedManual: "", closingDay: "1", dueDay: "10", color: PALETTE[0] });
  }

  const overview = useMemo(() => {
    const todayStr = today.toISOString().slice(0, 10);
    const enriched = cards.map((c) => {
      const invoiceTag = `${INVOICE_PAYMENT_TAG_PREFIX}${c.id}`;
      // Compras no crédito (todas as parcelas, qualquer data) consomem limite
      // até que a fatura correspondente seja paga (tag __pf__:<cardId>).
      const creditOutstanding = transactions
        .filter(t => t.cardId === c.id && t.type === "expense" && t.paymentMethod === "credit" && !t.tag?.startsWith(INVOICE_PAYMENT_TAG_PREFIX))
        .reduce((s, t) => s + t.amount, 0);
      // Demais lançamentos no cartão (débito/etc) só contam no mês corrente
      const otherThisMonth = transactions
        .filter(t => t.cardId === c.id && t.type === "expense" && t.paymentMethod !== "credit" && isSameMonth(t.date, today) && !t.tag?.startsWith(INVOICE_PAYMENT_TAG_PREFIX))
        .reduce((s, t) => s + t.amount, 0);
      const usedTx = creditOutstanding + otherThisMonth;
      const released = transactions.filter(t => t.type === "expense" && t.tag?.startsWith(invoiceTag) && t.date <= todayStr).reduce((s, t) => s + t.amount, 0);
      const pending = transactions.filter(t => t.type === "expense" && t.tag?.startsWith(invoiceTag) && t.date > todayStr).reduce((s, t) => s + t.amount, 0);
      const manualRaw = c.usedManual ?? 0;
      // Dívida total = compras no crédito em aberto + uso do mês + dívida manual.
      // Pagamentos de fatura já efetivados liberam o limite (uma única subtração).
      const totalOwed = usedTx + manualRaw;
      const used = Math.max(0, totalOwed - released);
      // Restante da dívida manual (pagamento consome primeiro o crédito em aberto)
      const manual = Math.max(0, manualRaw - Math.max(0, released - usedTx));
      const pct = c.limit ? Math.min(100, (used / c.limit) * 100) : 0;
      return { ...c, usedTx, usedManualVal: manual, released, pending, used, available: Math.max(0, c.limit - used), pct, status: statusFromPct(pct) };
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

      <TutorialBox
        storageKey="cartoes"
        title="Como gerenciar seus cartões"
        steps={[
          "Em 'Novo cartão', informe nome, limite total e os dias de fechamento e vencimento.",
          "Se já tem dívida no cartão, preencha 'Limite já ocupado' para refletir o saldo real.",
          "Cada compra no crédito consome limite até a fatura ser paga.",
          "As compras se acumulam na 'Fatura do cartão' do mês de fechamento — essa fatura aparece como gasto do mês.",
          "Acompanhe a barra de saúde: verde = ok, amarelo = atenção, vermelho = perto do estouro.",
        ]}
        tip="O dia de fechamento define em qual fatura cada compra entra. Compra após fechar → vai pra fatura do próximo mês."
      />



      {/* Overview / dashboard dos cartões */}
      {cards.length > 0 && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Stat label="Limite total" value={formatBRL(overview.totalLimit)} accent="violet" sub={`${cards.length} ${cards.length === 1 ? "cartão" : "cartões"}`} />
            <Stat label="Usado no mês" value={formatBRL(overview.totalUsed)} accent="crimson" sub={`${Math.round(overview.totalPct)}% do limite`} />
            <Stat label="Disponível" value={formatBRL(overview.totalAvail)} accent="success" sub="restante neste ciclo" />
            <Stat label="Status de crédito" value={overview.status.label} accent={overview.status.tone === "success" ? "success" : overview.status.tone === "ok" ? "yellow" : overview.status.tone === "warn" ? "crimson" : "danger"} sub="quanto + perto do teto, pior" />
          </section>

          <GlassCard hideKey="cartoes-1" hideLabel="Saúde geral dos cartões" className="mb-6">
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

          <CardSyncBar />
          <CardPurchases />
        </>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        <GlassCard hideKey="cartoes-2" hideLabel="Novo cartão">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary"><CC className="size-4" /></div>
              <h2 className="text-base font-semibold">Novo cartão</h2>
            </div>
            <button onClick={() => setOpenNew(o => !o)}
              aria-label={openNew ? "Recolher" : "Expandir"}
              className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95">
              {openNew ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
          <div className={`grid transition-all duration-300 ease-out ${openNew ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <form onSubmit={submit} className="space-y-3">
                <Field label="Nome"><input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Nubank Roxinho" /></Field>
                <Field label="Limite total (R$)"><input className={inputCls} value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} inputMode="decimal" placeholder="0,00" /></Field>
                <Field label="Limite já ocupado (R$)"><input className={inputCls} value={form.usedManual} onChange={e => setForm({ ...form, usedManual: e.target.value })} inputMode="decimal" placeholder="0,00 (dívida atual no cartão)" /></Field>
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
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
          {cards.length === 0 && (
            <GlassCard hideKey="cartoes-3" hideLabel="Lista de cartões" className="md:col-span-2">
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
                  <div className="mt-6 flex items-end justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">Limite total</p>
                      <p className="text-2xl font-bold">{formatBRL(c.limit)}</p>
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                      <span className="uppercase tracking-wider">editar</span>
                      <input
                        type="text" inputMode="decimal"
                        defaultValue={c.limit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        onBlur={(e) => {
                          const v = parseBRL(e.target.value);
                          if (!isNaN(v) && v > 0 && v !== c.limit) api.updateCard(c.id, { limit: v });
                        }}
                        className="w-28 rounded-lg bg-white/5 border border-border px-2 py-1 text-right text-foreground outline-none focus:border-primary"
                      />
                    </label>
                  </div>
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
                  <div className="mt-3 rounded-2xl bg-white/5 border border-border p-3 text-xs font-mono">
                    <label className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Limite já ocupado</span>
                      <input
                        type="text" inputMode="decimal"
                        defaultValue={c.usedManualVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        onBlur={(e) => {
                          const v = parseBRL(e.target.value);
                          if (!isNaN(v) && v !== c.usedManualVal) api.updateCard(c.id, { usedManual: Math.max(0, v) });
                        }}
                        className="w-28 rounded-lg bg-white/5 border border-border px-2 py-1 text-right text-foreground outline-none focus:border-primary"
                      />
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                      Dívida já existente no cartão, somada ao uso do mês. Lançamentos: {formatBRL(c.usedTx)}.
                    </p>
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
                    {c.pending > 0 && (
                      <div className="col-span-2 rounded-lg bg-[#2BD9A1]/10 border border-[#2BD9A1]/30 px-2 py-1.5">
                        <p className="text-[10px]" style={{ color: "#2BD9A1" }}>
                          Pagamento agendado: {formatBRL(c.pending)} libera o limite na data do lançamento.
                        </p>
                      </div>
                    )}
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

function CardSyncBar() {
  const [{ transactions }, api] = useStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const stats = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const credit = transactions.filter(
      t => t.type === "expense" && t.paymentMethod === "credit" && !t.tag?.startsWith(INVOICE_PAYMENT_TAG_PREFIX),
    );
    const inMonthsAgo = (t: { date: string }, monthsBack: number) => {
      const d = new Date(t.date + "T00:00:00");
      const start = new Date(y, m - monthsBack, 1);
      const end = new Date(y, m, 1); // exclusive
      return d >= start && d < end;
    };
    const isThisMonth = (t: { date: string }) => {
      const d = new Date(t.date + "T00:00:00");
      return d.getFullYear() === y && d.getMonth() === m;
    };
    const sum = (arr: typeof credit) => arr.reduce((s, t) => s + t.amount, 0);
    const thisMonth = sum(credit.filter(isThisMonth));
    const avg = (n: number) => sum(credit.filter(t => inMonthsAgo(t, n))) / n;
    return { thisMonth, avg3: avg(3), avg6: avg(6), avg12: avg(12) };
  }, [transactions]);

  async function sync() {
    setBusy(true);
    setMsg(null);
    try {
      await api.refresh();
      setMsg("Dados sincronizados. Limites atualizados a partir dos gastos e pagamentos.");
    } catch {
      setMsg("Falha ao sincronizar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard hideKey="cartoes-sync" hideLabel="Sincronizar cartões" className="mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold">Sincronizar gastos e faturas</h3>
        </div>
        <button onClick={() => setOpen(o => !o)}
          aria-label={open ? "Ocultar" : "Expandir"}
          aria-expanded={open}
          className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95">
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-[11px] font-mono text-muted-foreground">
            Recalcula os limites disponíveis dos cartões com base nos gastos no crédito e pagamentos de fatura registrados. Use após lançar novas compras ou pagar faturas.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <MiniStat label="Gasto no mês" value={formatBRL(stats.thisMonth)} tone="#FF8FA3" />
            <MiniStat label="Média · 3 meses" value={formatBRL(stats.avg3)} tone="#FFCC00" />
            <MiniStat label="Média · 6 meses" value={formatBRL(stats.avg6)} tone="#2BD9A1" />
            <MiniStat label="Média · 12 meses" value={formatBRL(stats.avg12)} tone="#B388FF" />
          </div>

          <div className="flex items-center justify-end gap-2">
            {msg && <span className="text-[11px] font-mono text-muted-foreground mr-auto">{msg}</span>}
            <button onClick={sync} disabled={busy} data-sound="success" className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-mono font-semibold disabled:opacity-50">
              {busy ? "Sincronizando…" : "Sincronizar limites"}
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/5 p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-1" style={{ color: tone }}>{value}</p>
    </div>
  );
}

