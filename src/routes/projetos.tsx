import { appConfirm } from "@/lib/app-dialog";
import { createFileRoute } from "@tanstack/react-router";
import { TutorialBox } from "@/components/TutorialBox";
import { TUTORIALS } from "@/lib/tutorial-content";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, parseBRL, useStore } from "@/lib/store";
import {
  Plus, Trash2, ImagePlus, Check, ChevronDown, FolderKanban, X, Pencil, ExternalLink,
  Target, Flag, Trophy, Star, Rocket, Home, Car, Plane, Map, Umbrella, Bike, Laptop,
  Smartphone, Camera, Music, Gamepad2, Book, GraduationCap, Briefcase, Building2, Hammer,
  Wrench, Paintbrush, Palette, Heart, Gift, Baby, Dog, Cat, Dumbbell, Coffee, UtensilsCrossed,
  ShoppingCart, ShoppingBag, Shirt, Gem, Crown, Coins, PiggyBank, Wallet, Banknote, Sun,
  Moon, Mountain, TreePine, Tent, Ship, Train, Bus, Sofa, Bed, Key, Lightbulb, Zap, Leaf,
  Medal, Calendar, Clock, Sparkles, PartyPopper, Stethoscope, Tv,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { ProjectsReport } from "@/components/ProjectsReport";
import { ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/projetos")({
  head: () => ({ meta: [
    { title: "Projetos — CloseFinance" },
    { name: "description", content: "Planeje projetos com gastos, capa e roadmap de objetivos." },
    { property: "og:title", content: "Projetos — CloseFinance" },
    { property: "og:description", content: "Planeje projetos com gastos, capa e roadmap de objetivos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProjectsPage,
});

export const GOAL_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  target: { icon: Target, label: "Alvo" }, flag: { icon: Flag, label: "Bandeira" },
  trophy: { icon: Trophy, label: "Troféu" }, star: { icon: Star, label: "Estrela" },
  rocket: { icon: Rocket, label: "Foguete" }, home: { icon: Home, label: "Casa" },
  car: { icon: Car, label: "Carro" }, plane: { icon: Plane, label: "Avião" },
  map: { icon: Map, label: "Mapa" }, beach: { icon: Umbrella, label: "Praia" },
  bike: { icon: Bike, label: "Bicicleta" }, laptop: { icon: Laptop, label: "Notebook" },
  phone: { icon: Smartphone, label: "Celular" }, camera: { icon: Camera, label: "Câmera" },
  music: { icon: Music, label: "Música" }, game: { icon: Gamepad2, label: "Games" },
  book: { icon: Book, label: "Livro" }, study: { icon: GraduationCap, label: "Estudo" },
  work: { icon: Briefcase, label: "Trabalho" }, building: { icon: Building2, label: "Prédio" },
  hammer: { icon: Hammer, label: "Obra" }, tools: { icon: Wrench, label: "Ferramentas" },
  paint: { icon: Paintbrush, label: "Pintura" }, palette: { icon: Palette, label: "Arte" },
  heart: { icon: Heart, label: "Coração" }, gift: { icon: Gift, label: "Presente" },
  baby: { icon: Baby, label: "Bebê" }, dog: { icon: Dog, label: "Cachorro" },
  cat: { icon: Cat, label: "Gato" }, gym: { icon: Dumbbell, label: "Academia" },
  coffee: { icon: Coffee, label: "Café" }, food: { icon: UtensilsCrossed, label: "Comida" },
  market: { icon: ShoppingCart, label: "Mercado" }, shopping: { icon: ShoppingBag, label: "Compras" },
  clothes: { icon: Shirt, label: "Roupas" }, gem: { icon: Gem, label: "Joia" },
  crown: { icon: Crown, label: "Coroa" }, coins: { icon: Coins, label: "Moedas" },
  piggy: { icon: PiggyBank, label: "Cofrinho" }, wallet: { icon: Wallet, label: "Carteira" },
  cash: { icon: Banknote, label: "Dinheiro" }, sun: { icon: Sun, label: "Sol" },
  moon: { icon: Moon, label: "Lua" }, mountain: { icon: Mountain, label: "Montanha" },
  tree: { icon: TreePine, label: "Natureza" }, tent: { icon: Tent, label: "Camping" },
  ship: { icon: Ship, label: "Navio" }, train: { icon: Train, label: "Trem" },
  bus: { icon: Bus, label: "Ônibus" }, sofa: { icon: Sofa, label: "Sofá" },
  bed: { icon: Bed, label: "Quarto" }, key: { icon: Key, label: "Chave" },
  idea: { icon: Lightbulb, label: "Ideia" }, energy: { icon: Zap, label: "Energia" },
  leaf: { icon: Leaf, label: "Folha" }, medal: { icon: Medal, label: "Medalha" },
  calendar: { icon: Calendar, label: "Calendário" }, clock: { icon: Clock, label: "Relógio" },
  sparkles: { icon: Sparkles, label: "Brilho" }, party: { icon: PartyPopper, label: "Festa" },
  health: { icon: Stethoscope, label: "Saúde" }, tv: { icon: Tv, label: "TV" },
};

const PROJECT_TAG = "__pj__:";
const today = () => new Date().toISOString().slice(0, 10);
const inputCls = "w-full rounded-xl bg-white/5 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white/10 transition font-mono";

interface Project { id: string; name: string; description: string; cover: string | null; created_at: string; target_date: string | null; sort_order: number }
interface PExpense { id: string; project_id: string; name: string; amount: number; date: string; include_in_expenses: boolean }
interface PGoal { id: string; project_id: string; title: string; description: string; date: string | null; done: boolean; icon: string; link: string | null }

async function fileToCover(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
  });
  const scale = Math.min(1, 1280 / img.width);
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.8);
}

