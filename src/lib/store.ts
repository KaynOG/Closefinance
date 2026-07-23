import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import { playMissionComplete } from "@/lib/sound";
import { notify as notifyToast } from "@/lib/notify";

export type TxType = "income" | "expense";
export type Essential = "essential" | "non_essential";
export type PaymentMethod = "credit" | "debit" | "pix" | "cash";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  description: string;
  date: string; // yyyy-mm-dd
  categoryId?: string;
  essential?: Essential;
  cardId?: string;
  bankId?: string;
  tag?: string;
  paymentMethod?: PaymentMethod;
  installmentNo?: number;
  installmentTotal?: number;
  installmentGroupId?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  kind?: "income" | "expense" | "both";
}

export interface Card {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  usedManual?: number;
}

export interface Bank {
  id: string;
  name: string;
  color: string;
  accountBalance: number;
  savedAmount: number;
  note?: string;
}

export type Gender = "male" | "female" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  birthdate?: string;
  job?: string;
  yearlyGoal?: number;
  avatar?: string;
  gender?: Gender;
  cashAmount?: number;
  friendCode?: string;
  createdAt: string;
}

export interface PointEntry {
  date: string;
  missionId: string;
  points: number;
}

export interface MissionState {
  date: string;
  completed: string[];
  totalPoints: number;
  history: PointEntry[];
}

export interface MissionDef { id: string; title: string; desc: string; points: number; auto: boolean; }
export const MISSIONS_CATALOG: MissionDef[] = [
  { id: "daily_login", title: "Faça login hoje", desc: "Entre no app — sua jornada financeira começa aqui.", points: 10, auto: true },
  { id: "view_dashboard", title: "Confira seu Dashboard", desc: "Abra o painel e olhe seus números do mês.", points: 5, auto: true },
  { id: "visit_educacao", title: "Estude na aba Educação", desc: "Aprenda algo novo sobre dinheiro hoje.", points: 10, auto: true },
  { id: "visit_cards", title: "Revise seus cartões", desc: "Abra a aba de Cartões e cheque seus limites.", points: 5, auto: true },
  { id: "visit_banks", title: "Revise seus bancos", desc: "Abra a aba de Bancos e veja seus saldos.", points: 5, auto: true },
  { id: "add_expense", title: "Registre um gasto", desc: "Adicione uma despesa real na planilha.", points: 10, auto: true },
  { id: "add_income", title: "Registre uma receita", desc: "Adicione uma entrada de dinheiro.", points: 10, auto: true },
  { id: "classify_essential", title: "Classifique um gasto", desc: "Marque um gasto como essencial ou não essencial.", points: 10, auto: true },
  { id: "save_money", title: "Guarde dinheiro", desc: "Acrescente algum valor poupado no banco ou na sua caixa.", points: 15, auto: true },
  { id: "visit_transacoes", title: "Explore as Transações", desc: "Abra a aba Transações e revise os lançamentos.", points: 5, auto: true },
  { id: "visit_calendario", title: "Cheque o Calendário", desc: "Veja o que entra e sai nos próximos dias.", points: 5, auto: true },
  { id: "visit_categorias", title: "Organize categorias", desc: "Abra as Categorias e mantenha tudo no lugar.", points: 5, auto: true },
  { id: "visit_missoes", title: "Visite Missões", desc: "Confira suas missões e sua patente atual.", points: 5, auto: true },
  { id: "visit_perfil", title: "Atualize seu Perfil", desc: "Abra Perfil & Ajustes e revise seus dados.", points: 5, auto: true },
  { id: "tag_transaction", title: "Use uma etiqueta", desc: "Adicione uma etiqueta livre em algum lançamento.", points: 10, auto: true },
  { id: "pay_invoice", title: "Pague uma fatura", desc: "Registre um pagamento de fatura de cartão.", points: 15, auto: true },
  { id: "pix_expense", title: "Registre um Pix", desc: "Lance um gasto pago via Pix.", points: 10, auto: true },
  { id: "debit_expense", title: "Registre um débito", desc: "Lance um gasto pago no débito.", points: 10, auto: true },
  { id: "cash_expense", title: "Registre um dinheiro físico", desc: "Lance um gasto pago em espécie.", points: 10, auto: true },
  { id: "credit_expense", title: "Registre uma compra no crédito", desc: "Lance uma compra parcelada ou à vista no cartão.", points: 10, auto: true },
  { id: "big_saver", title: "Poupe algo relevante", desc: "Guarde qualquer valor no banco — cada real conta.", points: 15, auto: true },
  { id: "budget_review", title: "Reveja seu orçamento", desc: "Volte ao Dashboard e olhe para os essenciais.", points: 10, auto: true },
  { id: "sync_data", title: "Sincronize seus saldos", desc: "Use a sincronização em Bancos ou Cartões.", points: 10, auto: true },
];

