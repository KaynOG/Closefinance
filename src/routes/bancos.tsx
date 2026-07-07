import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore, formatBRL, parseBRL, type Bank } from "@/lib/store";
import { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Landmark, PiggyBank, Target, Wallet, X, Save, PlusCircle, Banknote, Minus } from "lucide-react";
import { TutorialBox } from "@/components/TutorialBox";

export const Route = createFileRoute("/bancos")({
  head: () => ({ meta: [{ title: "Bancos — CloseFinance" }, { name: "description", content: "Gerencie seus bancos, contas e valores guardados." }] }),
  component: BanksPage,
});

const PALETTE = ["#22C3CC", "#2BD9A1", "#540BD3", "#FFCC00", "#FF6B1A", "#820432", "#B388FF"];

function BanksPage() {
  const [{ banks, users, currentUserId }, api] = useStore();
  useEffect(() => { api.awardMission("visit_banks"); }, []);
  const user = users.find(u => u.id === currentUserId);
  const goal = user?.yearlyGoal ?? 0;
  const cash = user?.cashAmount ?? 0;

  const [form, setForm] = useState({ name: "", color: PALETTE[0], accountBalance: "", savedAmount: "", note: "" });
  const [editing, setEditing] = useState<Bank | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.addBank({
      name: form.name.trim(), color: form.color,
      accountBalance: parseBRL(form.accountBalance) || 0,
      savedAmount: parseBRL(form.savedAmount) || 0,
      note: form.note.trim() || undefined,
    });
    setForm({ name: "", color: PALETTE[0], accountBalance: "", savedAmount: "", note: "" });
  }

  const totals = useMemo(() => {
    const balance = banks.reduce((s, b) => s + b.accountBalance, 0);
    const saved = banks.reduce((s, b) => s + b.savedAmount, 0);
    const goalPct = goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;
    return { balance, saved, goalPct };
  }, [banks, goal]);

  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Patrimônio</p>
        <h1 className="text-3xl font-bold">Bancos e poupança</h1>
      </header>

      <TutorialBox
        storageKey="bancos"
        title="Como usar Bancos e poupança"
        steps={[
          "Cadastre cada banco que você usa em 'Novo banco' (nome, cor, saldo atual).",
          "Informe quanto está guardado (poupança) — entra no acompanhamento da meta anual.",
          "Quando registrar um ganho ou gasto via Pix/Débito, escolha o banco: o saldo atualiza sozinho.",
          "Use o botão '+' do banco para depositar/retirar manualmente quando precisar ajustar.",
        ]}
        tip="Mantenha o saldo igual ao do app do seu banco — assim seus relatórios refletem a realidade."
      />

      <SyncBalancesBar banks={banks} cash={cash} onSync={async (initBanks, initCash) => {
        await api.syncBankBalances({ initialBalances: initBanks, initialCash: initCash });
      }} />





      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <Stat label="Saldo em contas" value={formatBRL(totals.balance)} accent="teal" sub={`${banks.length} ${banks.length === 1 ? "banco" : "bancos"}`} />
        <Stat label="Guardado / poupado" value={formatBRL(totals.saved)} accent="success" sub="reserva acumulada" />
        <Stat label="Meta anual" value={goal > 0 ? formatBRL(goal) : "—"} accent="violet" sub={goal > 0 ? `${Math.round(totals.goalPct)}% atingido` : "defina no perfil"} />
      </section>


      <CashBox cash={cash} onAdd={(v) => api.addCash(v)} onSet={(v) => api.setCash(v)} />

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
        <GlassCard hideKey="bancos-2" hideLabel="Novo banco">
          <SectionTitle title="Novo banco" />
          <form onSubmit={submit} className="space-y-3">
            <Field label="Nome"><input className={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Nubank, Inter, Caixa…" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Saldo em conta (R$)"><input className={inp} value={form.accountBalance} onChange={e => setForm({ ...form, accountBalance: e.target.value })} inputMode="decimal" placeholder="0,00" /></Field>
              <Field label="Guardado (R$)"><input className={inp} value={form.savedAmount} onChange={e => setForm({ ...form, savedAmount: e.target.value })} inputMode="decimal" placeholder="0,00" /></Field>
            </div>
            <Field label="Observação">
              <input className={inp} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ex: reserva de emergência" />
            </Field>
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
            <button type="submit" data-sound="success" className="w-full rounded-xl bg-secondary text-secondary-foreground font-semibold py-3 hover:opacity-90 glow-cyan active:scale-[0.98]">
              <Plus className="size-4 inline mr-1.5" /> Adicionar banco
            </button>
          </form>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
          {banks.length === 0 && (
            <GlassCard hideKey="bancos-3" hideLabel="Lista de bancos" className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Você ainda não cadastrou bancos. Adicione o primeiro ao lado para acompanhar seu patrimônio e meta.</p>
            </GlassCard>
          )}
          {banks.map(b => {
            const pct = goal > 0 ? Math.min(100, (b.savedAmount / goal) * 100) : 0;
            return (
              <div key={b.id} className="relative rounded-3xl p-6 overflow-hidden glass-strong">
                <div className="absolute inset-0 opacity-40" style={{ background: `linear-gradient(135deg, ${b.color}66, transparent 60%)` }} />
                <div className="relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Banco</p>
                      <h3 className="text-xl font-bold mt-1">{b.name}</h3>
                    </div>
                    <Landmark className="size-6 opacity-70" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div>
                      <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-1"><Wallet className="size-3" /> Em conta</p>
                      <p className="text-lg font-bold mt-0.5">{formatBRL(b.accountBalance)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-1"><PiggyBank className="size-3" /> Guardado</p>
                      <p className="text-lg font-bold mt-0.5" style={{ color: b.color }}>{formatBRL(b.savedAmount)}</p>
                    </div>
                  </div>
                  {goal > 0 && (
                    <>
                      <div className="flex items-center justify-between text-[10px] font-mono mt-4 mb-1.5">
                        <span className="text-muted-foreground flex items-center gap-1"><Target className="size-3" /> Meta anual</span>
                        <span className="text-foreground">{Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${b.color}, #2BD9A1)` }} />
                      </div>
                    </>
                  )}
                  {b.note && <p className="mt-3 text-xs font-mono text-muted-foreground italic">"{b.note}"</p>}

                  <QuickSaveInput bank={b} onAdd={async (amt) => {
                    await api.updateBank(b.id, { savedAmount: b.savedAmount + amt });
                  }} />

                  <div className="flex items-center justify-end gap-1 mt-3">
                    <button onClick={() => setEditing(b)} className="rounded-lg p-1.5 hover:bg-white/10 text-muted-foreground hover:text-foreground"><Pencil className="size-4" /></button>
                    <button onClick={() => api.removeBank(b.id)} className="rounded-lg p-1.5 hover:bg-white/10 text-muted-foreground hover:text-[#FF4D6D]"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {goal > 0 && <YearlyGoalCollapsible saved={totals.saved} goal={goal} pct={totals.goalPct} />}

      {editing && <EditBankModal bank={editing} onClose={() => setEditing(null)} onSave={async (patch) => { await api.updateBank(editing.id, patch); setEditing(null); }} />}
    </AppShell>
  );
}

function YearlyGoalCollapsible({ saved, goal, pct }: { saved: number; goal: number; pct: number }) {
  const [open, setOpen] = useState(false);
  return (
    <GlassCard hideKey="bancos-goal" hideLabel="Progresso da meta anual" className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg grid place-items-center bg-primary/15 text-primary"><Target className="size-4" /></div>
          <div>
            <h2 className="text-base font-semibold">Progresso da meta anual</h2>
            <p className="text-[11px] font-mono text-muted-foreground">{formatBRL(saved)} de {formatBRL(goal)}</p>
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} aria-label={open ? "Recolher" : "Expandir"}
          className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95">
          {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
        </button>
      </div>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #22C3CC, #2BD9A1)" }} />
          </div>
          <p className="mt-2 text-xs font-mono text-muted-foreground">Some os valores guardados em cada banco — eles contam para sua meta financeira anual.</p>
        </div>
      </div>
    </GlassCard>
  );
}

function EditBankModal({ bank, onClose, onSave }: { bank: Bank; onClose: () => void; onSave: (p: Partial<Bank>) => void | Promise<void> }) {
  const [form, setForm] = useState({
    name: bank.name, color: bank.color,
    accountBalance: String(bank.accountBalance), savedAmount: String(bank.savedAmount), note: bank.note ?? "",
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({
      name: form.name.trim(), color: form.color,
      accountBalance: parseBRL(form.accountBalance) || 0,
      savedAmount: parseBRL(form.savedAmount) || 0,
      note: form.note.trim() || undefined,
    });
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="w-full max-w-md glass-strong rounded-3xl p-6 space-y-3 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg">Editar banco</h3>
          <button type="button" data-no-sound onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10"><X className="size-4" /></button>
        </div>
        <Field label="Nome"><input className={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Saldo em conta"><input className={inp} value={form.accountBalance} onChange={e => setForm({ ...form, accountBalance: e.target.value })} inputMode="decimal" /></Field>
          <Field label="Guardado"><input className={inp} value={form.savedAmount} onChange={e => setForm({ ...form, savedAmount: e.target.value })} inputMode="decimal" /></Field>
        </div>
        <Field label="Observação"><input className={inp} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></Field>
        <Field label="Cor">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map(c => <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`size-8 rounded-full border-2 ${form.color === c ? "border-white scale-110" : "border-transparent"}`} style={{ background: c }} />)}
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="size-8 rounded-full bg-transparent cursor-pointer" />
          </div>
        </Field>
        <button type="submit" data-sound="success" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 glow-violet flex items-center justify-center gap-2"><Save className="size-4" /> Salvar</button>
      </form>
    </div>
  );
}

const inp = "w-full rounded-xl bg-white/5 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-white/10 font-mono";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span><div className="mt-1.5">{children}</div></label>;
}

function QuickSaveInput({ bank, onAdd }: { bank: Bank; onAdd: (amount: number) => void | Promise<void> }) {
  const [val, setVal] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseBRL(val);
    if (!Number.isFinite(n) || n === 0) return;
    await onAdd(n);
    setVal("");
  }
  return (
    <form onSubmit={submit} className="mt-4 flex items-center gap-2">
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-muted-foreground">R$</span>
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          inputMode="decimal"
          placeholder="Acrescentar ao guardado"
          className="w-full rounded-xl bg-white/5 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:bg-white/10 font-mono"
        />
      </div>
      <button type="submit" data-sound="coin" title="Adicionar ao guardado"
        className="rounded-xl px-3 py-2 text-xs font-mono font-semibold flex items-center gap-1.5 active:scale-95 transition"
        style={{ background: bank.color, color: "#fff" }}>
        <PlusCircle className="size-4" /> Guardar
      </button>
    </form>
  );
}

function CashBox({ cash, onAdd, onSet }: { cash: number; onAdd: (v: number) => void | Promise<void>; onSet: (v: number) => void | Promise<void> }) {
  const [val, setVal] = useState("");
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(cash));

  async function add(sign: 1 | -1) {
    const n = parseBRL(val);
    if (!Number.isFinite(n) || n === 0) return;
    await onAdd(sign * n);
    setVal("");
  }

  async function saveSet(e: React.FormEvent) {
    e.preventDefault();
    const n = parseBRL(editVal);
    if (!Number.isFinite(n) || n < 0) return;
    await onSet(n);
    setEditing(false);
  }

  return (
    <GlassCard hideKey="bancos-4" hideLabel="Dinheiro físico (caixa)" className="mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl grid place-items-center" style={{ background: "linear-gradient(135deg, #2BD9A1, #006F77)" }}>
            <Banknote className="size-6 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Caixa</p>
            <h3 className="text-lg font-bold">Dinheiro físico</h3>
          </div>
        </div>
        {editing ? (
          <form onSubmit={saveSet} className="flex items-center gap-2">
            <input value={editVal} onChange={e => setEditVal(e.target.value)} inputMode="decimal" autoFocus
              className="w-32 rounded-xl bg-white/5 border border-border px-3 py-2 text-sm outline-none focus:border-primary font-mono" />
            <button type="submit" data-sound="success" className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-mono font-semibold">Salvar</button>
            <button type="button" data-no-sound onClick={() => { setEditing(false); setEditVal(String(cash)); }} className="rounded-xl border border-border px-3 py-2 text-xs font-mono">Cancelar</button>
          </form>
        ) : (
          <button onClick={() => { setEditVal(String(cash)); setEditing(true); }} className="text-right hover:opacity-80 transition" title="Clique para ajustar manualmente">
            <p className="text-2xl font-bold" style={{ color: "#2BD9A1" }}>{formatBRL(cash)}</p>
            <p className="text-[10px] font-mono text-muted-foreground">clique para editar</p>
          </button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-muted-foreground">R$</span>
          <input value={val} onChange={e => setVal(e.target.value)} inputMode="decimal" placeholder="Adicionar ou retirar"
            className="w-full rounded-xl bg-white/5 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:bg-white/10 font-mono" />
        </div>
        <button type="button" data-sound="coin" onClick={() => add(1)} title="Adicionar"
          className="rounded-xl px-3 py-2 text-xs font-mono font-semibold flex items-center gap-1.5 active:scale-95 transition text-white"
          style={{ background: "#2BD9A1" }}>
          <PlusCircle className="size-4" /> Entrar
        </button>
        <button type="button" data-sound="click" onClick={() => add(-1)} title="Retirar"
          className="rounded-xl px-3 py-2 text-xs font-mono font-semibold flex items-center gap-1.5 active:scale-95 transition border border-border hover:bg-white/5">
          <Minus className="size-4" /> Sair
        </button>
      </div>
      <p className="mt-2 text-[11px] font-mono text-muted-foreground">Ganhos marcados como "dinheiro físico" entram automaticamente nesta caixa.</p>
    </GlassCard>
  );
}

function SyncBalancesBar({ banks, cash, onSync }: { banks: Bank[]; cash: number; onSync: (initBanks: Record<string, number>, initCash: number) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [initCash, setInitCash] = useState(String(cash));
  const [initBanks, setInitBanks] = useState<Record<string, string>>(() =>
    Object.fromEntries(banks.map(b => [b.id, String(b.accountBalance)])),
  );

  async function run() {
    setBusy(true);
    try {
      const bMap: Record<string, number> = {};
      for (const b of banks) bMap[b.id] = parseBRL(initBanks[b.id] ?? "0") || 0;
      const c = parseBRL(initCash) || 0;
      await onSync(bMap, c);
      setOpen(false);
    } finally { setBusy(false); }
  }

  return (
    <GlassCard hideKey="bancos-sync" hideLabel="Sincronizar saldos" className="mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Reconciliação</p>
          <h3 className="text-base font-semibold">Sincronizar saldos com as transações</h3>
          <p className="text-[11px] font-mono text-muted-foreground mt-1">Recalcula o saldo de cada banco (e do dinheiro em caixa) somando ganhos e descontando gastos por débito/pix já registrados.</p>
        </div>
        <button onClick={() => setOpen(o => !o)} className="rounded-xl bg-secondary text-secondary-foreground font-mono text-xs font-semibold px-3 py-2 hover:opacity-90 active:scale-95">
          {open ? "Fechar" : "Sincronizar"}
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-[11px] font-mono text-muted-foreground">Informe o <strong>saldo inicial</strong> de cada banco (antes das transações). Deixe 0 se prefere que o saldo reflita apenas o histórico registrado.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {banks.map(b => (
              <label key={b.id} className="block">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ background: b.color }} /> {b.name} · saldo inicial
                </span>
                <input value={initBanks[b.id] ?? ""} onChange={e => setInitBanks({ ...initBanks, [b.id]: e.target.value })} inputMode="decimal" className={inp + " mt-1.5"} placeholder="0,00" />
              </label>
            ))}
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Dinheiro em caixa · inicial</span>
              <input value={initCash} onChange={e => setInitCash(e.target.value)} inputMode="decimal" className={inp + " mt-1.5"} placeholder="0,00" />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-xl border border-border px-3 py-2 text-xs font-mono">Cancelar</button>
            <button onClick={run} disabled={busy} data-sound="success" className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-mono font-semibold disabled:opacity-50">
              {busy ? "Sincronizando…" : "Aplicar reconciliação"}
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

