import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, parseBRL, type Receivable, type ReceivableInstallment } from "@/lib/store";
import { useMemo, useState } from "react";
import {
  Plus, Trash2, Check, CalendarDays, Pencil, Wallet, HandCoins, Handshake, Users, Briefcase,
  Building2, Landmark, PiggyBank, Gift, Laptop, Receipt, ChevronDown, ChevronUp,
  CreditCard, Banknote, Coins, Home, Car, GraduationCap, HeartPulse, Smartphone,
  Plane, ShoppingCart, Dog, Zap, Store, Scale, Trees, Camera, Music, Gamepad2,
  Tv, Wifi, Dumbbell, Utensils, Shirt, Book, Baby, Bike, Bus, Ship, Wrench,
  Sofa, Stethoscope, Sparkles, Coffee, Wine, Umbrella, TrendingUp, Trophy, Key,
} from "lucide-react";
import { notify } from "@/lib/notify";
import { playCashRegister } from "@/lib/sound";

export const Route = createFileRoute("/devedores")({
  head: () => ({
    meta: [
      { title: "Devedores — CloseFinance" },
      { name: "description", content: "Cadastre valores a receber, acompanhe o roadmap das parcelas e credite automaticamente no banco escolhido." },
      { property: "og:title", content: "Devedores — CloseFinance" },
      { property: "og:description", content: "Roadmap de parcelas a receber com crédito automático e integração com ganhos e calendário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DevedoresPage,
});

export const RECEIVABLE_ICONS = {
  wallet: Wallet, coins: HandCoins, deal: Handshake, people: Users, work: Briefcase,
  company: Building2, bank: Landmark, savings: PiggyBank, gift: Gift,
  freela: Laptop, bill: Receipt,
  card: CreditCard, cash: Banknote, coins2: Coins, rent: Home, car: Car,
  study: GraduationCap, health: HeartPulse, phone: Smartphone, travel: Plane,
  shopping: ShoppingCart, pet: Dog, energy: Zap, store: Store, legal: Scale,
  garden: Trees, camera: Camera, music: Music, games: Gamepad2, tv: Tv,
  internet: Wifi, gym: Dumbbell, food: Utensils, clothes: Shirt, book: Book,
  baby: Baby, bike: Bike, bus: Bus, boat: Ship, repair: Wrench, furniture: Sofa,
  doctor: Stethoscope, other: Sparkles, coffee: Coffee, drinks: Wine,
  insurance: Umbrella, invest: TrendingUp, prize: Trophy, key: Key,
} as const;
type ReceivableIconKey = keyof typeof RECEIVABLE_ICONS;

const COLORS = ["#2BD9A1", "#22C3CC", "#FFCC00", "#540BD3", "#FF6B1A", "#006F77", "#B388FF", "#FF8FA3"];
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

function DevedoresPage() {
  const [{ receivables, banks, categories }, api] = useStore();
  const [showForm, setShowForm] = useState(false);

  const totals = useMemo(() => {
    let total = 0, received = 0, openAmount = 0, nextDate: string | null = null, nextAmount = 0;
    for (const r of receivables) {
      for (const i of r.installments) {
        total += i.amount;
        if (i.received) received += i.amount;
        else {
          openAmount += i.amount;
          if (!nextDate || i.dueDate < nextDate) { nextDate = i.dueDate; nextAmount = i.amount; }
        }
      }
    }
    return { total, received, openAmount, nextDate, nextAmount };
  }, [receivables]);

  return (
    <AppShell>
      <SectionTitle
        title="Devedores"
        subtitle="Valores a receber, crédito automático e integração com ganhos e calendário"
        action={
          <button onClick={() => setShowForm(v => !v)}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold flex items-center gap-2 active:scale-[0.97] transition">
            <Plus className="size-4" /> Novo valor a receber
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Total a receber" value={formatBRL(totals.total)} accent="teal" />
        <Stat label="Já recebido" value={formatBRL(totals.received)} accent="success" />
        <Stat label="Em aberto" value={formatBRL(totals.openAmount)} accent="yellow" />
        <Stat
          label="Próximo recebimento"
          value={totals.nextDate ? formatBRL(totals.nextAmount) : "—"}
          sub={totals.nextDate ? fmtDate(totals.nextDate) : "nenhum pendente"}
          accent="violet"
        />
      </div>

      {showForm && (
        <ReceivableForm
          banks={banks}
          categories={categories}
          onCancel={() => setShowForm(false)}
          onCreate={async (payload) => {
            const created = await api.addReceivable(payload);
            if (created) {
              playCashRegister();
              notify(`"${payload.name}" criado — ${payload.installments.length} parcela(s) lançadas nos ganhos.`);
              setShowForm(false);
            } else {
              notify("Não foi possível criar o valor a receber.");
            }
          }}
        />
      )}

      {receivables.length === 0 && !showForm ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground">
            Você ainda não cadastrou valores a receber. Crie um para gerar automaticamente as parcelas como ganhos —
            elas aparecem também em <Link to="/ganhos" className="text-primary underline">Ganhos</Link> e no{" "}
            <Link to="/calendario" className="text-primary underline">Calendário</Link>.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {receivables.map(r => (
            <ReceivableCard
              key={r.id}
              receivable={r}
              bankName={banks.find(b => b.id === r.bankId)?.name}
              onToggleReceived={(inst) => {
                if (!inst.received && !confirm(`Tem certeza de que a parcela ${inst.number} de "${r.name}" foi recebida? A data dela será ajustada para hoje.`)) return;
                api.setReceivableInstallmentReceived(r.id, inst.id, !inst.received);
              }}
              onRename={async (name) => { await api.updateReceivable(r.id, { name }); notify("Nome atualizado nos ganhos."); }}
              onUpdateInstallment={(inst, patch) => api.updateReceivableInstallment(r.id, inst.id, patch)}

              onRemove={async () => {
                if (!confirm(`Apagar "${r.name}" e todos os ganhos das parcelas?`)) return;
                await api.removeReceivable(r.id);
                notify("Valor a receber removido.");
              }}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

// ---------------- FORM ----------------
function ReceivableForm({ banks, categories, onCreate, onCancel }: {
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
    name: "", icon: "coins" as ReceivableIconKey, color: COLORS[0],
    total: "", count: "1", firstDate: todayISO(), bankId: "", categoryId: "", note: "",
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
    if (!form.name.trim()) return notify("Dê um nome ao valor a receber.");
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

  const incomeCats = categories.filter(c => c.kind !== "expense");

  return (
    <GlassCard className="mb-4">
      <form onSubmit={submit} className="space-y-3">
        <h3 className="font-bold text-lg">Novo valor a receber</h3>

        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Nome (quem deve / origem)">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: João — empréstimo" className={inputCls} />
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
          <Field label="Data do 1º recebimento">
            <input type="date" value={form.firstDate}
              onChange={e => {
                const v = e.target.value;
                setForm({ ...form, firstDate: v });
                if (mode === "custom") setRows(preview.map((r, i) => ({ ...r, dueDate: addMonthsISO(v, i) })));
                else setRows(null);
              }} className={inputCls} />
          </Field>

          <Field label="Banco creditado automaticamente">
            <select value={form.bankId} onChange={e => setForm({ ...form, bankId: e.target.value })} className={inputCls}>
              <option value="">Nenhum (só registrar o ganho)</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Categoria do ganho">
            <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
              <option value="">Sem categoria</option>
              {incomeCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Ícone">
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
            {(Object.keys(RECEIVABLE_ICONS) as ReceivableIconKey[]).map(k => {
              const Icon = RECEIVABLE_ICONS[k];
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
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Parcelas — ajuste data e valor de cada uma
            </p>
            <div className="flex rounded-xl border border-border overflow-hidden text-[11px] font-mono">
              <button type="button" onClick={() => switchMode("equal")}
                className={`px-3 py-1.5 transition ${mode === "equal" ? "bg-primary text-primary-foreground" : "hover:bg-white/5"}`}>
                Valores iguais
              </button>
              <button type="button" onClick={() => switchMode("custom")}
                className={`px-3 py-1.5 transition ${mode === "custom" ? "bg-primary text-primary-foreground" : "hover:bg-white/5"}`}>
                Valores desiguais
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {preview.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground w-10 shrink-0">{i + 1}/{preview.length}</span>
                <input type="date" value={r.dueDate} onChange={e => editRow(i, { dueDate: e.target.value })} className={inputCls} />
                <input value={r.amount} onChange={e => editRow(i, { amount: e.target.value })} inputMode="decimal" placeholder="0,00" className={inputCls} />
                {mode === "custom" && (
                  <button type="button" onClick={() => removeRow(i)} aria-label="Remover parcela"
                    className="rounded-lg border border-border p-2 text-[#FF4D6D] hover:bg-[#FF4D6D]/15 shrink-0">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            {mode === "custom" ? (
              <button type="button" onClick={addRow}
                className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-mono hover:bg-white/5 flex items-center gap-1.5">
                <Plus className="size-3.5" /> Adicionar parcela
              </button>
            ) : <span />}
            <span className="text-[11px] font-mono text-muted-foreground">Soma das parcelas: {formatBRL(sum)}</span>
          </div>
        </div>


        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" data-sound="success"
            className="rounded-xl bg-primary text-primary-foreground font-semibold px-5 py-3 flex items-center gap-2 active:scale-[0.98] transition">
            <Plus className="size-4" /> Criar e lançar parcelas
          </button>
          <button type="button" onClick={onCancel} className="rounded-xl border border-border px-5 py-3 text-sm font-mono hover:bg-white/5">
            Cancelar
          </button>
        </div>
        <p className="text-[11px] font-mono text-muted-foreground">
          Cada parcela vira um ganho na data escolhida. Com banco selecionado, o valor é creditado no saldo na data do recebimento.
        </p>
      </form>
    </GlassCard>
  );
}

// ---------------- ROADMAP CARD ----------------
function ReceivableCard({ receivable, bankName, onToggleReceived, onRename, onUpdateInstallment, onRemove }: {
  receivable: Receivable;
  bankName?: string;
  onToggleReceived: (i: ReceivableInstallment) => void;
  onRename: (name: string) => void | Promise<void>;
  onUpdateInstallment: (i: ReceivableInstallment, patch: { amount?: number; dueDate?: string }) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(receivable.name);
  const Icon = RECEIVABLE_ICONS[(receivable.icon as ReceivableIconKey)] ?? HandCoins;
  const receivedCount = receivable.installments.filter(i => i.received).length;
  const total = receivable.installments.reduce((s, i) => s + i.amount, 0);
  const receivedAmount = receivable.installments.filter(i => i.received).reduce((s, i) => s + i.amount, 0);
  const pct = total > 0 ? Math.round((receivedAmount / total) * 100) : 0;
  const today = todayISO();

  function commitName() {
    const v = nameDraft.trim();
    setEditingName(false);
    if (!v || v === receivable.name) { setNameDraft(receivable.name); return; }
    onRename(v);
  }

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-2xl grid place-items-center shrink-0"
            style={{ background: `${receivable.color}22`, color: receivable.color, border: `1px solid ${receivable.color}55` }}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={e => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setNameDraft(receivable.name); setEditingName(false); } }}
                className="font-bold text-base bg-white/5 border border-border rounded-lg px-2 py-1 outline-none focus:border-primary w-full"
              />
            ) : (
              <h3 className="font-bold text-base break-words flex items-center gap-2">
                {receivable.name}
                <button onClick={() => { setNameDraft(receivable.name); setEditingName(true); }}
                  className="text-muted-foreground hover:text-foreground" aria-label="Editar nome do valor a receber">
                  <Pencil className="size-3.5" />
                </button>
              </h3>
            )}
            <p className="text-[11px] font-mono text-muted-foreground break-words">
              {receivedCount}/{receivable.installments.length} parcelas · {formatBRL(receivedAmount)} de {formatBRL(total)}
              {bankName ? ` · crédito em ${bankName}` : " · sem crédito automático"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(v => !v)} data-no-sound

            className="rounded-lg border border-border p-2 hover:bg-white/5" aria-label={open ? "Retrair" : "Expandir"}>
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          <button onClick={onRemove} className="rounded-lg border border-border p-2 hover:bg-[#FF4D6D]/15 text-[#FF4D6D]" aria-label="Remover valor a receber">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: receivable.color }} />
      </div>
      <p className="text-[10px] font-mono text-muted-foreground mt-1">{pct}% recebido</p>

      {receivable.note && <p className="text-xs text-muted-foreground mt-2 break-words">{receivable.note}</p>}

      {open && (
        <div className="mt-4 overflow-x-auto -mx-1 px-1">
          <ol className="flex gap-3 min-w-max pb-2">
            {receivable.installments.map((inst, idx) => {
              const late = !inst.received && inst.dueDate < today;
              return (
                <li key={inst.id} className="relative">
                  {idx > 0 && (
                    <span className="absolute -left-3 top-1/2 w-3 h-px" style={{ background: inst.received ? receivable.color : "rgba(255,255,255,0.15)" }} />
                  )}
                  <div className={`w-48 rounded-2xl border p-3 transition ${inst.received ? "bg-white/5" : late ? "border-[#FF4D6D]/60 bg-[#FF4D6D]/5" : "border-border"}`}
                    style={inst.received ? { borderColor: receivable.color, background: `${receivable.color}12` } : undefined}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        Parcela {inst.number}/{receivable.installments.length}
                      </span>
                      <button
                        onClick={() => onToggleReceived(inst)}
                        data-sound="check"
                        className={`size-6 rounded-md grid place-items-center border transition active:scale-95 ${inst.received ? "text-white" : "border-border text-muted-foreground hover:bg-white/10"}`}
                        style={inst.received ? { background: receivable.color, borderColor: receivable.color } : undefined}
                        aria-label={inst.received ? "Marcar como não recebida" : "Marcar como recebida"}
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
                    <p className={`mt-1.5 text-[10px] font-mono ${inst.received ? "text-[#2BD9A1]" : late ? "text-[#FF4D6D]" : "text-muted-foreground"}`}>
                      {inst.received ? "Recebida" : late ? "Atrasada" : "Agendada"}
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
