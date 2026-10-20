import { AppDatePicker } from "@/components/AppDatePicker";
import { appConfirm } from "@/lib/app-dialog";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ColorPicker } from "@/components/ColorPicker";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, isSameMonth, parseBRL, INVOICE_PAYMENT_TAG_PREFIX, CARD_PURCHASE_TAG, CARD_PURCHASE_PAID_TAG, isCardPurchaseTx, type Transaction } from "@/lib/store";
import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, CreditCard as CC, AlertTriangle, CheckCircle2, ShieldAlert, TrendingUp, HeartPulse, ChevronDown, ChevronUp, Check, ShoppingBag, CalendarDays, BarChart3 } from "lucide-react";
import { notify } from "@/lib/notify";
import { TutorialBox } from "@/components/TutorialBox";
import { AppSelect } from "@/components/AppSelect";
import { useManualInvoices, monthKey, manualInvoiceTotal } from "@/lib/manual-invoices";

export const Route = createFileRoute("/cartoes")({
  head: () => ({ meta: [
      { property: "og:title", content: "Cartões — CloseFinance" },
      { property: "og:description", content: "Gerencie seus cartões, limites e datas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Cartões — CloseFinance" }, { name: "description", content: "Gerencie seus cartões, limites e datas." }] }),
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


      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-3">
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
                    <ColorPicker value={form.color} onChange={color => setForm({ ...form, color })} className="size-8" />
                  </div>
                </Field>
                <button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 glow-violet">
                  <Plus className="size-4 inline mr-1.5" /> Adicionar cartão
                </button>
              </form>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
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

      <ExternalPurchases />
      <ManualInvoicesBlock />
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


// ---------------- COMPRAS NO CARTÃO (roadmap de parcelas) ----------------
function closingDateFor(purchaseISO: string, closingDay: number) {
  const base = new Date(purchaseISO + "T00:00:00");
  const cd = Math.min(28, Math.max(1, closingDay));
  const offset = base.getDate() <= cd ? 0 : 1;
  return new Date(base.getFullYear(), base.getMonth() + offset, cd);
}
function fmtDate(iso: string) { return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR"); }
function monthLabel(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function CardPurchases() {
  const [{ cards, transactions }, api] = useStore();
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    cardId: "", description: "", total: "", count: "1", date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!form.cardId && cards.length) setForm(f => ({ ...f, cardId: cards[0].id }));
  }, [cards, form.cardId]);

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; card?: typeof cards[number]; description: string; items: Transaction[] }>();
    for (const t of transactions) {
      if (!isCardPurchaseTx(t)) continue;
      const key = t.installmentGroupId ?? t.id;
      const g = map.get(key) ?? {
        key,
        card: cards.find(c => c.id === t.cardId),
        description: t.description || "Compra no cartão",
        items: [] as Transaction[],
      };
      g.items.push(t);
      map.set(key, g);
    }
    return [...map.values()]
      .map(g => ({ ...g, items: g.items.sort((a, b) => (a.installmentNo ?? 1) - (b.installmentNo ?? 1)) }))
      .sort((a, b) => (b.items[0]?.date ?? "").localeCompare(a.items[0]?.date ?? ""));
  }, [transactions, cards]);

  const selectedCard = cards.find(c => c.id === form.cardId);
  const count = Math.max(1, Math.min(60, parseInt(form.count) || 1));
  const totalNum = parseBRL(form.total) || 0;
  const firstInvoice = selectedCard ? closingDateFor(form.date, selectedCard.closingDay) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cardId) return notify("Escolha um cartão.");
    if (!form.description.trim()) return notify("Descreva a compra.");
    if (totalNum <= 0) return notify("Informe o valor da compra.");
    await api.addTransaction({
      type: "expense",
      amount: Number((totalNum / count).toFixed(2)),
      description: form.description.trim(),
      date: form.date,
      cardId: form.cardId,
      paymentMethod: "credit",
      essential: "non_essential",
      installmentTotal: count,
      tag: CARD_PURCHASE_TAG,
    });
    notify(`Compra lançada em ${count}x — 1ª parcela na fatura de ${firstInvoice ? firstInvoice.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "—"}.`);
    setForm(f => ({ ...f, description: "", total: "", count: "1" }));
    setShowForm(false);
  }

  return (
    <GlassCard className="mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary shrink-0"><ShoppingBag className="size-4" /></div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">Compras no cartão</h3>
            <p className="text-[11px] font-mono text-muted-foreground">
              parcele e acompanhe o que já foi pago · entra na fatura do fechamento
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowForm(v => !v); setOpen(true); }}
            className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition">
            <Plus className="size-4" /> Nova compra
          </button>
          <button onClick={() => setOpen(o => !o)} data-no-sound aria-expanded={open}
            className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          {showForm && (
            <form onSubmit={submit} className="rounded-2xl border border-border bg-white/5 p-3 grid md:grid-cols-3 gap-3">
              <Field label="Cartão">
                <select value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })} className={inputCls}>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Descrição">
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: Tênis novo" className={inputCls} />
              </Field>
              <Field label="Valor total (R$)">
                <input value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} inputMode="decimal" placeholder="0,00" className={inputCls} />
              </Field>
              <Field label="Parcelas">
                <input type="number" min={1} max={60} value={form.count} onChange={e => setForm({ ...form, count: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Data da compra">
                <AppDatePicker aria-label="Data da compra" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
              </Field>
              <div className="flex items-end gap-2">
                <button type="submit" data-sound="success" className="flex-1 rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm active:scale-[0.98] transition">
                  Lançar compra
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2.5 text-xs font-mono hover:bg-white/5">
                  Cancelar
                </button>
              </div>
              <p className="md:col-span-3 text-[11px] font-mono text-muted-foreground">
                {count}x de {formatBRL(totalNum / count)}
                {firstInvoice && selectedCard ? ` · 1ª parcela na fatura que fecha em ${firstInvoice.toLocaleDateString("pt-BR")} (fechamento dia ${selectedCard.closingDay})` : ""}
              </p>
            </form>
          )}

          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma compra lançada por aqui ainda.</p>
          ) : (
            <div className="space-y-3">
              {groups.map(g => {
                const total = g.items.reduce((s, t) => s + t.amount, 0);
                const paid = g.items.filter(t => t.tag === CARD_PURCHASE_PAID_TAG);
                const paidAmount = paid.reduce((s, t) => s + t.amount, 0);
                const pct = total > 0 ? Math.round((paidAmount / total) * 100) : 0;
                const color = g.card?.color ?? "#540BD3";
                return (
                  <div key={g.key} className="rounded-2xl border border-border p-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm break-words">{g.description}</p>
                        <p className="text-[11px] font-mono text-muted-foreground break-words">
                          {g.card?.name ?? "cartão removido"} · {paid.length}/{g.items.length} parcelas · {formatBRL(paidAmount)} de {formatBRL(total)}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!await appConfirm(`Apagar a compra "${g.description}" e todas as parcelas?`)) return;
                          await api.removeTransaction(g.items[0].id, { wholeGroup: true });
                          notify("Compra removida.");
                        }}
                        className="rounded-lg border border-border p-2 text-[#FF4D6D] hover:bg-[#FF4D6D]/15" aria-label="Remover compra">
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>

                    <div className="mt-3 overflow-x-auto -mx-1 px-1">
                      <ol className="flex gap-2.5 min-w-max pb-1">
                        {g.items.map(inst => {
                          const isPaid = inst.tag === CARD_PURCHASE_PAID_TAG;
                          return (
                            <li key={inst.id}>
                              <div className="w-44 rounded-xl border p-2.5"
                                style={isPaid ? { borderColor: color, background: `${color}12` } : undefined}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                    {inst.installmentNo ?? 1}/{g.items.length}
                                  </span>
                                  <button
                                    data-sound="check"
                                    onClick={() => api.updateTransaction(inst.id, { tag: isPaid ? CARD_PURCHASE_TAG : CARD_PURCHASE_PAID_TAG })}
                                    className={`size-6 rounded-md grid place-items-center border transition active:scale-95 ${isPaid ? "text-white" : "border-border text-muted-foreground hover:bg-white/10"}`}
                                    style={isPaid ? { background: color, borderColor: color } : undefined}
                                    aria-label={isPaid ? "Marcar como não paga" : "Marcar como paga"}>
                                    <Check className="size-3.5" />
                                  </button>
                                </div>
                                <p className="mt-1.5 text-sm font-semibold">{formatBRL(inst.amount)}</p>
                                <p className="text-[10px] font-mono text-muted-foreground">
                                  fatura {monthLabel(inst.date)} · {fmtDate(inst.date)}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ---------------- COMPRAS JÁ PARCELADAS (somente acompanhamento) ----------------
type ExtPurchase = {
  id: string;
  cardId: string;
  description: string;
  total: number;
  count: number;
  paid: number;
  date: string;
};

function ExternalPurchases() {
  const [{ cards, currentUserId }] = useStore();
  const storageKey = `cf_ext_purchases_${currentUserId ?? "anon"}`;
  const [items, setItems] = useState<ExtPurchase[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
  });
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"total" | "parcela">("total");
  const [form, setForm] = useState({
    cardId: "", description: "", total: "", perInstallment: "", count: "1", paid: "0",
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!form.cardId && cards.length) setForm(f => ({ ...f, cardId: cards[0].id }));
  }, [cards, form.cardId]);

  function persist(next: ExtPurchase[]) {
    setItems(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
  }

  const count = Math.max(1, Math.min(60, parseInt(form.count) || 1));
  const paid = Math.max(0, Math.min(count, parseInt(form.paid) || 0));
  const totalNum = mode === "total"
    ? (parseBRL(form.total) || 0)
    : (parseBRL(form.perInstallment) || 0) * count;
  const perInst = count > 0 ? totalNum / count : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cardId) return notify("Escolha um cartão.");
    if (!form.description.trim()) return notify("Descreva a compra.");
    if (totalNum <= 0) return notify("Informe o valor da compra.");
    persist([...items, {
      id: crypto.randomUUID(),
      cardId: form.cardId,
      description: form.description.trim(),
      total: Number(totalNum.toFixed(2)),
      count, paid,
      date: form.date,
    }]);
    notify("Compra parcelada registrada — apenas acompanhamento, não entra nos gastos.");
    setForm(f => ({ ...f, description: "", total: "", perInstallment: "", count: "1", paid: "0" }));
    setShowForm(false);
  }

  const totalRemaining = items.reduce((s, p) => s + (p.total / p.count) * (p.count - p.paid), 0);

  return (
    <GlassCard className="mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-lg grid place-items-center bg-[#FFCC00]/15 text-[#FFCC00] shrink-0"><CC className="size-4" /></div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">Compras já parceladas</h3>
            <p className="text-[11px] font-mono text-muted-foreground">
              só acompanhamento · não entra como gasto nem na fatura
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowForm(v => !v); setOpen(true); }}
            className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition">
            <Plus className="size-4" /> Registrar compra
          </button>
          <button onClick={() => setOpen(o => !o)} data-no-sound aria-expanded={open}
            className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          {showForm && (
            <form onSubmit={submit} className="rounded-2xl border border-border bg-white/5 p-3 grid md:grid-cols-3 gap-3">
              <Field label="Cartão">
                <select value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })} className={inputCls}>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="O que foi comprado">
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: Geladeira" className={inputCls} />
              </Field>
              <Field label="Data da compra">
                <AppDatePicker aria-label="Data da compra" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Como informar o valor">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setMode("total")}
                    className={`rounded-xl py-2 text-[11px] font-mono border transition ${mode === "total" ? "bg-primary/20 border-primary" : "border-border text-muted-foreground hover:bg-white/5"}`}>Valor total</button>
                  <button type="button" onClick={() => setMode("parcela")}
                    className={`rounded-xl py-2 text-[11px] font-mono border transition ${mode === "parcela" ? "bg-primary/20 border-primary" : "border-border text-muted-foreground hover:bg-white/5"}`}>Valor da parcela</button>
                </div>
              </Field>
              {mode === "total" ? (
                <Field label="Valor total (R$)">
                  <input value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} inputMode="decimal" placeholder="0,00" className={inputCls} />
                </Field>
              ) : (
                <Field label="Valor de cada parcela (R$)">
                  <input value={form.perInstallment} onChange={e => setForm({ ...form, perInstallment: e.target.value })} inputMode="decimal" placeholder="0,00" className={inputCls} />
                </Field>
              )}
              <Field label="Nº de parcelas">
                <input type="number" min={1} max={60} value={form.count} onChange={e => setForm({ ...form, count: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Parcelas já pagas">
                <input type="number" min={0} max={count} value={form.paid} onChange={e => setForm({ ...form, paid: e.target.value })} className={inputCls} />
              </Field>
              <div className="flex items-end gap-2">
                <button type="submit" data-sound="success" className="flex-1 rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm active:scale-[0.98] transition">
                  Registrar
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-border px-4 py-2.5 text-xs font-mono hover:bg-white/5">
                  Cancelar
                </button>
              </div>
              <p className="md:col-span-3 text-[11px] font-mono text-muted-foreground">
                {count}x de {formatBRL(perInst)} · total {formatBRL(totalNum)} · restam {count - paid} parcelas ({formatBRL(perInst * (count - paid))})
              </p>
            </form>
          )}

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma compra parcelada registrada por aqui ainda.</p>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-white/5 p-3 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Total ainda a pagar</p>
                <p className="font-mono text-lg" style={{ color: "#FFCC00" }}>{formatBRL(totalRemaining)}</p>
              </div>
              <div className="space-y-3">
                {items.map(p => {
                  const card = cards.find(c => c.id === p.cardId);
                  const color = card?.color ?? "#FFCC00";
                  const per = p.total / p.count;
                  const remaining = per * (p.count - p.paid);
                  const pct = p.count > 0 ? Math.round((p.paid / p.count) * 100) : 0;
                  return (
                    <div key={p.id} className="rounded-2xl border border-border p-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm break-words">{p.description}</p>
                          <p className="text-[11px] font-mono text-muted-foreground break-words">
                            {card?.name ?? "cartão removido"} · compra em {fmtDate(p.date)} · {p.count}x de {formatBRL(per)}
                          </p>
                        </div>
                        <button
                          onClick={async () => { if (await appConfirm(`Remover o registro de "${p.description}"?`)) { persist(items.filter(i => i.id !== p.id)); notify("Registro removido."); } }}
                          className="rounded-lg border border-border p-2 text-[#FF4D6D] hover:bg-[#FF4D6D]/15" aria-label="Remover registro">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-mono">
                        <div>
                          <p className="text-muted-foreground">Pagas</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <button type="button" data-no-sound aria-label="Diminuir parcelas pagas"
                              onClick={() => persist(items.map(i => i.id === p.id ? { ...i, paid: Math.max(0, i.paid - 1) } : i))}
                              className="size-6 rounded-md border border-border hover:bg-white/10 grid place-items-center">−</button>
                            <span className="text-sm">{p.paid}/{p.count}</span>
                            <button type="button" data-no-sound aria-label="Aumentar parcelas pagas"
                              onClick={() => persist(items.map(i => i.id === p.id ? { ...i, paid: Math.min(i.count, i.paid + 1) } : i))}
                              className="size-6 rounded-md border border-border hover:bg-white/10 grid place-items-center">+</button>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Faltam</p>
                          <p className="text-sm mt-0.5">{p.count - p.paid} parcelas</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Resta pagar</p>
                          <p className="text-sm mt-0.5" style={{ color: "#FFCC00" }}>{formatBRL(remaining)}</p>
                        </div>
                      </div>
                      {p.paid >= p.count && (
                        <p className="mt-2 text-[11px] font-mono" style={{ color: "#2BD9A1" }}>Compra quitada 🎉</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </GlassCard>
  );
}

const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ---------------- FATURAS (valores definidos pelo usuário, só controle) ----------------
function ManualInvoicesBlock() {
  const [{ cards, currentUserId, transactions }] = useStore();
  const [items, persist] = useManualInvoices(currentUserId);
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState({ cardId: "", month: monthKey(new Date()), amount: "", note: "" });
  useEffect(() => { if (!form.cardId && cards.length) setForm(f => ({ ...f, cardId: cards[0].id })); }, [cards, form.cardId]);

  const curMonth = monthKey(new Date());
  const curTotal = manualInvoiceTotal(items, curMonth);
  const income = useMemo(() => {
    const now = new Date();
    const cur = transactions.filter(t => t.type === "income" && isSameMonth(t.date, now)).reduce((s, t) => s + t.amount, 0);
    if (cur > 0) return cur;
    const prev = [1, 2, 3].map(i => transactions.filter(t => t.type === "income" && isSameMonth(t.date, new Date(now.getFullYear(), now.getMonth() - i, 1))).reduce((s, t) => s + t.amount, 0)).filter(v => v > 0);
    return prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
  }, [transactions]);
  const ratio = income > 0 ? curTotal / income : 0;
  const chartMonths = useMemo(() => {
    const keys = [...new Set(items.map(i => i.month))].sort().slice(-6);
    const max = Math.max(1, ...keys.map(k => manualInvoiceTotal(items, k)));
    return keys.map(k => ({ key: k, label: MONTH_SHORT[new Date(`${k}-01T00:00:00`).getMonth()], total: manualInvoiceTotal(items, k), max }));
  }, [items]);
  const byMonth = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const i of items) {
      const list = map.get(i.month);
      if (list) list.push(i);
      else map.set(i.month, [i]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseBRL(form.amount) || 0;
    if (!form.cardId) return notify("Escolha um cartão.");
    if (amount <= 0) return notify("Informe o valor da fatura.");
    const existing = items.find(i => i.cardId === form.cardId && i.month === form.month);
    const next = existing
      ? items.map(i => i === existing ? { ...i, amount, note: form.note.trim() || undefined } : i)
      : [...items, { id: crypto.randomUUID(), cardId: form.cardId, month: form.month, amount, note: form.note.trim() || undefined }];
    persist(next.sort((a, b) => b.month.localeCompare(a.month)));
    notify(existing ? "Fatura atualizada — não entra nos gastos." : "Fatura registrada — não entra nos gastos.");
    setForm(f => ({ ...f, amount: "", note: "" }));
  }

  const monthLabel = (m: string) => new Date(m + "-01T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <GlassCard className="mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary shrink-0"><CC className="size-4" /></div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">Faturas</h3>
            <p className="text-[11px] font-mono text-muted-foreground">defina o valor das faturas · só controle, não entra em gastos</p>
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} data-no-sound aria-expanded={open} aria-label={open ? "Recolher faturas" : "Expandir faturas"}
          className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95">
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-4">
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre um cartão para definir faturas.</p>
          ) : (
            <form onSubmit={submit} className="rounded-2xl border border-border bg-white/5 p-3 grid md:grid-cols-4 gap-3">
              <Field label="Cartão">
                <AppSelect aria-label="Cartão da fatura" value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })} className={inputCls}>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </AppSelect>
              </Field>
              <Field label="Mês da fatura">
                <AppDatePicker aria-label="Mês da fatura" type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Valor da fatura (R$)">
                <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} inputMode="decimal" placeholder="0,00" className={inputCls} />
              </Field>
              <div className="flex items-end">
                <button type="submit" data-sound="success" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm active:scale-[0.98] transition">Salvar fatura</button>
              </div>
            </form>
          )}

          {curTotal > 0 && income > 0 && ratio >= 0.7 && (
            <div className={`rounded-2xl border p-3 text-sm ${ratio >= 0.9 ? "border-destructive/40 bg-destructive/10" : "border-secondary/40 bg-secondary/10"}`}>
              <p className="font-semibold flex items-center gap-2"><AlertTriangle className="size-4" /> Fatura do mês em {Math.round(ratio * 100)}% da sua renda</p>
              <p className="text-muted-foreground mt-1">
                {formatBRL(curTotal)} de faturas para {formatBRL(income)} de renda. Corte gastos não essenciais no cartão
                {ratio >= 0.9 ? " e, se o banco permitir, avalie parcelar a fatura — compare os juros antes, e prefira pagar à vista o que conseguir." : " pelas próximas semanas para não comprometer o próximo mês."}
              </p>
            </div>
          )}

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma fatura definida ainda.</p>
          ) : (
            <div className="space-y-2">
              {items.map(i => {
                const card = cards.find(c => c.id === i.cardId);
                return (
                  <div key={i.id} className="rounded-2xl border border-border p-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-2.5 rounded-full shrink-0" style={{ background: card?.color ?? "var(--primary)" }} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{card?.name ?? "cartão removido"}</p>
                        <p className="text-[11px] font-mono text-muted-foreground capitalize">{monthLabel(i.month)}{i.month === curMonth ? " · mês atual" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatBRL(i.amount)}</span>
                      <button onClick={async () => { if (await appConfirm("Remover esta fatura?")) { persist(items.filter(x => x.id !== i.id)); notify("Fatura removida."); } }}
                        className="rounded-lg border border-border p-2 text-[#FF4D6D] hover:bg-[#FF4D6D]/15" aria-label="Remover fatura">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
