import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { formatBRL, parseBRL, useStore, type Subscription } from "@/lib/store";
import { Bot, Gamepad2, Heart, Music2, Pause, Pencil, Play, Plus, ShoppingBag, Sparkles, Trash2, Tv, Video } from "lucide-react";
import { CATEGORY_ICONS, CATEGORY_ICON_LIST } from "@/routes/categorias";

const USAGE_OPTIONS = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "rarely", label: "Quase não uso" },
] as const;

const IMPORTANCE_OPTIONS = [
  { value: "important", label: "Importante" },
  { value: "somewhat", label: "Pouco importante" },
  { value: "unnecessary", label: "Não necessário" },
] as const;

export const Route = createFileRoute("/assinaturas")({
  head: () => ({ meta: [
    { title: "Assinaturas (BETA) — CloseFinance" },
    { name: "description", content: "Organize assinaturas, cobranças recorrentes e gastos essenciais." },
    { property: "og:title", content: "Assinaturas (BETA) — CloseFinance" },
    { property: "og:description", content: "Organize assinaturas, cobranças recorrentes e gastos essenciais." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SubscriptionsPage,
});

const services = [
  { name: "Netflix", icon: "netflix", color: "#E50914" },
  { name: "YouTube", icon: "youtube", color: "#FF0033" },
  { name: "Spotify", icon: "spotify", color: "#1DB954" },
  { name: "Amazon", icon: "amazon", color: "#00A8E1" },
  { name: "Xbox", icon: "xbox", color: "#107C10" },
  { name: "Lovable", icon: "lovable", color: "#F43F5E" },
  { name: "Claude", icon: "claude", color: "#D97757" },
  { name: "ChatGPT", icon: "chatgpt", color: "#10A37F" },
] as const;

type SubscriptionForm = { name: string; amount: string; firstChargeDate: string; recurrenceMonths: string; color: string; icon: string; essential: "essential" | "non_essential" };
const emptyForm: SubscriptionForm = { name: "", amount: "", firstChargeDate: new Date().toISOString().slice(0, 10), recurrenceMonths: "1", color: "#E50914", icon: "sparkles", essential: "non_essential" };

function ServiceIcon({ icon, className = "size-5" }: { icon: string; className?: string }) {
  const props = { className };
  if (icon === "spotify") return <Music2 {...props} />;
  if (icon === "xbox") return <Gamepad2 {...props} />;
  if (icon === "amazon") return <ShoppingBag {...props} />;
  if (icon === "claude" || icon === "chatgpt") return <Bot {...props} />;
  if (icon === "lovable") return <Heart {...props} />;
  if (icon === "youtube") return <Video {...props} />;
  if (icon === "netflix") return <Tv {...props} />;
  const CategoryIcon = CATEGORY_ICONS[icon];
  if (CategoryIcon) return <CategoryIcon {...props} />;
  return <Sparkles {...props} />;
}

function SubscriptionsPage() {
  const [{ subscriptions }, api] = useStore();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function selectService(service: (typeof services)[number]) {
    setForm(f => ({ ...f, name: service.name, icon: service.icon, color: service.color }));
    setOpen(true);
  }

  function edit(subscription: Subscription) {
    setEditingId(subscription.id);
    setForm({ name: subscription.name, amount: subscription.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 }), firstChargeDate: subscription.firstChargeDate, recurrenceMonths: String(subscription.recurrenceMonths), color: subscription.color, icon: subscription.icon, essential: subscription.essential });
    setOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const amount = parseBRL(form.amount);
    if (!form.name.trim() || amount <= 0 || !form.firstChargeDate) return;
    const payload = { name: form.name.trim(), amount, firstChargeDate: form.firstChargeDate, recurrenceMonths: Math.max(1, Number(form.recurrenceMonths) || 1), color: form.color, icon: form.icon, essential: form.essential, active: true };
    if (editingId) await api.updateSubscription(editingId, payload);
    else await api.addSubscription(payload);
    setForm(emptyForm); setEditingId(null); setOpen(false);
  }

  return <AppShell>
    <header className="mb-6 flex items-end justify-between gap-4">
      <div><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Recorrências</p><h1 className="text-3xl font-bold">Assinaturas <span className="text-sm text-secondary">(BETA)</span></h1></div>
      <Button onClick={() => { setEditingId(null); setForm(emptyForm); setOpen(v => !v); }}><Plus /> Nova</Button>
    </header>

    {(() => {
      const active = subscriptions.filter(s => s.active);
      const monthlyTotal = active.reduce((sum, s) => sum + s.amount / s.recurrenceMonths, 0);
      const yearlyTotal = monthlyTotal * 12;
      const essentialTotal = active.filter(s => s.essential === "essential").reduce((sum, s) => sum + s.amount / s.recurrenceMonths, 0);
      const unusedTotal = active.filter(s => s.usageFrequency === "rarely" || s.importance === "unnecessary").reduce((sum, s) => sum + s.amount / s.recurrenceMonths, 0);
      return (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Stat label="Total mensal" value={formatBRL(monthlyTotal)} sub={`${active.length} assinatura${active.length === 1 ? "" : "s"} ativa${active.length === 1 ? "" : "s"}`} accent="violet" />
          <Stat label="Projeção anual" value={formatBRL(yearlyTotal)} sub="se mantiver o ritmo" accent="teal" />
          <Stat label="Essenciais" value={formatBRL(essentialTotal)} sub="por mês" accent="success" />
          <Stat label="Pouco usadas" value={formatBRL(unusedTotal)} sub="potencial de corte/mês" accent="crimson" />
        </section>
      );
    })()}

    <GlassCard className="mb-6">
      <SectionTitle title="Serviços populares" subtitle="toque para preencher rapidamente" />
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {services.map(service => <button key={service.name} onClick={() => selectService(service)} className="min-h-20 border border-border bg-background/40 p-2 flex flex-col items-center justify-center gap-2 transition hover:border-primary" aria-label={`Adicionar ${service.name}`}>
          <span style={{ color: service.color }}><ServiceIcon icon={service.icon} /></span><span className="text-[10px] font-mono truncate w-full">{service.name}</span>
        </button>)}
      </div>
    </GlassCard>

    {open && <GlassCard className="mb-6">
      <SectionTitle title={editingId ? "Editar assinatura" : "Nova assinatura"} subtitle="as cobranças futuras entram automaticamente em gastos" />
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Serviço"><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
        <Field label="Valor"><input required inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="R$ 0,00" className={inputCls} /></Field>
        <Field label="Primeira cobrança"><input required type="date" value={form.firstChargeDate} onChange={e => setForm({ ...form, firstChargeDate: e.target.value })} className={inputCls} /></Field>
        <Field label="Recorrência"><select value={form.recurrenceMonths} onChange={e => setForm({ ...form, recurrenceMonths: e.target.value })} className={inputCls}><option value="1">Mensal</option><option value="2">A cada 2 meses</option><option value="3">Trimestral</option><option value="6">Semestral</option><option value="12">Anual</option></select></Field>
        <Field label="Cor"><input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className={`${inputCls} h-11 p-1`} /></Field>
        <Field label="Tipo"><select value={form.essential} onChange={e => setForm({ ...form, essential: e.target.value as "essential" | "non_essential" })} className={inputCls}><option value="essential">Essencial</option><option value="non_essential">Não essencial</option></select></Field>
        <div className="md:col-span-2">
          <span className="text-xs font-mono uppercase text-muted-foreground">Ícone</span>
          <div className="mt-1.5 grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {CATEGORY_ICON_LIST.map(({ id, label }) => {
              const Icon = CATEGORY_ICONS[id] ?? Sparkles;
              const active = form.icon === id;
              return (
                <Button
                  key={id}
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setForm({ ...form, icon: id })}
                  title={label}
                  aria-label={`Usar ícone ${label}`}
                  aria-pressed={active}
                  className={`aspect-square size-full min-h-10 ${active ? "border-primary bg-primary/10" : ""}`}
                  style={active ? { color: form.color, borderColor: form.color } : undefined}
                >
                  <Icon className="size-4" />
                </Button>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Salvar assinatura</Button></div>
      </form>
    </GlassCard>}

    {subscriptions.length === 0 ? <GlassCard><p className="text-sm text-muted-foreground text-center py-8">Nenhuma assinatura cadastrada.</p></GlassCard> : <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {subscriptions.map(sub => <GlassCard key={sub.id} className={!sub.active ? "opacity-60" : ""}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0"><span className="size-10 shrink-0 grid place-items-center border border-border" style={{ color: sub.color }}><ServiceIcon icon={sub.icon} /></span><div className="min-w-0"><h2 className="font-semibold truncate">{sub.name}</h2><p className="font-mono text-lg">{formatBRL(sub.amount)}</p></div></div>
          <span className={`text-[10px] font-mono px-2 py-1 border ${sub.essential === "essential" ? "border-secondary text-secondary" : "border-border text-muted-foreground"}`}>{sub.essential === "essential" ? "Essencial" : "Não essencial"}</span>
        </div>
        <div className="mt-4 text-xs font-mono text-muted-foreground">A cada {sub.recurrenceMonths === 1 ? "mês" : `${sub.recurrenceMonths} meses`} · próxima base {new Date(`${sub.firstChargeDate}T00:00:00`).toLocaleDateString("pt-BR")}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label>
            <span className="text-[10px] font-mono uppercase text-muted-foreground">Frequência de uso</span>
            <select
              value={sub.usageFrequency}
              onChange={e => api.updateSubscription(sub.id, { usageFrequency: e.target.value as Subscription["usageFrequency"] })}
              className="mt-1 w-full border border-border bg-background px-2 py-1.5 text-xs font-mono outline-none focus:border-primary"
            >
              {USAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>
            <span className="text-[10px] font-mono uppercase text-muted-foreground">Importância</span>
            <select
              value={sub.importance}
              onChange={e => api.updateSubscription(sub.id, { importance: e.target.value as Subscription["importance"] })}
              className="mt-1 w-full border border-border bg-background px-2 py-1.5 text-xs font-mono outline-none focus:border-primary"
            >
              {IMPORTANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="Editar" onClick={() => edit(sub)}><Pencil /></Button>
          <Button size="icon" variant="ghost" title={sub.active ? "Pausar" : "Ativar"} onClick={() => api.updateSubscription(sub.id, { active: !sub.active })}>{sub.active ? <Pause /> : <Play />}</Button>
          <Button size="icon" variant="ghost" title="Excluir" onClick={() => { if (confirm("Excluir esta assinatura? O histórico de gastos será mantido.")) api.removeSubscription(sub.id); }}><Trash2 /></Button>
        </div>
      </GlassCard>)}
    </section>}
  </AppShell>;
}

const inputCls = "w-full border border-border bg-background px-3 py-2.5 text-sm font-mono outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="text-xs font-mono uppercase text-muted-foreground">{label}</span><div className="mt-1.5">{children}</div></label>; }