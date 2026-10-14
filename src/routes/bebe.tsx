import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, parseBRL, useStore } from "@/lib/store";
import { usePrefs } from "@/lib/prefs";
import { Baby, Heart, Star, Moon, Cloud, Trash2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BarChart } from "@/components/charts/BarChart";
import { PieChart } from "@/components/charts/PieChart";
import { useChartColors, MONTHS_SHORT } from "@/lib/theme-colors";

export const Route = createFileRoute("/bebe")({
  head: () => ({
    meta: [
      { title: "Bebê a caminho — CloseFinance" },
      { name: "description", content: "Registre com carinho os gastos com a chegada do bebê, separados do seu orçamento." },
      { property: "og:title", content: "Bebê a caminho — CloseFinance" },
      { property: "og:description", content: "Gastos do enxoval e preparativos para o bebê, organizados com carinho." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BebePage,
});

type BabyExpense = {
  id: string; name: string; amount: number; date: string;
  essential: string; category_id: string | null; payment_method: string;
};

const PAYMENTS = [
  { v: "pix", label: "Pix" }, { v: "debit", label: "Débito" },
  { v: "credit", label: "Crédito" }, { v: "cash", label: "Dinheiro" },
];
const PALETTE = ["var(--baby-mint)", "var(--baby-peach)", "var(--baby-sky)", "var(--baby-butter)"];
const soft = (c: string, p = 18) => `color-mix(in oklab, ${c} ${p}%, transparent)`;
const today = () => new Date().toISOString().slice(0, 10);

function BebePage() {
  const [state, , user] = useStore();
  const { babyMode } = usePrefs();
  const [items, setItems] = useState<BabyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", amount: "", date: today(), essential: "essential", category_id: "", payment_method: "pix" });
  const expenseCats = state.categories.filter(c => c.kind !== "income");

  useEffect(() => {
    if (!user) return;
    supabase.from("baby_expenses").select("*").eq("user_id", user.id).order("date", { ascending: false })
      .then(({ data }) => { setItems((data ?? []).map(d => ({ ...d, amount: Number(d.amount) }))); setLoading(false); });
  }, [user?.id]);

  const totals = useMemo(() => {
    const ess = items.filter(i => i.essential === "essential").reduce((s, i) => s + i.amount, 0);
    const non = items.filter(i => i.essential !== "essential").reduce((s, i) => s + i.amount, 0);
    return { ess, non, all: ess + non };
  }, [items]);

  const dash = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS_SHORT[d.getMonth()] });
    }
    const monthly = months.map(m => {
      const rows = items.filter(i => i.date.startsWith(m.key));
      return {
        name: m.label,
        Essenciais: rows.filter(i => i.essential === "essential").reduce((s, i) => s + i.amount, 0),
        "Não essenciais": rows.filter(i => i.essential !== "essential").reduce((s, i) => s + i.amount, 0),
      };
    });
    const thisKey = months[months.length - 1].key;
    const thisMonth = items.filter(i => i.date.startsWith(thisKey));
    const mEss = thisMonth.filter(i => i.essential === "essential").reduce((s, i) => s + i.amount, 0);
    const mNon = thisMonth.filter(i => i.essential !== "essential").reduce((s, i) => s + i.amount, 0);
    return { monthly, mEss, mNon, hasData: items.length > 0 };
  }, [items]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const amount = parseBRL(form.amount);
    if (!form.name.trim() || amount <= 0) { toast.error("Informe o item e um valor"); return; }
    const { data, error } = await supabase.from("baby_expenses").insert({
      user_id: user.id, name: form.name.trim(), amount, date: form.date, essential: form.essential,
      category_id: form.category_id || null, payment_method: form.payment_method,
    }).select().single();
    if (error || !data) { toast.error("Não foi possível salvar"); return; }
    setItems(prev => [{ ...data, amount: Number(data.amount) }, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setForm(f => ({ ...f, name: "", amount: "" }));
    toast.success("Registrado com carinho 💛");
  }

  async function remove(id: string) {
    if (!confirm("Apagar este registro?")) return;
    const { error } = await supabase.from("baby_expenses").delete().eq("id", id);
    if (!error) setItems(prev => prev.filter(i => i.id !== id));
  }

  const field = "w-full rounded-2xl border-2 bg-background/60 px-4 py-2.5 text-sm outline-none transition focus:border-[var(--baby-sky)]";
  const fieldStyle = { borderColor: soft("var(--baby-sky)", 40) };

  if (!babyMode) {
    return (
      <AppShell>
        <GlassCard className="text-center py-12">
          <Baby className="size-12 mx-auto mb-3" style={{ color: "var(--baby-sky)" }} />
          <p className="font-semibold">Esta aba está desligada</p>
          <p className="text-sm text-muted-foreground mt-1">Ative "Bebê a caminho?" em Dados pessoais.</p>
          <Link to="/perfil" className="inline-block mt-4 rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm">Ir para o perfil</Link>
        </GlassCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none" style={{
        backgroundImage: `radial-gradient(40% 35% at 10% 10%, ${soft("var(--baby-peach)", 22)}, transparent 70%), radial-gradient(40% 35% at 90% 20%, ${soft("var(--baby-sky)", 22)}, transparent 70%), radial-gradient(45% 40% at 50% 95%, ${soft("var(--baby-mint)", 20)}, transparent 70%)`,
      }} />

      <header className="mb-6 relative">
        <div className="flex items-center gap-3">
          <div className="size-14 rounded-full grid place-items-center" style={{ background: soft("var(--baby-butter)", 35) }}>
            <Baby className="size-8" style={{ color: "var(--baby-peach)" }} />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-2">Bebê a caminho <Heart className="size-6 fill-current" style={{ color: "var(--baby-peach)" }} /></h1>
            <p className="text-sm text-muted-foreground">Cada pecinha conta uma história. Esses gastos ficam só aqui, fora da aba de gastos. ✨</p>
          </div>
        </div>
        <div aria-hidden className="hidden md:flex absolute right-2 top-0 gap-3 opacity-70">
          <Star className="size-5" style={{ color: "var(--baby-butter)" }} />
          <Moon className="size-6" style={{ color: "var(--baby-sky)" }} />
          <Cloud className="size-7" style={{ color: "var(--baby-mint)" }} />
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total do enxoval", value: totals.all, c: "var(--baby-sky)", icon: Sparkles },
          { label: "Essenciais", value: totals.ess, c: "var(--baby-mint)", icon: Heart },
          { label: "Não essenciais", value: totals.non, c: "var(--baby-peach)", icon: Star },
        ].map(s => (
          <div key={s.label} className="rounded-3xl p-5 border-2" style={{ background: soft(s.c, 16), borderColor: soft(s.c, 45) }}>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><s.icon className="size-3.5" style={{ color: s.c }} />{s.label}</p>
            <p className="text-2xl font-bold mt-1 font-mono">{formatBRL(s.value)}</p>
          </div>
        ))}
      </section>

      <div className="rounded-3xl border-2 p-5 mb-6" style={{ borderColor: soft("var(--baby-sky)", 40), background: soft("var(--baby-sky)", 8) }}>
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus className="size-4" /> Novo item para o bebê</h2>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <input className={field} style={fieldStyle} placeholder="Ex.: Berço, fraldas, body…" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className={field} style={fieldStyle} placeholder="Valor (R$)" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <input type="date" className={field} style={fieldStyle} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <select className={field} style={fieldStyle} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
            <option value="">Sem categoria</option>
            {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            {[{ v: "essential", l: "Essencial", c: "var(--baby-mint)" }, { v: "non_essential", l: "Não essencial", c: "var(--baby-peach)" }].map(o => (
              <button key={o.v} type="button" onClick={() => setForm({ ...form, essential: o.v })}
                className="flex-1 rounded-full border-2 px-3 py-2 text-xs font-semibold transition"
                style={{ borderColor: o.c, background: form.essential === o.v ? soft(o.c, 40) : "transparent" }}>{o.l}</button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PAYMENTS.map(p => (
              <button key={p.v} type="button" onClick={() => setForm({ ...form, payment_method: p.v })}
                className="flex-1 rounded-full border-2 px-2 py-2 text-xs font-medium transition"
                style={{ borderColor: soft("var(--baby-butter)", 70), background: form.payment_method === p.v ? soft("var(--baby-butter)", 40) : "transparent" }}>{p.label}</button>
            ))}
          </div>
          <button type="submit" className="lg:col-span-3 md:col-span-2 rounded-full bg-primary text-primary-foreground font-semibold py-3 text-sm active:scale-[0.98] transition">
            Guardar com carinho 💛
          </button>
        </form>
      </div>

      <h2 className="font-semibold mb-3">Itens registrados</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed p-10 text-center" style={{ borderColor: soft("var(--baby-mint)", 50) }}>
          <Cloud className="size-10 mx-auto mb-2" style={{ color: "var(--baby-mint)" }} />
          <p className="text-sm text-muted-foreground">Nenhum item ainda. Que tal começar pelo primeiro?</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((i, idx) => {
            const c = PALETTE[idx % PALETTE.length];
            const cat = state.categories.find(x => x.id === i.category_id);
            return (
              <li key={i.id} className="rounded-3xl border-2 p-4 flex items-start gap-3" style={{ borderColor: soft(c, 50), background: soft(c, 12) }}>
                <div className="size-10 rounded-full grid place-items-center shrink-0" style={{ background: soft(c, 40) }}>
                  <Baby className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold truncate">{i.name}</p>
                    <p className="font-mono font-bold shrink-0">{formatBRL(i.amount)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 text-[10px] font-medium">
                    <span className="rounded-full px-2 py-0.5" style={{ background: soft(i.essential === "essential" ? "var(--baby-mint)" : "var(--baby-peach)", 40) }}>
                      {i.essential === "essential" ? "Essencial" : "Não essencial"}
                    </span>
                    <span className="rounded-full px-2 py-0.5 bg-muted">{PAYMENTS.find(p => p.v === i.payment_method)?.label ?? i.payment_method}</span>
                    {cat && <span className="rounded-full px-2 py-0.5 bg-muted">{cat.name}</span>}
                    <span className="rounded-full px-2 py-0.5 bg-muted font-mono">{new Date(i.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <button onClick={() => remove(i.id)} aria-label="Apagar" className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="size-4" /></button>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