/** Retorna as 5 missões diárias — rotaciona pelo dia do ano para variar. */
export function getDailyMissions(date: Date = new Date()): MissionDef[] {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  // Sempre inclui daily_login como a primeira
  const fixed = MISSIONS_CATALOG.filter(m => m.id === "daily_login");
  const pool = MISSIONS_CATALOG.filter(m => m.id !== "daily_login");
  // rotação estável por dia
  const rotated = [...pool.slice(dayOfYear % pool.length), ...pool.slice(0, dayOfYear % pool.length)];
  return [...fixed, ...rotated.slice(0, 4)];
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  cards: Card[];
  banks: Bank[];
  users: User[];
  currentUserId: string | null;
  missions: MissionState;
  loading: boolean;
}

const EMPTY_STATE: AppState = {
  transactions: [],
  categories: [],
  cards: [],
  banks: [],
  users: [],
  currentUserId: null,
  missions: { date: new Date().toISOString().slice(0, 10), completed: [], totalPoints: 0, history: [] },
  loading: true,
};

let memory: AppState = EMPTY_STATE;
const listeners = new Set<() => void>();
function notify() { listeners.forEach(l => l()); }
function set(patch: Partial<AppState>) { memory = { ...memory, ...patch }; notify(); }

const id = () => crypto.randomUUID();

// ============= MAPPERS =============
function mapTx(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    type: row.type as TxType,
    amount: Number(row.amount),
    description: (row.description as string) ?? "",
    date: String(row.date),
    categoryId: (row.category_id as string) ?? undefined,
    essential: (row.essential as Essential) ?? undefined,
    cardId: (row.card_id as string) ?? undefined,
    bankId: (row.bank_id as string) ?? undefined,
    tag: (row.tag as string) ?? undefined,
    paymentMethod: (row.payment_method as PaymentMethod) ?? undefined,
    installmentNo: (row.installment_no as number) ?? undefined,
    installmentTotal: (row.installment_total as number) ?? undefined,
    installmentGroupId: (row.installment_group_id as string) ?? undefined,
    appliedToBalance: row.applied_to_balance == null ? true : Boolean(row.applied_to_balance),
  };
}
function mapCat(row: Record<string, unknown>): Category {
  return { id: String(row.id), name: String(row.name), color: String(row.color), icon: (row.icon as string) ?? undefined, kind: (row.kind as Category["kind"]) ?? "expense" };
}
function mapCard(row: Record<string, unknown>): Card {
  return { id: String(row.id), name: String(row.name), limit: Number(row.limit_amount), closingDay: Number(row.closing_day), dueDay: Number(row.due_day), color: String(row.color), usedManual: row.used_manual != null ? Number(row.used_manual) : 0 };
}
function mapBank(row: Record<string, unknown>): Bank {
  return { id: String(row.id), name: String(row.name), color: String(row.color), accountBalance: Number(row.account_balance), savedAmount: Number(row.saved_amount), note: (row.note as string) ?? undefined };
}
function mapProfile(p: Record<string, unknown>, supa: SupaUser): User {
  return {
    id: String(p.id ?? supa.id),
    name: (p.name as string) ?? "",
    email: (p.email as string) ?? supa.email ?? "",
    birthdate: (p.birthdate as string) ?? undefined,
    job: (p.job as string) ?? undefined,
    yearlyGoal: p.yearly_goal != null ? Number(p.yearly_goal) : undefined,
    avatar: (p.avatar as string) ?? undefined,
    gender: ((p.gender as Gender) ?? "other"),
    cashAmount: p.cash_amount != null ? Number(p.cash_amount) : 0,
    friendCode: (p.friend_code as string) ?? undefined,
    createdAt: (p.created_at as string) ?? supa.created_at,
  };
}

// ============= LOAD =============
async function loadAll(supaUser: SupaUser) {
  set({ loading: true });
  const uid = supaUser.id;
  const today = new Date().toISOString().slice(0, 10);
  const [profileR, catsR, cardsR, banksR, txR, missR] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("categories").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("cards").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("banks").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }).limit(2000),
    supabase.from("mission_history").select("*").eq("user_id", uid).order("occurred_at", { ascending: false }).limit(500),
  ]);

  const profileRow = (profileR.data as Record<string, unknown> | null) ?? { id: uid, email: supaUser.email, name: supaUser.email?.split("@")[0] ?? "" };
  const user = mapProfile(profileRow, supaUser);
  const totalPoints = (profileRow.total_points as number) ?? 0;
  const history: PointEntry[] = (missR.data ?? []).map(r => ({ date: String((r as Record<string, unknown>).occurred_at), missionId: String((r as Record<string, unknown>).mission_id), points: Number((r as Record<string, unknown>).points) }));
  const completed = history.filter(h => h.date.slice(0, 10) === today && h.points > 0).map(h => h.missionId);

  let cats = (catsR.data ?? []).map(r => mapCat(r as Record<string, unknown>));
  // Garante a categoria padrão de Adiantamento/Pagamento de fatura
  const INVOICE_CAT_NAME = "Adiantamento/Pagamento de fatura";
  if (!cats.some(c => c.name === INVOICE_CAT_NAME)) {
    const { data: newCat } = await supabase.from("categories")
      .insert({ user_id: uid, name: INVOICE_CAT_NAME, color: "#2BD9A1", kind: "expense" })
      .select("*").single();
    if (newCat) cats = [...cats, mapCat(newCat as Record<string, unknown>)];
  }

  set({
    loading: false,
    currentUserId: uid,
    users: [user],
    categories: cats,
    cards: (cardsR.data ?? []).map(r => mapCard(r as Record<string, unknown>)),
    banks: (banksR.data ?? []).map(r => mapBank(r as Record<string, unknown>)),
    transactions: (txR.data ?? []).map(r => mapTx(r as Record<string, unknown>)),
    missions: { date: today, completed, totalPoints, history },
  });
}

