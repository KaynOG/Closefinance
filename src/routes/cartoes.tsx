import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { useStore, formatBRL, isSameMonth } from "@/lib/store";
import { useState } from "react";
import { Plus, Trash2, CreditCard as CC } from "lucide-react";

export const Route = createFileRoute("/cartoes")({
  head: () => ({ meta: [{ title: "Cartões — Finlux" }, { name: "description", content: "Gerencie seus cartões, limites e datas." }] }),
  component: CardsPage,
});

const PALETTE = ["#540BD3", "#FFCC00", "#006F77", "#820432", "#2BD9A1", "#FF4D6D", "#B388FF"];

function CardsPage() {
  const [{ cards, transactions }, api] = useStore();
  const today = new Date();

  const [form, setForm] = useState({
    name: "", limit: "", closingDay: "1", dueDay: "10", color: PALETTE[0],
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const lim = parseFloat(form.limit.replace(",", "."));
    if (!form.name.trim() || !lim) return;
    api.addCard({
      name: form.name.trim(), limit: lim,
      closingDay: Math.max(1, Math.min(28, parseInt(form.closingDay) || 1)),
      dueDay: Math.max(1, Math.min(28, parseInt(form.dueDay) || 10)),
      color: form.color,
    });
    setForm({ name: "", limit: "", closingDay: "1", dueDay: "10", color: PALETTE[0] });
  }

  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Crédito</p>
        <h1 className="text-3xl font-bold">Cartões e limites</h1>
      </header>

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
          {cards.map((c) => {
            const used = transactions.filter(t => t.cardId === c.id && t.type === "expense" && isSameMonth(t.date, today)).reduce((s, t) => s + t.amount, 0);
            const available = Math.max(0, c.limit - used);
            const pct = c.limit ? Math.min(100, (used / c.limit) * 100) : 0;
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
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c.color}, #FFCC00)` }} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div><p className="text-muted-foreground">Usado</p><p className="text-foreground text-sm">{formatBRL(used)}</p></div>
                    <div><p className="text-muted-foreground">Disponível</p><p className="text-foreground text-sm">{formatBRL(available)}</p></div>
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
