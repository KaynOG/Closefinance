import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";

export const Route = createFileRoute("/categorias")({
  head: () => ({ meta: [{ title: "Categorias — CloseFinance" }, { name: "description", content: "Crie e personalize categorias de gastos." }] }),
  component: CategoriesPage,
});

const PALETTE = ["#540BD3", "#FFCC00", "#006F77", "#820432", "#2BD9A1", "#FF4D6D", "#B388FF", "#22C3CC"];

function CategoriesPage() {
  const [{ categories, transactions }, api] = useStore();
  const [form, setForm] = useState({ name: "", color: PALETTE[0] });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    api.addCategory({ name: form.name.trim(), color: form.color });
    setForm({ name: "", color: PALETTE[0] });
  }

  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Personalização</p>
        <h1 className="text-3xl font-bold">Categorias</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Defina seus próprios rótulos para classificar gastos. Cada gasto também tem um segundo parâmetro: <span className="text-secondary">essencial</span> ou <span className="text-secondary">não essencial</span>, definido no momento do lançamento.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        <GlassCard>
          <SectionTitle title="Nova categoria" />
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Nome</span>
              <input className="mt-1.5 w-full rounded-xl bg-white/5 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white/10 transition font-mono"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Investimentos" />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Cor</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {PALETTE.map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`size-8 rounded-full border-2 transition ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ background: c }} />
                ))}
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="size-8 rounded-full bg-transparent cursor-pointer" />
              </div>
            </label>
            <button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 glow-violet">
              <Plus className="size-4 inline mr-1.5" /> Adicionar
            </button>
          </form>
        </GlassCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          {categories.map((c) => {
            const count = transactions.filter(t => t.categoryId === c.id).length;
            return (
              <div key={c.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className="size-10 rounded-xl grid place-items-center" style={{ background: c.color + "33", color: c.color }}>
                  <Tag className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    value={c.name}
                    onChange={(e) => api.updateCategory(c.id, { name: e.target.value })}
                    className="w-full bg-transparent text-sm font-semibold outline-none border-b border-transparent focus:border-white/20"
                  />
                  <p className="text-[11px] font-mono text-muted-foreground">{count} transações</p>
                </div>
                <input type="color" value={c.color} onChange={(e) => api.updateCategory(c.id, { color: e.target.value })} className="size-7 rounded-full bg-transparent cursor-pointer" />
                <button onClick={() => api.removeCategory(c.id)} className="rounded-lg p-1.5 text-muted-foreground hover:text-[#FF4D6D] hover:bg-white/5">
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
