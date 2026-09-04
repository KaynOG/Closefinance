import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, parseBRL, type Debt, type DebtInstallment } from "@/lib/store";
import { useMemo, useState } from "react";
import {
  Plus, Trash2, Check, CalendarDays, Pencil, Wallet, Home, Car, GraduationCap, HeartPulse,
  Smartphone, Plane, ShoppingCart, Landmark, Dog, Zap, Receipt, ChevronDown, ChevronUp,
  CreditCard, Banknote, Coins, Fuel, Utensils, Shirt, Dumbbell, Baby, Book, Music,
  Gamepad2, Tv, Wifi, Droplets, Flame, Wrench, Hammer, Sofa, Bike, Bus, Ship,
  Stethoscope, Pill, Scissors, Gift, Briefcase, Building2, Store, Scale, Trees,
  Laptop, Camera, PawPrint, Sparkles, Cigarette, Wine, Coffee, Church, Umbrella,
} from "lucide-react";
import { notify } from "@/lib/notify";
import { playExpense } from "@/lib/sound";

export const Route = createFileRoute("/dividas")({
  head: () => ({
    meta: [
      { title: "Dívidas — CloseFinance" },
      { name: "description", content: "Cadastre suas dívidas, acompanhe o roadmap das parcelas e debite automaticamente do banco escolhido." },
      { property: "og:title", content: "Dívidas — CloseFinance" },
      { property: "og:description", content: "Roadmap de parcelas com débito automático e integração com gastos e calendário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DividasPage,
});

export const DEBT_ICONS = {
  wallet: Wallet, home: Home, car: Car, study: GraduationCap, health: HeartPulse,
  phone: Smartphone, travel: Plane, shopping: ShoppingCart, bank: Landmark,
  pet: Dog, energy: Zap, bill: Receipt,
  card: CreditCard, cash: Banknote, coins: Coins, fuel: Fuel, food: Utensils,
  clothes: Shirt, gym: Dumbbell, baby: Baby, book: Book, music: Music,
  games: Gamepad2, tv: Tv, internet: Wifi, water: Droplets, gas: Flame,
  repair: Wrench, reform: Hammer, furniture: Sofa, bike: Bike, bus: Bus, boat: Ship,
  doctor: Stethoscope, medicine: Pill, beauty: Scissors, gift: Gift,
  work: Briefcase, company: Building2, store: Store, legal: Scale, garden: Trees,
  tech: Laptop, camera: Camera, paw: PawPrint, other: Sparkles,
  tobacco: Cigarette, drinks: Wine, coffee: Coffee, church: Church, insurance: Umbrella,
} as const;
type DebtIconKey = keyof typeof DEBT_ICONS;

const COLORS = ["#540BD3", "#FF6B1A", "#22C3CC", "#FFCC00", "#2BD9A1", "#FF4D6D", "#820432", "#006F77"];
const inputCls = "w-full rounded-xl bg-white/5 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white/10 font-mono";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function addMonthsISO(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}
function fmtDate(iso: string) { return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR"); }

function DividasPage() {
  const [{ debts, banks, categories }, api] = useStore();
  const [showForm, setShowForm] = useState(false);

  const totals = useMemo(() => {
    let total = 0, paid = 0, openAmount = 0, nextDate: string | null = null, nextAmount = 0;
    for (const d of debts) {
      for (const i of d.installments) {
        total += i.amount;
        if (i.paid) paid += i.amount;
        else {
          openAmount += i.amount;
          if (!nextDate || i.dueDate < nextDate) { nextDate = i.dueDate; nextAmount = i.amount; }
        }
      }
    }
    return { total, paid, openAmount, nextDate, nextAmount };
  }, [debts]);

  return (
    <AppShell>
      <SectionTitle
        title="Dívidas"
        subtitle="Roadmap de parcelas, débito automático e integração com gastos e calendário"
        action={
          <button onClick={() => setShowForm(v => !v)}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold flex items-center gap-2 active:scale-[0.97] transition">
            <Plus className="size-4" /> Nova dívida
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Total das dívidas" value={formatBRL(totals.total)} accent="crimson" />
        <Stat label="Já pago" value={formatBRL(totals.paid)} accent="success" />
        <Stat label="Em aberto" value={formatBRL(totals.openAmount)} accent="yellow" />
        <Stat
          label="Próxima parcela"
          value={totals.nextDate ? formatBRL(totals.nextAmount) : "—"}
          sub={totals.nextDate ? fmtDate(totals.nextDate) : "nenhuma pendente"}
          accent="teal"
        />
      </div>

      {showForm && (
        <DebtForm
          banks={banks}
          categories={categories}
          onCancel={() => setShowForm(false)}
          onCreate={async (payload) => {
            const created = await api.addDebt(payload);
            if (created) {
              playExpense();
              notify(`Dívida "${payload.name}" criada — ${payload.installments.length} parcela(s) lançadas nos gastos.`);
              setShowForm(false);
            } else {
              notify("Não foi possível criar a dívida.");
            }
          }}
        />
      )}

      {debts.length === 0 && !showForm ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground">
            Você ainda não cadastrou dívidas. Crie uma para gerar automaticamente as parcelas como gastos —
            elas aparecem também em <Link to="/gastos" className="text-primary underline">Gastos</Link> e no{" "}
            <Link to="/calendario" className="text-primary underline">Calendário</Link>.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {debts.map(d => (
            <DebtCard
              key={d.id}
              debt={d}
              bankName={banks.find(b => b.id === d.bankId)?.name}
              onTogglePaid={(inst) => api.setInstallmentPaid(d.id, inst.id, !inst.paid)}
              onRename={async (name) => { await api.updateDebt(d.id, { name }); notify("Nome da dívida atualizado nos gastos."); }}
              onUpdateInstallment={(inst, patch) => api.updateInstallment(d.id, inst.id, patch)}

              onRemove={async () => {
                if (!confirm(`Apagar a dívida "${d.name}" e todos os gastos das parcelas?`)) return;
                await api.removeDebt(d.id);
                notify("Dívida removida.");
              }}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

// ---------------- FORM ----------------
function DebtForm({ banks, categories, onCreate, onCancel }: {
  banks: { id: string; name: string }[];
  categories: { id: string; name: string; kind?: string }[];
  onCreate: (p: {
    name: string; icon: string; color: string; totalAmount: number;
    bankId?: string; categoryId?: string; note?: string;
    installments: { number: number; amount: number; dueDate: string }[];
  }) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: "", icon: "wallet" as DebtIconKey, color: COLORS[0],
    total: "", count: "12", firstDate: todayISO(), bankId: "", categoryId: "", note: "",
  });
  const [mode, setMode] = useState<"equal" | "custom">("equal");
  const [rows, setRows] = useState<{ amount: string; dueDate: string }[] | null>(null);

  const count = Math.max(1, Math.min(120, parseInt(form.count) || 1));
  const totalNum = parseBRL(form.total) || 0;

  const equalRows = useMemo(() => {
    const per = totalNum / count;
    return Array.from({ length: count }, (_, i) => ({
      amount: per ? per.toFixed(2) : "",
      dueDate: addMonthsISO(form.firstDate, i),
    }));
  }, [totalNum, count, form.firstDate]);

  const preview = mode === "custom" && rows ? rows : equalRows;
  const sum = preview.reduce((s, r) => s + (parseBRL(r.amount) || 0), 0);

  function editRow(i: number, patch: Partial<{ amount: string; dueDate: string }>) {
    const base = preview.map(r => ({ ...r }));
    base[i] = { ...base[i], ...patch };
    setRows(base);
    setMode("custom");
  }
  function switchMode(next: "equal" | "custom") {
    setMode(next);
    if (next === "custom") setRows(preview.map(r => ({ ...r })));
    else setRows(null);
  }
  function addRow() {
    const base = preview.map(r => ({ ...r }));
    const last = base[base.length - 1];
    base.push({ amount: "", dueDate: last ? addMonthsISO(last.dueDate, 1) : form.firstDate });
    setRows(base);
    setMode("custom");
    setForm(f => ({ ...f, count: String(base.length) }));
  }
  function removeRow(i: number) {
    if (preview.length <= 1) return;
    const base = preview.filter((_, idx) => idx !== i).map(r => ({ ...r }));
    setRows(base);
    setMode("custom");
    setForm(f => ({ ...f, count: String(base.length) }));
  }


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return notify("Dê um nome à dívida.");
    const installments = preview.map((r, i) => ({
      number: i + 1,
      amount: parseBRL(r.amount) || 0,
      dueDate: r.dueDate,
    }));
    if (installments.some(p => p.amount <= 0)) return notify("Todas as parcelas precisam ter valor.");
    await onCreate({
      name: form.name.trim(),
      icon: form.icon,
      color: form.color,
      totalAmount: installments.reduce((s, p) => s + p.amount, 0),
      bankId: form.bankId || undefined,
      categoryId: form.categoryId || undefined,
      note: form.note.trim() || undefined,
      installments,
    });
  }

  const expenseCats = categories.filter(c => c.kind !== "income");

  return (
    <GlassCard className="mb-4">
      <form onSubmit={submit} className="space-y-3">
        <h3 className="font-bold text-lg">Nova dívida</h3>

        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Nome da dívida">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Empréstimo do carro" className={inputCls} />
          </Field>
          <Field label={mode === "custom" ? "Valor total (soma das parcelas)" : "Valor total (R$)"}>
            {mode === "custom" ? (
              <input value={formatBRL(sum)} readOnly className={`${inputCls} opacity-70`} />
            ) : (
              <input value={form.total} onChange={e => { setForm({ ...form, total: e.target.value }); setRows(null); }}
                inputMode="decimal" placeholder="0,00" className={inputCls} />
            )}
          </Field>
          <Field label="Quantidade de parcelas">
            <input type="number" min={1} max={120} value={form.count}
              onChange={e => {
                setForm({ ...form, count: e.target.value });
                const n = Math.max(1, Math.min(120, parseInt(e.target.value) || 1));
                if (mode === "custom") {
                  const base = preview.map(r => ({ ...r }));
                  while (base.length < n) {
                    const last = base[base.length - 1];
                    base.push({ amount: "", dueDate: last ? addMonthsISO(last.dueDate, 1) : form.firstDate });
                  }
                  setRows(base.slice(0, n));
                } else setRows(null);
              }} className={inputCls} />
          </Field>

          <Field label="Data da 1ª parcela">
            <input type="date" value={form.firstDate}
              onChange={e => {
                const v = e.target.value;
                setForm({ ...form, firstDate: v });
                if (mode === "custom") setRows(preview.map((r, i) => ({ ...r, dueDate: addMonthsISO(v, i) })));
                else setRows(null);
              }} className={inputCls} />
          </Field>

          <Field label="Banco debitado automaticamente">
            <select value={form.bankId} onChange={e => setForm({ ...form, bankId: e.target.value })} className={inputCls}>
              <option value="">Nenhum (só registrar o gasto)</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Categoria do gasto">
            <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
              <option value="">Sem categoria</option>
              {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Ícone">
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
            {(Object.keys(DEBT_ICONS) as DebtIconKey[]).map(k => {
              const Icon = DEBT_ICONS[k];
              const active = form.icon === k;
              return (
                <button key={k} type="button" onClick={() => setForm({ ...form, icon: k })}
                  className={`size-10 rounded-xl grid place-items-center border transition active:scale-95 ${active ? "border-primary bg-primary/20" : "border-border hover:bg-white/5"}`}>
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Cor">
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                className={`size-8 rounded-full border-2 transition ${form.color === c ? "scale-110 border-white" : "border-transparent"}`}
                style={{ background: c }} aria-label={`Cor ${c}`} />
            ))}
          </div>
        </Field>

        <Field label="Observação (opcional)">
          <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls} />
        </Field>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Parcelas — ajuste data e valor de cada uma
          </p>
          <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {preview.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground w-10 shrink-0">{i + 1}/{preview.length}</span>
                <input type="date" value={r.dueDate} onChange={e => editRow(i, { dueDate: e.target.value })} className={inputCls} />
                <input value={r.amount} onChange={e => editRow(i, { amount: e.target.value })} inputMode="decimal" placeholder="0,00" className={inputCls} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" data-sound="success"
            className="rounded-xl bg-primary text-primary-foreground font-semibold px-5 py-3 flex items-center gap-2 active:scale-[0.98] transition">
            <Plus className="size-4" /> Criar dívida e lançar parcelas
          </button>
          <button type="button" onClick={onCancel} className="rounded-xl border border-border px-5 py-3 text-sm font-mono hover:bg-white/5">
            Cancelar
          </button>
        </div>
        <p className="text-[11px] font-mono text-muted-foreground">
          Cada parcela vira um gasto na data escolhida. Com banco selecionado, o valor é debitado do saldo na data do pagamento.
        </p>
      </form>
    </GlassCard>
  );
}

// ---------------- ROADMAP CARD ----------------
function DebtCard({ debt, bankName, onTogglePaid, onRename, onUpdateInstallment, onRemove }: {
  debt: Debt;
  bankName?: string;
  onTogglePaid: (i: DebtInstallment) => void;
  onRename: (name: string) => void | Promise<void>;
  onUpdateInstallment: (i: DebtInstallment, patch: { amount?: number; dueDate?: string }) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(debt.name);
  const Icon = DEBT_ICONS[(debt.icon as DebtIconKey)] ?? Wallet;
  const paidCount = debt.installments.filter(i => i.paid).length;
  const total = debt.installments.reduce((s, i) => s + i.amount, 0);
  const paidAmount = debt.installments.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);
  const pct = total > 0 ? Math.round((paidAmount / total) * 100) : 0;
  const today = todayISO();

  function commitName() {
    const v = nameDraft.trim();
    setEditingName(false);
    if (!v || v === debt.name) { setNameDraft(debt.name); return; }
    onRename(v);
  }

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-2xl grid place-items-center shrink-0"
            style={{ background: `${debt.color}22`, color: debt.color, border: `1px solid ${debt.color}55` }}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={e => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setNameDraft(debt.name); setEditingName(false); } }}
                className="font-bold text-base bg-white/5 border border-border rounded-lg px-2 py-1 outline-none focus:border-primary w-full"
              />
            ) : (
              <h3 className="font-bold text-base break-words flex items-center gap-2">
                {debt.name}
                <button onClick={() => { setNameDraft(debt.name); setEditingName(true); }}
                  className="text-muted-foreground hover:text-foreground" aria-label="Editar nome da dívida">
                  <Pencil className="size-3.5" />
                </button>
              </h3>
            )}
            <p className="text-[11px] font-mono text-muted-foreground break-words">
              {paidCount}/{debt.installments.length} parcelas · {formatBRL(paidAmount)} de {formatBRL(total)}
              {bankName ? ` · débito em ${bankName}` : " · sem débito automático"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(v => !v)} data-no-sound

            className="rounded-lg border border-border p-2 hover:bg-white/5" aria-label={open ? "Retrair" : "Expandir"}>
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          <button onClick={onRemove} className="rounded-lg border border-border p-2 hover:bg-[#FF4D6D]/15 text-[#FF4D6D]" aria-label="Remover dívida">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: debt.color }} />
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mt-1">{pct}% quitado</p>

      {debt.note && <p className="text-xs text-muted-foreground mt-2 break-words">{debt.note}</p>}

      {open && (
        <div className="mt-4 overflow-x-auto -mx-1 px-1">
          <ol className="flex gap-3 min-w-max pb-2">
            {debt.installments.map((inst, idx) => {
              const late = !inst.paid && inst.dueDate < today;
              return (
                <li key={inst.id} className="relative">
                  {idx > 0 && (
                    <span className="absolute -left-3 top-1/2 w-3 h-px" style={{ background: inst.paid ? debt.color : "rgba(255,255,255,0.15)" }} />
                  )}
                  <div className={`w-48 rounded-2xl border p-3 transition ${inst.paid ? "bg-white/5" : late ? "border-[#FF4D6D]/60 bg-[#FF4D6D]/5" : "border-border"}`}
                    style={inst.paid ? { borderColor: debt.color, background: `${debt.color}12` } : undefined}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        Parcela {inst.number}/{debt.installments.length}
                      </span>
                      <button
                        onClick={() => onTogglePaid(inst)}
                        data-sound="check"
                        className={`size-6 rounded-md grid place-items-center border transition active:scale-95 ${inst.paid ? "text-white" : "border-border text-muted-foreground hover:bg-white/10"}`}
                        style={inst.paid ? { background: debt.color, borderColor: debt.color } : undefined}
                        aria-label={inst.paid ? "Marcar como não paga" : "Marcar como paga"}
                      >
                        <Check className="size-3.5" />
                      </button>
                    </div>
                    <AmountInput
                      value={inst.amount}
                      onCommit={v => onUpdateInstallment(inst, { amount: v })}
                    />

                    <label className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                      <CalendarDays className="size-3.5 shrink-0" />
                      <input type="date" value={inst.dueDate}
                        onChange={e => onUpdateInstallment(inst, { dueDate: e.target.value })}
                        className="bg-transparent outline-none w-full" />
                    </label>
                    <p className={`mt-1.5 text-[10px] font-mono ${inst.paid ? "text-[#2BD9A1]" : late ? "text-[#FF4D6D]" : "text-muted-foreground"}`}>
                      {inst.paid ? "Paga" : late ? "Atrasada" : "Agendada"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </GlassCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function AmountInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  function commit() {
    const raw = draft;
    setDraft(null);
    if (raw === null) return;
    const v = parseBRL(raw);
    if (!isNaN(v) && v > 0 && v !== value) onCommit(v);
  }
  return (
    <input
      value={draft ?? String(value)}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      inputMode="decimal"
      className="mt-2 w-full bg-transparent text-lg font-bold font-mono outline-none"
    />
  );
}