// Marker prefix usado no campo tag para identificar pagamentos de fatura.
// Formato: `__pf__:<cardId>` + opcional `|<tag livre do usuário>`
export const INVOICE_PAYMENT_TAG_PREFIX = "__pf__:";
export function parseInvoicePaymentTag(tag?: string): { cardId: string; userTag?: string } | null {
  if (!tag || !tag.startsWith(INVOICE_PAYMENT_TAG_PREFIX)) return null;
  const rest = tag.slice(INVOICE_PAYMENT_TAG_PREFIX.length);
  const [cardId, userTag] = rest.split("|");
  return { cardId, userTag: userTag || undefined };
}

// ============= CRÉDITO / FATURA HELPERS =============
// Compras no crédito (paymentMethod=credit) NÃO contam como saída direta —
// elas se acumulam na "Fatura do {cartão} - {Mês}" do mês em que cada parcela cai.
// Pagamentos reais de fatura (tag __pf__) continuam contando como saída normal.
export function isCreditPurchase(t: Transaction): boolean {
  return t.type === "expense" && t.paymentMethod === "credit" && !(t.tag ?? "").startsWith(INVOICE_PAYMENT_TAG_PREFIX);
}
export function isCashFlowExpense(t: Transaction): boolean {
  return t.type === "expense" && !isCreditPurchase(t);
}

export interface VirtualInvoiceRow {
  id: string;
  type: "expense";
  amount: number;
  description: string;
  date: string;
  cardId: string;
  virtual: true;
}

const MONTH_LABEL_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function computeInvoicesForMonth(transactions: Transaction[], cards: Card[], ref: Date): VirtualInvoiceRow[] {
  const out: VirtualInvoiceRow[] = [];
  for (const c of cards) {
    const items = transactions.filter(t => isCreditPurchase(t) && t.cardId === c.id && isSameMonth(t.date, ref));
    const amount = items.reduce((s, t) => s + t.amount, 0);
    if (amount <= 0) continue;
    const day = Math.min(28, c.closingDay);
    const dateStr = new Date(ref.getFullYear(), ref.getMonth(), day).toISOString().slice(0, 10);
    const label = `${MONTH_LABEL_PT[ref.getMonth()]}/${ref.getFullYear()}`;
    out.push({
      id: `__inv__:${c.id}:${ref.getFullYear()}-${ref.getMonth() + 1}`,
      type: "expense",
      amount,
      description: `Fatura do ${c.name} - ${label}`,
      date: dateStr,
      cardId: c.id,
      virtual: true,
    });
  }
  return out;
}

export function monthExpenseTotal(transactions: Transaction[], cards: Card[], ref: Date): number {
  const direct = transactions
    .filter(t => isSameMonth(t.date, ref) && isCashFlowExpense(t))
    .reduce((s, t) => s + t.amount, 0);
  const invoices = computeInvoicesForMonth(transactions, cards, ref)
    .reduce((s, i) => s + i.amount, 0);
  return direct + invoices;
}

function clearAll() {
  memory = { ...EMPTY_STATE, loading: false };
  notify();
}

// ============= SESSION WIRE-UP =============
let initialized = false;
function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) loadAll(data.session.user); else set({ loading: false });
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) loadAll(session.user);
    else if (event === "SIGNED_OUT") clearAll();
    else if (event === "USER_UPDATED" && session?.user) loadAll(session.user);
  });
}