function ProjectsPage() {
  const [, , user] = useStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<PExpense[]>([]);
  const [goals, setGoals] = useState<PGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", cover: null as string | null, target_date: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, e, g] = await Promise.all([
        supabase.from("projects").select("*").order("sort_order").order("created_at", { ascending: false }),
        supabase.from("project_expenses").select("*").order("date"),
        supabase.from("project_goals").select("*").order("date", { nullsFirst: false }),
      ]);
      setProjects((p.data ?? []) as Project[]);
      setExpenses(((e.data ?? []) as PExpense[]).map(x => ({ ...x, amount: Number(x.amount) })));
      setGoals((g.data ?? []) as PGoal[]);
      setLoading(false);
    })();
  }, [user?.id]);

  async function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= projects.length) return;
    const next = [...projects];
    [next[idx], next[j]] = [next[j], next[idx]];
    const ordered = next.map((p, i) => ({ ...p, sort_order: i }));
    setProjects(ordered);
    await Promise.all(ordered.map(p => supabase.from("projects").update({ sort_order: p.sort_order }).eq("id", p.id)));
  }

  async function createProject(ev: React.FormEvent) {
    ev.preventDefault();
    if (!user || !form.name.trim()) return;
    const { data, error } = await supabase.from("projects")
      .insert({ user_id: user.id, name: form.name.trim(), description: form.description.trim(), cover: form.cover, target_date: form.target_date || null, sort_order: projects.length ? Math.min(...projects.map(x => x.sort_order ?? 0)) - 1 : 0 })
      .select().single();
    if (error) return toast.error("Não foi possível criar o projeto");
    setProjects(ps => [data as Project, ...ps]);
    setForm({ name: "", description: "", cover: null, target_date: "" });
    toast.success("Projeto criado!");
  }

  return (
    <AppShell>
      <TutorialBox {...TUTORIALS.projetos} />
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Projetos</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Planeje seus projetos: registre gastos, adicione uma capa e acompanhe os objetivos no roadmap.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4 items-start">
        <GlassCard>
          <SectionTitle title="Novo projeto" />
          <form onSubmit={createProject} className="space-y-3">
            <CoverPicker value={form.cover} onChange={(cover) => setForm({ ...form, cover })} />
            <label className="block">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Nome do projeto</span>
              <input className={`mt-1.5 ${inputCls}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Reforma da cozinha" />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Descrição geral</span>
              <textarea rows={3} className={`mt-1.5 ${inputCls} resize-none`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="O que você quer realizar?" />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Data final para concluir</span>
              <input type="date" className={`mt-1.5 ${inputCls}`} value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} />
            </label>
            <button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 glow-violet">
              <Plus className="size-4 inline mr-1.5" /> Criar projeto
            </button>
          </form>
        </GlassCard>

        <div className="space-y-4 min-w-0">
          {loading ? (
            <GlassCard><p className="text-sm text-muted-foreground font-mono">Carregando…</p></GlassCard>
          ) : projects.length === 0 ? (
            <GlassCard className="text-center py-10">
              <FolderKanban className="size-10 mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhum projeto ainda. Crie o primeiro ao lado.</p>
            </GlassCard>
          ) : projects.map((p, idx) => (
            <div key={p.id} className="relative">
            <div className="flex justify-end gap-1 mb-1">
              <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Mover para cima" className="rounded-lg border border-border p-1 disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
              <button type="button" onClick={() => move(idx, 1)} disabled={idx === projects.length - 1} aria-label="Mover para baixo" className="rounded-lg border border-border p-1 disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
            </div>
            <ProjectBlock project={p}
              expenses={expenses.filter(e => e.project_id === p.id)}
              goals={goals.filter(g => g.project_id === p.id)}
              setProjects={setProjects} setExpenses={setExpenses} setGoals={setGoals} />
            </div>
          ))}
        </div>
      </div>
      {!loading && <ProjectsReport projects={projects} expenses={expenses} />}
    </AppShell>
  );
}

function CoverPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <label className="block relative size-28 sm:size-32 rounded-xl border border-dashed border-border overflow-hidden cursor-pointer hover:bg-accent transition">
      {value ? (
        <>
          <img src={value} alt="Capa do projeto" className="size-full object-cover" />
          <Button type="button" variant="secondary" size="icon" aria-label="Remover capa" onClick={(e) => { e.preventDefault(); onChange(null); }}
            className="absolute top-1 right-1 size-7"><X /></Button>
        </>
      ) : (
        <div className="size-full grid place-items-center text-muted-foreground text-xs font-mono">
          <div className="text-center px-2"><ImagePlus className="size-6 mx-auto mb-1" />Anexar capa</div>
        </div>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        try { onChange(await fileToCover(f)); } catch { toast.error("Imagem inválida"); }
        e.target.value = "";
      }} />
    </label>
  );
}

type Setter<T> = React.Dispatch<React.SetStateAction<T[]>>;

function ProjectBlock({ project, expenses, goals, setProjects, setExpenses, setGoals }: {
  project: Project; expenses: PExpense[]; goals: PGoal[];
  setProjects: Setter<Project>; setExpenses: Setter<PExpense>; setGoals: Setter<PGoal>;
}) {
  const [state, api, user] = useStore();
  const [open, setOpen] = useState(true);
  const [exp, setExp] = useState({ name: "", amount: "", date: today(), include: false });
  const [goal, setGoal] = useState({ title: "", description: "", date: "", icon: "target", link: "" });
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [goalDraft, setGoalDraft] = useState({ title: "", description: "", date: "", icon: "target", link: "" });
  const [showEditIcons, setShowEditIcons] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const doneCount = goals.filter(g => g.done).length;

  const expenseCategoryId = () => state.categories.find(c => c.name.toLowerCase() === "projetos")?.id;

  async function linkTx(e: PExpense) {
    await api.addTransaction({
      type: "expense", amount: e.amount, description: `${project.name}: ${e.name}`, date: e.date,
      essential: "non_essential", paymentMethod: "cash", tag: PROJECT_TAG + e.id, categoryId: expenseCategoryId(),
    });
  }
  async function unlinkTx(expId: string) {
    const txs = state.transactions.filter(t => t.tag === PROJECT_TAG + expId);
    for (const t of txs) await api.removeTransaction(t.id);
  }

  async function addExpense(ev: React.FormEvent) {
    ev.preventDefault();
    const amount = parseBRL(exp.amount);
    if (!user || !exp.name.trim() || !amount) return;
    const { data, error } = await supabase.from("project_expenses").insert({
      user_id: user.id, project_id: project.id, name: exp.name.trim(), amount, date: exp.date, include_in_expenses: exp.include,
    }).select().single();
    if (error || !data) return toast.error("Não foi possível adicionar o gasto");
    const row = { ...(data as PExpense), amount: Number(data.amount) };
    setExpenses(xs => [...xs, row]);
    if (row.include_in_expenses) await linkTx(row);
    setExp({ name: "", amount: "", date: today(), include: false });
  }

  async function toggleInclude(e: PExpense) {
    const include = !e.include_in_expenses;
    await supabase.from("project_expenses").update({ include_in_expenses: include }).eq("id", e.id);
    setExpenses(xs => xs.map(x => x.id === e.id ? { ...x, include_in_expenses: include } : x));
    if (include) { await linkTx(e); toast.success("Incluído na aba de gastos"); }
    else { await unlinkTx(e.id); toast("Removido da aba de gastos"); }
  }

  async function removeExpense(e: PExpense) {
    if (e.include_in_expenses) await unlinkTx(e.id);
    await supabase.from("project_expenses").delete().eq("id", e.id);
    setExpenses(xs => xs.filter(x => x.id !== e.id));
  }

  async function addGoal(ev: React.FormEvent) {
    ev.preventDefault();
    if (!user || !goal.title.trim()) return;
    const { data, error } = await supabase.from("project_goals").insert({
      user_id: user.id, project_id: project.id, title: goal.title.trim(), description: goal.description.trim(),
      date: goal.date || null, icon: goal.icon, link: goal.link.trim() || null,
    }).select().single();
    if (error || !data) return toast.error("Não foi possível adicionar o objetivo");
    setGoals(gs => [...gs, data as PGoal]);
    setGoal({ title: "", description: "", date: "", icon: "target", link: "" });
    setShowIcons(false);
  }

  async function toggleGoal(g: PGoal) {
    await supabase.from("project_goals").update({ done: !g.done }).eq("id", g.id);
    setGoals(gs => gs.map(x => x.id === g.id ? { ...x, done: !g.done } : x));
    if (!g.done) toast.success("Objetivo alcançado! 🎉");
  }

  async function removeGoal(g: PGoal) {
    await supabase.from("project_goals").delete().eq("id", g.id);
    setGoals(gs => gs.filter(x => x.id !== g.id));
  }

  function startEditGoal(g: PGoal) {
    setEditingGoal(g.id);
    setShowEditIcons(false);
    setGoalDraft({ title: g.title, description: g.description, date: g.date ?? "", icon: g.icon, link: g.link ?? "" });
  }

  async function saveGoal(g: PGoal) {
    if (!goalDraft.title.trim()) return toast.error("Dê um nome ao objetivo");
    const patch = {
      title: goalDraft.title.trim(), description: goalDraft.description.trim(),
      date: goalDraft.date || null, icon: goalDraft.icon, link: goalDraft.link.trim() || null,
    };
    const { error } = await supabase.from("project_goals").update(patch).eq("id", g.id);
    if (error) return toast.error("Não foi possível salvar o objetivo");
    setGoals(gs => gs.map(x => x.id === g.id ? { ...x, ...patch } : x));
    setEditingGoal(null);
    toast.success("Objetivo atualizado");
  }

  async function removeProject() {
    if (!await appConfirm(`Apagar o projeto "${project.name}"? Os gastos incluídos na aba de gastos também serão removidos.`)) return;
    for (const e of expenses) if (e.include_in_expenses) await unlinkTx(e.id);
    await supabase.from("projects").delete().eq("id", project.id);
    setProjects(ps => ps.filter(p => p.id !== project.id));
    setExpenses(xs => xs.filter(x => x.project_id !== project.id));
    setGoals(gs => gs.filter(x => x.project_id !== project.id));
  }

  async function changeCover(cover: string | null) {
    const { error } = await supabase.from("projects").update({ cover }).eq("id", project.id);
    if (error) return toast.error("Não foi possível atualizar a capa");
    setProjects(ps => ps.map(p => p.id === project.id ? { ...p, cover } : p));
  }

  async function changeTargetDate(target_date: string | null) {
    const { error } = await supabase.from("projects").update({ target_date }).eq("id", project.id);
    if (error) return toast.error("Não foi possível atualizar a data final");
    setProjects(ps => ps.map(p => p.id === project.id ? { ...p, target_date } : p));
  }

  const sortedGoals = [...goals].sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  const GoalIcon = GOAL_ICONS[goal.icon]?.icon ?? Target;

  return (
    <GlassCard className="p-0 sm:p-0 overflow-hidden">
      <div className="p-3.5 sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {project.cover ? <img src={project.cover} alt={`Capa de ${project.name}`} className="size-20 sm:size-24 shrink-0 rounded-xl object-cover" /> :
            <div className="size-20 sm:size-24 shrink-0 rounded-xl bg-muted grid place-items-center text-muted-foreground"><FolderKanban className="size-7" /></div>}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold break-words">{project.name}</h2>
            {open && <>
              {project.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{project.description}</p>}
              {project.target_date && <p className="text-xs font-mono text-muted-foreground mt-2">Conclusão: {new Date(project.target_date + "T00:00:00").toLocaleDateString("pt-BR")}</p>}
            </>}
          </div>
          {open && <>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-[10px] font-mono uppercase text-muted-foreground">Total gasto</p>
              <p className="font-mono font-bold text-lg">{formatBRL(total)}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={removeProject} aria-label="Apagar projeto" title="Apagar projeto" className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 /></Button>
          </>}
          <Button variant="ghost" size="icon" onClick={() => setOpen(o => !o)} aria-label={open ? "Ocultar projeto" : "Mostrar projeto"} title={open ? "Ocultar projeto" : "Mostrar projeto"} aria-expanded={open} className="shrink-0">
            <ChevronDown className={`transition-transform ${open ? "" : "-rotate-90"}`} />
          </Button>
        </div>

        {open && (
          <div className="mt-5 space-y-6">
            <label className="block max-w-xs">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Data final para concluir</span>
              <input type="date" className={`mt-1.5 ${inputCls}`} value={project.target_date ?? ""} onChange={e => changeTargetDate(e.target.value || null)} />
            </label>
            {/* Gastos */}
            <section>
              <h3 className="font-semibold mb-2">Gastos do projeto</h3>
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-[11px] font-mono uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Gasto</th>
                      <th className="text-left px-3 py-2">Data</th>
                      <th className="text-right px-3 py-2">Valor</th>
                      <th className="text-center px-3 py-2">Incluir nos gastos</th>
                      <th className="px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-4 text-center text-xs text-muted-foreground font-mono">Nenhum gasto ainda</td></tr>
                    )}
                    {expenses.map(e => (
                      <tr key={e.id} className="border-t border-border">
                        <td className="px-3 py-2">{e.name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{new Date(e.date + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatBRL(e.amount)}</td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={e.include_in_expenses} onChange={() => toggleInclude(e)} className="size-4 accent-[var(--primary)] cursor-pointer" />
                        </td>
                        <td className="px-2 text-right">
                          <button onClick={() => removeExpense(e)} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form onSubmit={addExpense} className="mt-3 grid grid-cols-2 md:grid-cols-[1fr_130px_150px_auto_auto] gap-2 items-center">
                <input className={`${inputCls} col-span-2 md:col-span-1`} placeholder="Nome do gasto" value={exp.name} onChange={e => setExp({ ...exp, name: e.target.value })} />
                <input className={inputCls} placeholder="Valor" inputMode="decimal" value={exp.amount} onChange={e => setExp({ ...exp, amount: e.target.value })} />
                <input type="date" className={inputCls} value={exp.date} onChange={e => setExp({ ...exp, date: e.target.value })} />
                <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={exp.include} onChange={e => setExp({ ...exp, include: e.target.checked })} className="size-4 accent-[var(--primary)]" />
                  Incluir nos gastos
                </label>
                <button type="submit" className="rounded-xl bg-primary text-primary-foreground font-semibold px-4 py-2.5 hover:opacity-90"><Plus className="size-4 inline" /> Gasto</button>
              </form>
            </section>

            {/* Objetivos */}
            <section>
              <h3 className="font-semibold mb-2">Novo objetivo</h3>
              <form onSubmit={addGoal} className="grid grid-cols-1 md:grid-cols-[auto_1fr_150px_auto] gap-2 items-start">
                <button type="button" onClick={() => setShowIcons(s => !s)} title="Escolher ícone"
                  className="size-[42px] rounded-xl border border-primary bg-primary/15 text-primary grid place-items-center">
                  <GoalIcon className="size-5" />
                </button>
                <div className="space-y-2">
                  <input className={inputCls} placeholder="Objetivo" value={goal.title} onChange={e => setGoal({ ...goal, title: e.target.value })} />
                  <input className={inputCls} placeholder="Descrição" value={goal.description} onChange={e => setGoal({ ...goal, description: e.target.value })} />
                  <input className={inputCls} placeholder="Link (opcional)" value={goal.link} onChange={e => setGoal({ ...goal, link: e.target.value })} />
                </div>
                <input type="date" className={inputCls} value={goal.date} onChange={e => setGoal({ ...goal, date: e.target.value })} />
                <button type="submit" className="rounded-xl bg-primary text-primary-foreground font-semibold px-4 py-2.5 hover:opacity-90"><Plus className="size-4 inline" /> Objetivo</button>
              </form>
              {showIcons && (
                <div className="mt-2 grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-16 gap-1.5 max-h-48 overflow-y-auto p-2 rounded-2xl border border-border">
                  {Object.entries(GOAL_ICONS).map(([id, { icon: Icon, label }]) => (
                    <button key={id} type="button" title={label} onClick={() => { setGoal({ ...goal, icon: id }); setShowIcons(false); }}
                      className={`aspect-square rounded-xl grid place-items-center border transition ${goal.icon === id ? "border-primary bg-primary/15 text-primary" : "border-border hover:bg-white/5"}`}>
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Roadmap */}
            <section>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h3 className="font-semibold">Roadmap <span className="font-mono text-xs text-muted-foreground">· {doneCount}/{goals.length} objetivos</span></h3>
                <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-success" />Alcançado</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" />Pendente</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-secondary" />Gasto</span>
                </div>
              </div>

              {goals.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
                  {sortedGoals.map(g => {
                    const Icon = GOAL_ICONS[g.icon]?.icon ?? Target;
                    return (
                      <button key={g.id} onClick={() => toggleGoal(g)} title={`${g.title}${g.date ? " · " + new Date(g.date + "T00:00:00").toLocaleDateString("pt-BR") : ""}`}
                        className={`aspect-square rounded-xl border grid place-items-center transition hover:scale-105 ${g.done ? "border-success bg-success/15 text-success" : "border-primary/60 bg-primary/10 text-primary"}`}>
                        {g.done ? <Check className="size-5" /> : <Icon className="size-5" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {expenses.length > 0 && (
                <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
                  {expenses.map(e => (
                    <div key={e.id} title={`${e.name} · ${formatBRL(e.amount)}`}
                      className="aspect-square rounded-xl border border-secondary/60 bg-secondary/10 text-secondary grid place-items-center p-1 text-center">
                      <span className="font-mono text-[10px] leading-tight break-all">{formatBRL(e.amount).replace("R$", "").trim()}</span>
                    </div>
                  ))}
                </div>
              )}

              {sortedGoals.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {sortedGoals.map(g => {
                    const Icon = GOAL_ICONS[g.icon]?.icon ?? Target;
                    if (editingGoal === g.id) {
                      const DraftIcon = GOAL_ICONS[goalDraft.icon]?.icon ?? Target;
                      return (
                        <li key={g.id} className="glass rounded-2xl p-3 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_150px] gap-2 items-start">
                            <button type="button" onClick={() => setShowEditIcons(s => !s)} title="Trocar ícone"
                              className="size-[42px] rounded-xl border border-primary bg-primary/15 text-primary grid place-items-center">
                              <DraftIcon className="size-5" />
                            </button>
                            <div className="space-y-2">
                              <input className={inputCls} placeholder="Objetivo" value={goalDraft.title} onChange={e => setGoalDraft({ ...goalDraft, title: e.target.value })} />
                              <input className={inputCls} placeholder="Descrição" value={goalDraft.description} onChange={e => setGoalDraft({ ...goalDraft, description: e.target.value })} />
                              <input className={inputCls} placeholder="Link (opcional)" value={goalDraft.link} onChange={e => setGoalDraft({ ...goalDraft, link: e.target.value })} />
                            </div>
                            <input type="date" className={inputCls} value={goalDraft.date} onChange={e => setGoalDraft({ ...goalDraft, date: e.target.value })} />
                          </div>
                          {showEditIcons && (
                            <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-16 gap-1.5 max-h-48 overflow-y-auto p-2 rounded-2xl border border-border">
                              {Object.entries(GOAL_ICONS).map(([id, { icon: Ic, label }]) => (
                                <button key={id} type="button" title={label} onClick={() => { setGoalDraft({ ...goalDraft, icon: id }); setShowEditIcons(false); }}
                                  className={`aspect-square rounded-xl grid place-items-center border transition ${goalDraft.icon === id ? "border-primary bg-primary/15 text-primary" : "border-border hover:bg-white/5"}`}>
                                  <Ic className="size-4" />
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingGoal(null)} className="rounded-xl border border-border px-3 py-2 text-xs font-mono hover:bg-white/5">Cancelar</button>
                            <button onClick={() => saveGoal(g)} className="rounded-xl bg-primary text-primary-foreground font-semibold px-4 py-2 text-xs hover:opacity-90"><Check className="size-3.5 inline mr-1" />Salvar</button>
                          </div>
                        </li>
                      );
                    }
                    return (
                      <li key={g.id} className={`glass rounded-2xl p-3 flex items-center gap-3 ${g.done ? "opacity-70" : ""}`}>
                        <input type="checkbox" checked={g.done} onChange={() => toggleGoal(g)} className="size-4 accent-[var(--primary)] cursor-pointer" />
                        <div className={`size-9 rounded-xl grid place-items-center shrink-0 ${g.done ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}`}><Icon className="size-4" /></div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold ${g.done ? "line-through" : ""}`}>{g.title}</p>
                          {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                        </div>
                        {g.link && (
                          <a href={g.link} target="_blank" rel="noopener noreferrer" title={g.link}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-white/5">
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                        {g.date && <span className="font-mono text-xs text-muted-foreground">{new Date(g.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>}
                        <button onClick={() => startEditGoal(g)} title="Editar objetivo" className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-white/5"><Pencil className="size-3.5" /></button>
                        <button onClick={() => removeGoal(g)} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {goals.length === 0 && expenses.length === 0 && (
                <p className="text-xs text-muted-foreground font-mono">Adicione gastos e objetivos para montar o roadmap.</p>
              )}
            </section>

            <div className="max-w-sm">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Capa do projeto</p>
              <CoverPicker value={project.cover} onChange={changeCover} />
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
