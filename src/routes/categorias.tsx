import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { useState } from "react";
import {
  Plus, Trash2, Tag,
  Home, Car, DollarSign, UtensilsCrossed, CreditCard, PartyPopper, Gamepad2, Film,
  Laptop, Smartphone, Shirt, Monitor, Dog, Cat, Stethoscope, PawPrint, Baby, Puzzle,
  GraduationCap, Bus, TramFront, Plane, Map, Umbrella, Bike, Activity, Beer,
  Trophy, Dumbbell, Flower2, Droplets, Lightbulb, Wifi,
  Building2, Banknote, Coins, Swords, Sandwich, Pizza, Watch, Notebook, Volleyball,
  Coffee, IceCream, Gift, Book, Sun, Moon, ShoppingBag, ShoppingCart, Fuel, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/categorias")({
  head: () => ({ meta: [{ title: "Categorias — CloseFinance" }, { name: "description", content: "Crie e personalize categorias de gastos." }] }),
  component: CategoriesPage,
});

const PALETTE = ["#540BD3", "#FFCC00", "#006F77", "#820432", "#2BD9A1", "#FF4D6D", "#B388FF", "#22C3CC", "#FF6B1A", "#FFD700"];

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  tag: Tag,
  home: Home, apartment: Building2, car: Car, money: DollarSign, cash: Banknote, coins: Coins,
  food: UtensilsCrossed, card: CreditCard, leisure: PartyPopper, gamepad: Gamepad2, film: Film,
  laptop: Laptop, phone: Smartphone, clothes: Shirt, computer: Monitor, dog: Dog, cat: Cat,
  doctor: Stethoscope, vet: PawPrint, baby: Baby, kid: Puzzle, study: GraduationCap,
  bus: Bus, train: TramFront, plane: Plane, travel: Map, beach: Umbrella, bike: Bike,
  motorcycle: Bike, skate: Activity, drinks: Beer, sports: Trophy, gym: Dumbbell,
  yoga: Flower2, boxing: Swords, water: Droplets, power: Lightbulb, internet: Wifi,
  hamburger: Sandwich, pizza: Pizza, watch: Watch, notebook: Notebook, football: Volleyball,
  coffee: Coffee, icecream: IceCream, gift: Gift, book: Book, sun: Sun, moon: Moon,
  shopping: ShoppingBag, market: ShoppingCart, fuel: Fuel, tools: Wrench,
};

const ICON_LIST: { id: string; label: string }[] = [
  { id: "tag", label: "Padrão" },
  { id: "home", label: "Casa" }, { id: "apartment", label: "Apartamento" },
  { id: "car", label: "Carro" }, { id: "motorcycle", label: "Moto" },
  { id: "money", label: "Dinheiro" }, { id: "cash", label: "R$ (Cédula)" }, { id: "coins", label: "Moedas" },
  { id: "food", label: "Comida" }, { id: "hamburger", label: "Hambúrguer" }, { id: "pizza", label: "Pizza" },
  { id: "coffee", label: "Café" }, { id: "icecream", label: "Sorvete" }, { id: "drinks", label: "Bebidas" },
  { id: "card", label: "Cartão" }, { id: "shopping", label: "Compras" }, { id: "market", label: "Mercado" },
  { id: "leisure", label: "Lazer" }, { id: "gamepad", label: "Vídeo game" }, { id: "film", label: "Filmes" },
  { id: "laptop", label: "Notebook" }, { id: "phone", label: "Celular" }, { id: "clothes", label: "Roupas" },
  { id: "computer", label: "Computador" }, { id: "watch", label: "Relógio" }, { id: "notebook", label: "Caderno" },
  { id: "book", label: "Livro" }, { id: "gift", label: "Presente" },
  { id: "dog", label: "Cachorro" }, { id: "cat", label: "Gato" }, { id: "doctor", label: "Médico" },
  { id: "vet", label: "Veterinário" }, { id: "baby", label: "Bebê" }, { id: "kid", label: "Criança" },
  { id: "study", label: "Estudo" }, { id: "bus", label: "Ônibus" }, { id: "train", label: "Trem/Metrô" },
  { id: "plane", label: "Avião" }, { id: "travel", label: "Viagem" }, { id: "beach", label: "Praia" },
  { id: "bike", label: "Bicicleta" }, { id: "skate", label: "Skate" }, { id: "fuel", label: "Combustível" },
  { id: "sports", label: "Esportes" }, { id: "football", label: "Futebol" }, { id: "boxing", label: "Boxe" },
  { id: "gym", label: "Academia" }, { id: "yoga", label: "Yoga" }, { id: "tools", label: "Ferramentas" },
  { id: "water", label: "Água" }, { id: "power", label: "Luz" }, { id: "internet", label: "Internet" },
  { id: "sun", label: "Sol" }, { id: "moon", label: "Noite" },
];

function CategoriesPage() {
  const [{ categories, transactions }, api] = useStore();
  const [form, setForm] = useState({ name: "", color: PALETTE[0], icon: "tag" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    api.addCategory({ name: form.name.trim(), color: form.color, icon: form.icon });
    setForm({ name: "", color: PALETTE[0], icon: "tag" });
  }

  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Personalização</p>
        <h1 className="text-3xl font-bold">Categorias</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Defina rótulos com ícones para classificar gastos. Cada gasto também tem um segundo parâmetro: <span className="text-secondary">essencial</span> ou <span className="text-secondary">não essencial</span>.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        <GlassCard hideKey="categorias-1">
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
            <div>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Ícone</span>
              <div className="mt-1.5 grid grid-cols-6 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {ICON_LIST.map(({ id, label }) => {
                  const Icon = CATEGORY_ICONS[id] ?? Tag;
                  const active = form.icon === id;
                  return (
                    <button key={id} type="button" onClick={() => setForm({ ...form, icon: id })} title={label}
                      className={`aspect-square rounded-xl grid place-items-center border transition ${active ? "border-white bg-white/10" : "border-border hover:bg-white/5"}`}
                      style={active ? { color: form.color, background: form.color + "22", borderColor: form.color } : {}}>
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 glow-violet">
              <Plus className="size-4 inline mr-1.5" /> Adicionar
            </button>
          </form>
        </GlassCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          {categories.map((c) => {
            const count = transactions.filter(t => t.categoryId === c.id).length;
            const Icon = CATEGORY_ICONS[c.icon ?? "tag"] ?? Tag;
            return (
              <div key={c.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className="size-10 rounded-xl grid place-items-center shrink-0" style={{ background: c.color + "33", color: c.color }}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    value={c.name}
                    onChange={(e) => api.updateCategory(c.id, { name: e.target.value })}
                    className="w-full bg-transparent text-sm font-semibold outline-none border-b border-transparent focus:border-white/20"
                  />
                  <div className="flex items-center gap-1.5 mt-1">
                    <select value={c.icon ?? "tag"} onChange={(e) => api.updateCategory(c.id, { icon: e.target.value })}
                      className="bg-transparent text-[10px] font-mono text-muted-foreground outline-none cursor-pointer hover:text-foreground">
                      {ICON_LIST.map(i => <option key={i.id} value={i.id} className="bg-[#14062E]">{i.label}</option>)}
                    </select>
                    <span className="text-[11px] font-mono text-muted-foreground">· {count} transações</span>
                  </div>
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