// ============= UTIL =============
export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
/** Parse Brazilian money strings: "4040,23", "4.040,23", "4040.23", "4,040.23". */
export function parseBRL(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return NaN;
  if (typeof v === "number") return v;
  const s = String(v).trim().replace(/\s/g, "").replace(/R\$/i, "");
  if (!s) return NaN;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  let cleaned = s;
  if (hasComma && hasDot) {
    // último separador é o decimal
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) cleaned = s.replace(/\./g, "").replace(",", ".");
    else cleaned = s.replace(/,/g, "");
  } else if (hasComma) {
    cleaned = s.replace(/\./g, "").replace(",", ".");
  }
  return parseFloat(cleaned);
}
export function isSameMonth(iso: string, ref: Date) {
  const d = new Date(iso + "T00:00:00");
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
function addMonths(date: Date, n: number) {
  const d = new Date(date.getFullYear(), date.getMonth() + n, date.getDate());
  return d;
}

export function useStore() {
  ensureInit();
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force(n => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const api = {
    // ---------- TRANSACTIONS ----------
    addTransaction: async (t: Omit<Transaction, "id">) => {
      const uid = memory.currentUserId; if (!uid) return;
      const installmentsTotal = t.installmentTotal ?? 1;
      const groupId = installmentsTotal > 1 ? id() : undefined;
      const baseDate = new Date(t.date + "T00:00:00");
      const card = t.cardId ? memory.cards.find(c => c.id === t.cardId) : undefined;
      const rows = Array.from({ length: installmentsTotal }, (_, i) => {
        let d: Date;
        if (t.paymentMethod === "credit" && card) {
          // Crédito: aloca cada parcela na data de fechamento da fatura correspondente.
          // Se a compra ocorrer até o dia de fechamento, entra na fatura do mês atual;
          // caso contrário, vai para a fatura do próximo mês. Parcelas subsequentes
          // seguem os fechamentos dos meses seguintes.
          const closingDay = Math.min(28, card.closingDay);
          const offset = baseDate.getDate() <= closingDay ? 0 : 1;
          d = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset + i, closingDay);
        } else if (t.paymentMethod === "credit") {
          d = installmentsTotal > 1 ? addMonths(baseDate, i) : baseDate;
        } else if (installmentsTotal > 1 && i > 0 && card) {
          // Outras parcelas (não-crédito) — mantém comportamento legado: vencimento
          const m = addMonths(baseDate, i);
          d = new Date(m.getFullYear(), m.getMonth(), Math.min(28, card.dueDay));
        } else {
          d = installmentsTotal > 1 ? addMonths(baseDate, i) : baseDate;
        }
        return {
          user_id: uid, type: t.type, amount: t.amount, description: t.description,
          date: d.toISOString().slice(0, 10),
          category_id: t.categoryId ?? null, card_id: t.cardId ?? null, bank_id: t.bankId ?? null,
          essential: t.essential ?? null, payment_method: t.paymentMethod ?? null,
          installment_no: installmentsTotal > 1 ? i + 1 : null,
          installment_total: installmentsTotal > 1 ? installmentsTotal : null,
          installment_group_id: groupId ?? null, tag: t.tag ?? null,
        };
      });
      const { data, error } = await supabase.from("transactions").insert(rows).select("*");
      if (error) { console.error(error); return; }
      const inserted = (data ?? []).map(r => mapTx(r as Record<string, unknown>));
      set({ transactions: [...inserted, ...memory.transactions].sort((a, b) => b.date.localeCompare(a.date)) });

      // Apenas lançamentos com data até hoje impactam o saldo atual
      const todayStr = new Date().toISOString().slice(0, 10);
      const appliedRows = inserted.filter(x => x.date <= todayStr);

      // Débito/Pix em banco: desconta automaticamente do saldo em conta
      if (t.type === "expense" && (t.paymentMethod === "debit" || t.paymentMethod === "pix") && t.bankId) {
        const bank = memory.banks.find(b => b.id === t.bankId);
        if (bank && appliedRows.length) {
          const total = appliedRows.reduce((s, x) => s + x.amount, 0);
          const newBalance = bank.accountBalance - total;
          await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
          set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
        }
      }

      // Ganho recebido em banco: credita no saldo em conta
      if (t.type === "income" && t.bankId) {
        const bank = memory.banks.find(b => b.id === t.bankId);
        if (bank && appliedRows.length) {
          const total = appliedRows.reduce((s, x) => s + x.amount, 0);
          const newBalance = bank.accountBalance + total;
          await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
          set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
        }
      }
      // Ganho recebido em dinheiro físico: acrescenta na caixa
      if (t.type === "income" && t.paymentMethod === "cash" && !t.bankId) {
        const user = memory.users.find(u => u.id === uid);
        if (user && appliedRows.length) {
          const total = appliedRows.reduce((s, x) => s + x.amount, 0);
          const newCash = (user.cashAmount ?? 0) + total;
          await supabase.from("profiles").update({ cash_amount: newCash }).eq("id", uid);
          set({ users: memory.users.map(u => u.id === uid ? { ...u, cashAmount: newCash } : u) });
        }
      }
      // Gasto em dinheiro físico: desconta da caixa
      if (t.type === "expense" && t.paymentMethod === "cash" && !t.bankId) {
        const user = memory.users.find(u => u.id === uid);
        if (user && appliedRows.length) {
          const total = appliedRows.reduce((s, x) => s + x.amount, 0);
          const newCash = Math.max(0, (user.cashAmount ?? 0) - total);
          await supabase.from("profiles").update({ cash_amount: newCash }).eq("id", uid);
          set({ users: memory.users.map(u => u.id === uid ? { ...u, cashAmount: newCash } : u) });
        }
      }

      // Auto-award de missões pela ação realizada
      try {
        if (t.type === "income") await api.awardMission("add_income");
        if (t.type === "expense") {
          await api.awardMission("add_expense");
          if (t.essential) await api.awardMission("classify_essential");
        }
      } catch {}
    },
    updateTransaction: async (i: string, p: Partial<Transaction>) => {
      const patch: Record<string, unknown> = {};
      if (p.type !== undefined) patch.type = p.type;
      if (p.amount !== undefined) patch.amount = p.amount;
      if (p.description !== undefined) patch.description = p.description;
      if (p.date !== undefined) patch.date = p.date;
      if (p.categoryId !== undefined) patch.category_id = p.categoryId || null;
      if (p.cardId !== undefined) patch.card_id = p.cardId || null;
      if (p.bankId !== undefined) patch.bank_id = p.bankId || null;
      if (p.essential !== undefined) patch.essential = p.essential || null;
      if (p.paymentMethod !== undefined) patch.payment_method = p.paymentMethod || null;
      if (p.tag !== undefined) patch.tag = p.tag || null;
      const { error } = await supabase.from("transactions").update(patch as never).eq("id", i);
      if (error) { console.error(error); return; }
      set({ transactions: memory.transactions.map(x => x.id === i ? { ...x, ...p } : x) });
    },
    removeTransaction: async (i: string, opts?: { wholeGroup?: boolean }) => {
      const tx = memory.transactions.find(x => x.id === i);
      const todayStr2 = new Date().toISOString().slice(0, 10);
      const reverseSideEffects = (transaction: Transaction) => {
        // Lançamentos futuros não impactaram o saldo, então não revertem
        if (transaction.date > todayStr2) return;
        // expense via débito/pix → devolve ao banco
        if (transaction.type === "expense" && (transaction.paymentMethod === "debit" || transaction.paymentMethod === "pix") && transaction.bankId) {
          const bank = memory.banks.find(b => b.id === transaction.bankId);
          if (bank) {
            const newBalance = bank.accountBalance + transaction.amount;
            supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id).then(() => {});
            set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
          }
        }
        // income em banco → retira do saldo
        if (transaction.type === "income" && transaction.bankId) {
          const bank = memory.banks.find(b => b.id === transaction.bankId);
          if (bank) {
            const newBalance = bank.accountBalance - transaction.amount;
            supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id).then(() => {});
            set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
          }
        }
        // income em dinheiro físico → retira da caixa
        if (transaction.type === "income" && transaction.paymentMethod === "cash" && !transaction.bankId) {
          const uid = memory.currentUserId; if (!uid) return;
          const user = memory.users.find(u => u.id === uid);
          if (user) {
            const newCash = Math.max(0, (user.cashAmount ?? 0) - transaction.amount);
            supabase.from("profiles").update({ cash_amount: newCash }).eq("id", uid).then(() => {});
            set({ users: memory.users.map(u => u.id === uid ? { ...u, cashAmount: newCash } : u) });
          }
        }
        // expense em dinheiro físico → devolve à caixa
        if (transaction.type === "expense" && transaction.paymentMethod === "cash" && !transaction.bankId) {
          const uid = memory.currentUserId; if (!uid) return;
          const user = memory.users.find(u => u.id === uid);
          if (user) {
            const newCash = (user.cashAmount ?? 0) + transaction.amount;
            supabase.from("profiles").update({ cash_amount: newCash }).eq("id", uid).then(() => {});
            set({ users: memory.users.map(u => u.id === uid ? { ...u, cashAmount: newCash } : u) });
          }
        }
      };

      if (opts?.wholeGroup && tx?.installmentGroupId) {
        const gid = tx.installmentGroupId;
        const groupTxs = memory.transactions.filter(x => x.installmentGroupId === gid);
        const { error } = await supabase.from("transactions").delete().eq("installment_group_id", gid);
        if (error) return console.error(error);
        set({ transactions: memory.transactions.filter(x => x.installmentGroupId !== gid) });
        groupTxs.forEach(reverseSideEffects);
      } else {
        const { error } = await supabase.from("transactions").delete().eq("id", i);
        if (error) return console.error(error);
        set({ transactions: memory.transactions.filter(x => x.id !== i) });
        if (tx) reverseSideEffects(tx);
      }
    },

    // ---------- CATEGORIES ----------
    addCategory: async (c: Omit<Category, "id">) => {
      const uid = memory.currentUserId; if (!uid) return;
      const { data, error } = await supabase.from("categories").insert({ user_id: uid, name: c.name, color: c.color, icon: c.icon ?? null, kind: c.kind ?? "expense" }).select("*").single();
      if (error || !data) return console.error(error);
      set({ categories: [...memory.categories, mapCat(data as Record<string, unknown>)] });
    },
    updateCategory: async (i: string, p: Partial<Category>) => {
      const patch: Record<string, unknown> = {};
      if (p.name !== undefined) patch.name = p.name;
      if (p.color !== undefined) patch.color = p.color;
      if (p.icon !== undefined) patch.icon = p.icon || null;
      if (p.kind !== undefined) patch.kind = p.kind;
      const { error } = await supabase.from("categories").update(patch as never).eq("id", i);
      if (error) return console.error(error);
      set({ categories: memory.categories.map(x => x.id === i ? { ...x, ...p } : x) });
    },
    removeCategory: async (i: string) => {
      const cat = memory.categories.find(c => c.id === i);
      if (cat?.name === "Adiantamento/Pagamento de fatura") {
        console.warn("Categoria padrão Adiantamento/Pagamento de fatura não pode ser apagada.");
        return;
      }
      const { error } = await supabase.from("categories").delete().eq("id", i);
      if (error) return console.error(error);
      set({ categories: memory.categories.filter(x => x.id !== i) });
    },

    // ---------- CARDS ----------
    addCard: async (c: Omit<Card, "id">) => {
      const uid = memory.currentUserId; if (!uid) return;
      const { data, error } = await supabase.from("cards").insert({ user_id: uid, name: c.name, limit_amount: c.limit, closing_day: c.closingDay, due_day: c.dueDay, color: c.color, used_manual: c.usedManual ?? 0 } as never).select("*").single();
      if (error || !data) return console.error(error);
      set({ cards: [...memory.cards, mapCard(data as Record<string, unknown>)] });
    },
    updateCard: async (i: string, p: Partial<Card>) => {
      const patch: Record<string, unknown> = {};
      if (p.name !== undefined) patch.name = p.name;
      if (p.limit !== undefined) patch.limit_amount = p.limit;
      if (p.closingDay !== undefined) patch.closing_day = p.closingDay;
      if (p.dueDay !== undefined) patch.due_day = p.dueDay;
      if (p.color !== undefined) patch.color = p.color;
      if (p.usedManual !== undefined) patch.used_manual = p.usedManual;
      const { error } = await supabase.from("cards").update(patch as never).eq("id", i);
      if (error) return console.error(error);
      set({ cards: memory.cards.map(x => x.id === i ? { ...x, ...p } : x) });
    },
    removeCard: async (i: string) => {
      const { error } = await supabase.from("cards").delete().eq("id", i);
      if (error) return console.error(error);
      set({ cards: memory.cards.filter(x => x.id !== i) });
    },

    // ---------- BANKS ----------
    addBank: async (b: Omit<Bank, "id">) => {
      const uid = memory.currentUserId; if (!uid) return;
      const { data, error } = await supabase.from("banks").insert({ user_id: uid, name: b.name, color: b.color, account_balance: b.accountBalance, saved_amount: b.savedAmount, note: b.note ?? null }).select("*").single();
      if (error || !data) return console.error(error);
      set({ banks: [...memory.banks, mapBank(data as Record<string, unknown>)] });
    },
    updateBank: async (i: string, p: Partial<Bank>) => {
      const prev = memory.banks.find(b => b.id === i);
      const patch: Record<string, unknown> = {};
      if (p.name !== undefined) patch.name = p.name;
      if (p.color !== undefined) patch.color = p.color;
      if (p.accountBalance !== undefined) patch.account_balance = p.accountBalance;
      if (p.savedAmount !== undefined) patch.saved_amount = p.savedAmount;
      if (p.note !== undefined) patch.note = p.note || null;
      const { error } = await supabase.from("banks").update(patch as never).eq("id", i);
      if (error) return console.error(error);
      set({ banks: memory.banks.map(x => x.id === i ? { ...x, ...p } : x) });
      if (prev && p.savedAmount !== undefined && p.savedAmount > prev.savedAmount) {
        try { await api.awardMission("save_money"); } catch {}
      }
    },
    removeBank: async (i: string) => {
      const { error } = await supabase.from("banks").delete().eq("id", i);
      if (error) return console.error(error);
      set({ banks: memory.banks.filter(x => x.id !== i) });
    },
    // Recalcula o saldo em conta de cada banco (e o dinheiro em caixa) com base
    // no histórico de transações aplicadas até hoje. Substitui o saldo atual pelo
    // resultado líquido (soma de ganhos − soma de gastos débito/pix por banco).
    syncBankBalances: async (opts?: { initialBalances?: Record<string, number>; initialCash?: number }) => {
      const uid = memory.currentUserId; if (!uid) return;
      const todayStr = new Date().toISOString().slice(0, 10);
      const applied = memory.transactions.filter(t => t.date <= todayStr);
      for (const b of memory.banks) {
        const income = applied.filter(t => t.type === "income" && t.bankId === b.id).reduce((s, t) => s + t.amount, 0);
        const outflow = applied.filter(t => t.type === "expense" && (t.paymentMethod === "debit" || t.paymentMethod === "pix") && t.bankId === b.id).reduce((s, t) => s + t.amount, 0);
        const base = opts?.initialBalances?.[b.id] ?? 0;
        const newBalance = base + income - outflow;
        await supabase.from("banks").update({ account_balance: newBalance }).eq("id", b.id);
        set({ banks: memory.banks.map(x => x.id === b.id ? { ...x, accountBalance: newBalance } : x) });
      }
      const cashIn = applied.filter(t => t.type === "income" && t.paymentMethod === "cash" && !t.bankId).reduce((s, t) => s + t.amount, 0);
      const cashOut = applied.filter(t => t.type === "expense" && t.paymentMethod === "cash" && !t.bankId).reduce((s, t) => s + t.amount, 0);
      const baseCash = opts?.initialCash ?? 0;
      const newCash = Math.max(0, baseCash + cashIn - cashOut);
      await supabase.from("profiles").update({ cash_amount: newCash }).eq("id", uid);
      set({ users: memory.users.map(u => u.id === uid ? { ...u, cashAmount: newCash } : u) });
    },

    // Recarrega todos os dados do usuário (cartões, bancos, transações, etc.)
    // Útil para sincronizar limites de cartão após pagamentos ou novos gastos.
    refresh: async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) await loadAll(data.session.user);
    },





    // ---------- AUTH ----------
    signup: async (data: { name: string; email: string; password: string; birthdate?: string; job?: string; yearlyGoal?: number; gender?: Gender }) => {
      const { error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: data.name,
            birthdate: data.birthdate ?? "",
            job: data.job ?? "",
            yearly_goal: data.yearlyGoal != null ? String(data.yearlyGoal) : "",
            gender: data.gender ?? "other",
          },
        },
      });
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    },
    login: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    },
    logout: async () => {
      await supabase.auth.signOut();
      clearAll();
    },
    updateProfile: async (patch: Partial<Omit<User, "id" | "createdAt" | "email">>) => {
      const uid = memory.currentUserId; if (!uid) return;
      const p: Record<string, unknown> = {};
      if (patch.name !== undefined) p.name = patch.name;
      if (patch.birthdate !== undefined) p.birthdate = patch.birthdate || null;
      if (patch.job !== undefined) p.job = patch.job || null;
      if (patch.yearlyGoal !== undefined) p.yearly_goal = patch.yearlyGoal ?? null;
      if (patch.avatar !== undefined) p.avatar = patch.avatar || null;
      if (patch.gender !== undefined) p.gender = patch.gender;
      if (patch.cashAmount !== undefined) p.cash_amount = patch.cashAmount;
      const { error } = await supabase.from("profiles").update(p as never).eq("id", uid);
      if (error) return console.error(error);
      set({ users: memory.users.map(u => u.id === uid ? { ...u, ...patch } : u) });
    },
    setCash: async (amount: number) => {
      const uid = memory.currentUserId; if (!uid) return;
      const v = Math.max(0, amount);
      const { error } = await supabase.from("profiles").update({ cash_amount: v }).eq("id", uid);
      if (error) return console.error(error);
      set({ users: memory.users.map(u => u.id === uid ? { ...u, cashAmount: v } : u) });
    },
    addCash: async (delta: number) => {
      const uid = memory.currentUserId; if (!uid) return;
      const user = memory.users.find(u => u.id === uid); if (!user) return;
      const v = Math.max(0, (user.cashAmount ?? 0) + delta);
      const { error } = await supabase.from("profiles").update({ cash_amount: v }).eq("id", uid);
      if (error) return console.error(error);
      set({ users: memory.users.map(u => u.id === uid ? { ...u, cashAmount: v } : u) });
      if (delta > 0) { try { await api.awardMission("save_money"); } catch {} }
    },
    changePassword: async (_currentPassword: string, newPassword: string) => {
      if (newPassword.length < 6) return { ok: false as const, error: "A nova senha deve ter pelo menos 6 caracteres." };
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    },
    requestPasswordReset: async (email: string) => {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, link: redirectTo, email: email.trim().toLowerCase() };
    },

    // ---------- MISSIONS ----------
    awardMission: async (missionId: string) => {
      const uid = memory.currentUserId; if (!uid) return;
      const today = new Date().toISOString().slice(0, 10);
      const def = MISSIONS_CATALOG.find(m => m.id === missionId);
      const points = def?.points ?? 10;
      const alreadyAwarded = memory.missions.history.some(h => h.missionId === missionId && h.points > 0 && h.date.slice(0, 10) === today);
      if (alreadyAwarded) {
        if (!memory.missions.completed.includes(missionId)) {
          set({ missions: { ...memory.missions, date: today, completed: [...memory.missions.completed, missionId] } });
        }
        return;
      }
      const occurred = new Date().toISOString();
      const { error } = await supabase.from("mission_history").insert({ user_id: uid, mission_id: missionId, points, occurred_at: occurred, day: today });
      if (error) return;
      const totalPoints = memory.missions.totalPoints + points;
      const history = [{ date: occurred, missionId, points }, ...memory.missions.history];
      const completed = memory.missions.completed.includes(missionId) ? memory.missions.completed : [...memory.missions.completed, missionId];
      await supabase.from("profiles").update({ total_points: totalPoints }).eq("id", uid);
      set({ missions: { date: today, completed, totalPoints, history } });
      try {
        playMissionComplete();
        notifyToast(`🏆 Missão concluída: ${def?.title ?? missionId} · +${points} pts`);
      } catch { /* noop */ }
    },
    toggleMission: async (missionId: string) => {
      const uid = memory.currentUserId; if (!uid) return;
      const today = new Date().toISOString().slice(0, 10);
      const def = MISSIONS_CATALOG.find(m => m.id === missionId);
      const points = def?.points ?? 10;
      const alreadyAwarded = memory.missions.history.some(h => h.missionId === missionId && h.points > 0 && h.date.slice(0, 10) === today);
      if (alreadyAwarded) return;
      const occurred = new Date().toISOString();
      await supabase.from("mission_history").insert({ user_id: uid, mission_id: missionId, points, occurred_at: occurred, day: today });
      const totalPoints = memory.missions.totalPoints + points;
      await supabase.from("profiles").update({ total_points: totalPoints }).eq("id", uid);
      set({ missions: { date: today, completed: [...memory.missions.completed, missionId], totalPoints, history: [{ date: occurred, missionId, points }, ...memory.missions.history] } });
    },

    // ---------- BACKUP ----------
    exportData: (_scope: "user" | "all" = "user") => {
      const user = memory.users.find(u => u.id === memory.currentUserId) ?? null;
      return JSON.stringify({
        app: "CloseFinance", version: 2, exportedAt: new Date().toISOString(),
        data: { transactions: memory.transactions, categories: memory.categories, cards: memory.cards, banks: memory.banks, user, missions: memory.missions },
      }, null, 2);
    },
    importData: async (json: string, mode: "merge" | "replace" = "merge") => {
      try {
        const parsed = JSON.parse(json);
        if (!parsed || parsed.app !== "CloseFinance" || !parsed.data) return { ok: false as const, error: "Arquivo inválido — não é um backup CloseFinance." };
        const uid = memory.currentUserId; if (!uid) return { ok: false as const, error: "Você precisa estar logado." };
        const d = parsed.data;
        const incomingTx: Transaction[] = Array.isArray(d.transactions) ? d.transactions : [];
        const incomingCats: Category[] = Array.isArray(d.categories) ? d.categories : [];
        const incomingCards: Card[] = Array.isArray(d.cards) ? d.cards : [];
        const incomingBanks: Bank[] = Array.isArray(d.banks) ? d.banks : [];

        if (mode === "replace") {
          await Promise.all([
            supabase.from("transactions").delete().eq("user_id", uid),
            supabase.from("cards").delete().eq("user_id", uid),
            supabase.from("banks").delete().eq("user_id", uid),
            supabase.from("categories").delete().eq("user_id", uid),
          ]);
        }
        // Insert categories first (so tx FK works); remap ids
        const catIdMap = new Map<string, string>();
        for (const c of incomingCats) {
          const { data } = await supabase.from("categories").insert({ user_id: uid, name: c.name, color: c.color, icon: c.icon ?? null, kind: c.kind ?? "expense" }).select("id").single();
          if (data) catIdMap.set(c.id, String((data as Record<string, unknown>).id));
        }
        const cardIdMap = new Map<string, string>();
        for (const c of incomingCards) {
          const { data } = await supabase.from("cards").insert({ user_id: uid, name: c.name, limit_amount: c.limit, closing_day: c.closingDay, due_day: c.dueDay, color: c.color }).select("id").single();
          if (data) cardIdMap.set(c.id, String((data as Record<string, unknown>).id));
        }
        const bankIdMap = new Map<string, string>();
        for (const b of incomingBanks) {
          const { data } = await supabase.from("banks").insert({ user_id: uid, name: b.name, color: b.color, account_balance: b.accountBalance ?? 0, saved_amount: b.savedAmount ?? 0, note: b.note ?? null }).select("id").single();
          if (data) bankIdMap.set(b.id, String((data as Record<string, unknown>).id));
        }
        if (incomingTx.length) {
          const rows = incomingTx.map(t => ({
            user_id: uid, type: t.type, amount: t.amount, description: t.description ?? "",
            date: t.date, category_id: t.categoryId ? catIdMap.get(t.categoryId) ?? null : null,
            card_id: t.cardId ? cardIdMap.get(t.cardId) ?? null : null,
            bank_id: t.bankId ? bankIdMap.get(t.bankId) ?? null : null,
            essential: t.essential ?? null, payment_method: t.paymentMethod ?? null,
            installment_no: t.installmentNo ?? null, installment_total: t.installmentTotal ?? null,
            installment_group_id: null, tag: t.tag ?? null,
          }));
          await supabase.from("transactions").insert(rows);
        }
        // Refresh state
        const { data: u } = await supabase.auth.getUser();
        if (u.user) await loadAll(u.user);
        return { ok: true as const, counts: { transactions: incomingTx.length, categories: incomingCats.length, cards: incomingCards.length } };
      } catch (e) {
        return { ok: false as const, error: "JSON inválido ou corrompido." };
      }
    },

    reset: () => { clearAll(); },
  };

  const currentUser = memory.users.find(u => u.id === memory.currentUserId) ?? null;
  return [memory, api, currentUser] as const;
}
