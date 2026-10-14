import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import { playCheck, playMissionComplete } from "@/lib/sound";
import { isTabHidden } from "@/lib/prefs";
import { notify as notifyToast } from "@/lib/notify";
import { isBudgetGroup, readBudgetPlan, type BudgetGroup, type BudgetPlan } from "@/lib/budget-goals";

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
  appliedToBalance?: boolean;
  subscriptionId?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  firstChargeDate: string;
  recurrenceMonths: number;
  color: string;
  icon: string;
  essential: Essential;
  active: boolean;
  usageFrequency: "daily" | "weekly" | "monthly" | "rarely";
  importance: "important" | "somewhat" | "unnecessary";
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  kind?: "income" | "expense" | "both";
  budgetGroup?: BudgetGroup | null;
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

export interface DebtInstallment {
  id: string;
  debtId: string;
  number: number;
  amount: number;
  dueDate: string; // yyyy-mm-dd
  paid: boolean;
  transactionId?: string;
}

export interface Debt {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalAmount: number;
  installmentsTotal: number;
  bankId?: string;
  categoryId?: string;
  note?: string;
  createdAt: string;
  sortOrder: number;
  archived: boolean;
  installments: DebtInstallment[];
}

export interface ReceivableInstallment {
  id: string;
  receivableId: string;
  number: number;
  amount: number;
  dueDate: string; // yyyy-mm-dd
  received: boolean;
  transactionId?: string;
}

export interface Receivable {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalAmount: number;
  installmentsTotal: number;
  bankId?: string;
  categoryId?: string;
  note?: string;
  createdAt: string;
  sortOrder: number;
  archived: boolean;
  installments: ReceivableInstallment[];
}

export type Gender = "male" | "female" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  birthdate?: string;
  job?: string;
  yearlyGoal?: number;
  budgetPlan?: BudgetPlan;
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
  debts: Debt[];
  receivables: Receivable[];
  subscriptions: Subscription[];
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
  debts: [],
  receivables: [],
  subscriptions: [],
  users: [],
  currentUserId: null,
  missions: { date: new Date().toISOString().slice(0, 10), completed: [], totalPoints: 0, history: [] },
  loading: true,
};

let memory: AppState = EMPTY_STATE;
const listeners = new Set<() => void>();
const CACHE_KEY = "cf_state_cache_v1";
let persistTimer: number | undefined;
function persist() {
  if (typeof window === "undefined") return;
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      if (memory.loading || !memory.currentUserId) return;
      localStorage.setItem(CACHE_KEY, JSON.stringify(memory));
    } catch { /* quota */ }
  }, 400);
}
function readCache(uid: string): AppState | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AppState;
    return s.currentUserId === uid ? { ...s, loading: false } : null;
  } catch { return null; }
}
function notify() { listeners.forEach(l => l()); persist(); }
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
    subscriptionId: (row.subscription_id as string) ?? undefined,
  };
}
function mapCat(row: Record<string, unknown>): Category {
  return { id: String(row.id), name: String(row.name), color: String(row.color), icon: (row.icon as string) ?? undefined, kind: (row.kind as Category["kind"]) ?? "expense", budgetGroup: isBudgetGroup(row.budget_group) ? row.budget_group : null };
}
function mapCard(row: Record<string, unknown>): Card {
  return { id: String(row.id), name: String(row.name), limit: Number(row.limit_amount), closingDay: Number(row.closing_day), dueDay: Number(row.due_day), color: String(row.color), usedManual: row.used_manual != null ? Number(row.used_manual) : 0 };
}
function mapBank(row: Record<string, unknown>): Bank {
  return { id: String(row.id), name: String(row.name), color: String(row.color), accountBalance: Number(row.account_balance), savedAmount: Number(row.saved_amount), note: (row.note as string) ?? undefined };
}
function mapSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: String(row.id), name: String(row.name), amount: Number(row.amount),
    firstChargeDate: String(row.first_charge_date), recurrenceMonths: Number(row.recurrence_months),
    color: String(row.color), icon: String(row.icon), essential: row.essential as Essential,
    active: Boolean(row.active),
    usageFrequency: (row.usage_frequency as Subscription["usageFrequency"]) ?? "monthly",
    importance: (row.importance as Subscription["importance"]) ?? "important",
    createdAt: String(row.created_at),
  };
}
function mapDebt(row: Record<string, unknown>, installments: DebtInstallment[]): Debt {
  return {
    id: String(row.id),
    name: String(row.name),
    icon: (row.icon as string) ?? "wallet",
    color: (row.color as string) ?? "#540BD3",
    totalAmount: Number(row.total_amount),
    installmentsTotal: Number(row.installments_total),
    bankId: (row.bank_id as string) ?? undefined,
    categoryId: (row.category_id as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    createdAt: String(row.created_at),
    sortOrder: Number(row.sort_order ?? 0),
    archived: Boolean(row.archived),
    installments: installments.sort((a, b) => a.number - b.number),
  };
}
function mapDebtInstallment(row: Record<string, unknown>): DebtInstallment {
  return {
    id: String(row.id),
    debtId: String(row.debt_id),
    number: Number(row.number),
    amount: Number(row.amount),
    dueDate: String(row.due_date),
    paid: Boolean(row.paid),
    transactionId: (row.transaction_id as string) ?? undefined,
  };
}
function mapReceivable(row: Record<string, unknown>, installments: ReceivableInstallment[]): Receivable {
  return {
    id: String(row.id),
    name: String(row.name),
    icon: (row.icon as string) ?? "wallet",
    color: (row.color as string) ?? "#2BD9A1",
    totalAmount: Number(row.total_amount),
    installmentsTotal: Number(row.installments_total),
    bankId: (row.bank_id as string) ?? undefined,
    categoryId: (row.category_id as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    createdAt: String(row.created_at),
    sortOrder: Number(row.sort_order ?? 0),
    archived: Boolean(row.archived),
    installments: installments.sort((a, b) => a.number - b.number),
  };
}
function mapReceivableInstallment(row: Record<string, unknown>): ReceivableInstallment {
  return {
    id: String(row.id),
    receivableId: String(row.receivable_id),
    number: Number(row.number),
    amount: Number(row.amount),
    dueDate: String(row.due_date),
    received: Boolean(row.received),
    transactionId: (row.transaction_id as string) ?? undefined,
  };
}
function mapProfile(p: Record<string, unknown>, supa: SupaUser): User {
  return {
    id: String(p.id ?? supa.id),
    name: (p.name as string) ?? "",
    email: (p.email as string) ?? supa.email ?? "",
    birthdate: (p.birthdate as string) ?? undefined,
    job: (p.job as string) ?? undefined,
    yearlyGoal: p.yearly_goal != null ? Number(p.yearly_goal) : undefined,
    budgetPlan: readBudgetPlan(p.budget_plan),
    avatar: (p.avatar as string) ?? undefined,
    gender: ((p.gender as Gender) ?? "other"),
    cashAmount: p.cash_amount != null ? Number(p.cash_amount) : 0,
    friendCode: (p.friend_code as string) ?? undefined,
    createdAt: (p.created_at as string) ?? supa.created_at,
  };
}

// ============= CATEGORIAS PADRÃO (fixas) =============
const FIXED_CATEGORIES = [
  { name: "Salário", color: "#2BD9A1", kind: "income", icon: "money" },
  { name: "Renda extra", color: "#22C3CC", kind: "income", icon: "coins" },
  { name: "Adiantamento/Pagamento de fatura", color: "#2BD9A1", kind: "expense", icon: null },
  { name: "Assinaturas", color: "#E50914", kind: "expense", icon: "tv" },
] as const;
export const LOCKED_CATEGORY_NAMES: string[] = FIXED_CATEGORIES.map(c => c.name.toLowerCase());
export const DEFAULT_CATEGORIES = [
  ...FIXED_CATEGORIES,
  { name: "Aluguel", color: "#007078", kind: "expense", icon: "home" },
  { name: "Conta de agua", color: "#22C3CC", kind: "expense", icon: "water" },
  { name: "Conta de Luz", color: "#FFCC00", kind: "expense", icon: "power" },
  { name: "Conta de internet", color: "#540BD3", kind: "expense", icon: "internet" },
  { name: "Alimentação", color: "#2BD9A1", kind: "expense", icon: "food" },
  { name: "Transporte", color: "#FF6B1A", kind: "expense", icon: "bus" },
  { name: "Lazer", color: "#B388FF", kind: "expense", icon: "leisure" },
  { name: "Saúde", color: "#FF4D6D", kind: "expense", icon: "doctor" },
  { name: "Animal", color: "#006F77", kind: "expense", icon: "vet" },
  { name: "Financiamento", color: "#820432", kind: "expense", icon: "money" },
  { name: "Poupar", color: "#2BD9A1", kind: "expense", icon: "coins", budgetGroup: "freedom" },
  { name: "Investimento", color: "#22C3CC", kind: "expense", icon: "money", budgetGroup: "freedom" },
] as const;

// ============= LOAD =============
let loadingUid: string | null = null;
async function loadAll(supaUser: SupaUser) {
  const uid = supaUser.id;
  if (loadingUid === uid) return;
  loadingUid = uid;
  try { await loadAllInner(supaUser); } finally { loadingUid = null; }
}
async function loadAllInner(supaUser: SupaUser) {
  const uid = supaUser.id;
  if (memory.currentUserId !== uid) {
    const cached = readCache(uid);
    if (cached) { memory = cached; notify(); } else set({ loading: true });
  }
  const today = new Date().toISOString().slice(0, 10);
  const [profileR, catsR, cardsR, banksR, txR, missR, debtsR, debtInstR, recvR, recvInstR, subsR] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("categories").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("cards").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("banks").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }).limit(2000),
    supabase.from("mission_history").select("*").eq("user_id", uid).order("occurred_at", { ascending: false }).limit(500),
    supabase.from("debts").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("debt_installments").select("*").eq("user_id", uid).order("number"),
    supabase.from("receivables").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("receivable_installments").select("*").eq("user_id", uid).order("number"),
    supabase.from("subscriptions").select("*").eq("user_id", uid).order("created_at"),
  ]);

  const profileRow = (profileR.data as Record<string, unknown> | null) ?? { id: uid, email: supaUser.email, name: supaUser.email?.split("@")[0] ?? "" };
  const user = mapProfile(profileRow, supaUser);
  const totalPoints = (profileRow.total_points as number) ?? 0;
  const history: PointEntry[] = (missR.data ?? []).map(r => ({ date: String((r as Record<string, unknown>).occurred_at), missionId: String((r as Record<string, unknown>).mission_id), points: Number((r as Record<string, unknown>).points) }));
  const completed = history.filter(h => h.date.slice(0, 10) === today && h.points > 0).map(h => h.missionId);

  let cats = (catsR.data ?? []).map(r => mapCat(r as Record<string, unknown>));
  // Garante as categorias padrão (fixas) de cada usuário
  const normName = (s: string) => s.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const missingCategories = DEFAULT_CATEGORIES.filter(def => !cats.some(c => normName(c.name) === normName(def.name)));
  if (missingCategories.length) {
    const { data: added } = await supabase.from("categories").insert(missingCategories.map(def => ({
      user_id: uid, name: def.name, color: def.color, kind: def.kind, icon: def.icon ?? null,
      budget_group: "budgetGroup" in def ? def.budgetGroup : null,
    }))).select("*");
    cats = [...cats, ...(added ?? []).map(row => mapCat(row as Record<string, unknown>))];
  }

  const loadedTx = (txR.data ?? []).map(r => mapTx(r as Record<string, unknown>));
  let loadedBanks = (banksR.data ?? []).map(r => mapBank(r as Record<string, unknown>));

  // Auto-crédito: ganhos com banco que já venceram (data <= hoje) e ainda não foram aplicados
  const pendingIncome = loadedTx.filter(
    t => t.type === "income" && t.bankId && t.date <= today && t.appliedToBalance === false,
  );
  if (pendingIncome.length) {
    const perBank = new Map<string, number>();
    for (const t of pendingIncome) perBank.set(t.bankId!, (perBank.get(t.bankId!) ?? 0) + t.amount);
    for (const [bankId, delta] of perBank) {
      const bank = loadedBanks.find(b => b.id === bankId);
      if (!bank) continue;
      const newBalance = bank.accountBalance + delta;
      await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bankId);
      loadedBanks = loadedBanks.map(b => b.id === bankId ? { ...b, accountBalance: newBalance } : b);
    }
    const ids = pendingIncome.map(t => t.id);
    await supabase.from("transactions").update({ applied_to_balance: true }).in("id", ids);
    for (const t of pendingIncome) t.appliedToBalance = true;
  }

  // Auto-débito: gastos agendados em banco (débito/pix) cuja data chegou e ainda não
  // foram descontados — cobre as parcelas de dívidas com débito automático.
  const pendingExpense = loadedTx.filter(
    t => t.type === "expense" && t.bankId && (t.paymentMethod === "debit" || t.paymentMethod === "pix")
      && t.date <= today && t.appliedToBalance === false,
  );
  if (pendingExpense.length) {
    const perBank = new Map<string, number>();
    for (const t of pendingExpense) perBank.set(t.bankId!, (perBank.get(t.bankId!) ?? 0) + t.amount);
    for (const [bankId, delta] of perBank) {
      const bank = loadedBanks.find(b => b.id === bankId);
      if (!bank) continue;
      const newBalance = bank.accountBalance - delta;
      await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bankId);
      loadedBanks = loadedBanks.map(b => b.id === bankId ? { ...b, accountBalance: newBalance } : b);
    }
    const ids = pendingExpense.map(t => t.id);
    await supabase.from("transactions").update({ applied_to_balance: true }).in("id", ids);
    for (const t of pendingExpense) t.appliedToBalance = true;
  }

  // Dívidas + parcelas (marca como paga toda parcela cujo gasto já foi debitado)
  const instRows = (debtInstR.data ?? []).map(r => mapDebtInstallment(r as Record<string, unknown>));
  const autoPaidIds: string[] = [];
  for (const inst of instRows) {
    if (inst.paid) continue;
    const tx = inst.transactionId ? loadedTx.find(t => t.id === inst.transactionId) : undefined;
    if (tx && tx.appliedToBalance && tx.date <= today) { inst.paid = true; autoPaidIds.push(inst.id); }
  }
  if (autoPaidIds.length) {
    await supabase.from("debt_installments").update({ paid: true }).in("id", autoPaidIds);
  }
  const debts = (debtsR.data ?? []).map(r => {
    const row = r as Record<string, unknown>;
    return mapDebt(row, instRows.filter(i => i.debtId === String(row.id)));
  });

  // Devedores + parcelas (marca como recebida toda parcela cujo ganho já foi creditado)
  const recvInstRows = (recvInstR.data ?? []).map(r => mapReceivableInstallment(r as Record<string, unknown>));
  const autoReceivedIds: string[] = [];
  for (const inst of recvInstRows) {
    if (inst.received) continue;
    const tx = inst.transactionId ? loadedTx.find(t => t.id === inst.transactionId) : undefined;
    if (tx && tx.appliedToBalance && tx.date <= today) { inst.received = true; autoReceivedIds.push(inst.id); }
  }
  if (autoReceivedIds.length) {
    await supabase.from("receivable_installments").update({ received: true }).in("id", autoReceivedIds);
  }
  const receivables = (recvR.data ?? []).map(r => {
    const row = r as Record<string, unknown>;
    return mapReceivable(row, recvInstRows.filter(i => i.receivableId === String(row.id)));
  });

  set({
    loading: false,
    currentUserId: uid,
    users: [user],
    categories: cats,
    cards: (cardsR.data ?? []).map(r => mapCard(r as Record<string, unknown>)),
    banks: loadedBanks,
    debts,
    receivables,
    subscriptions: (subsR.data ?? []).map(r => mapSubscription(r as Record<string, unknown>)),
    transactions: loadedTx,
    missions: { date: today, completed, totalPoints, history },
  });
}

// Marker prefix usado no campo tag para identificar pagamentos de fatura.
// Formato: `__pf__:<cardId>` + opcional `|<tag livre do usuário>`
export const INVOICE_PAYMENT_TAG_PREFIX = "__pf__:";

// Etiqueta usada nos gastos gerados automaticamente pelas parcelas de dívidas.
// Formato: `__dv__:<debtId>`
export const DEBT_TAG_PREFIX = "__dv__:";
export function parseDebtTag(tag?: string): string | null {
  if (!tag || !tag.startsWith(DEBT_TAG_PREFIX)) return null;
  return tag.slice(DEBT_TAG_PREFIX.length) || null;
}

// Etiqueta usada nos ganhos gerados automaticamente pelas parcelas a receber.
// Formato: `__rc__:<receivableId>`
export const RECEIVABLE_TAG_PREFIX = "__rc__:";
export const SUBSCRIPTION_TAG_PREFIX = "__sub__:";
export function parseSubscriptionTag(tag?: string): string | null {
  if (!tag || !tag.startsWith(SUBSCRIPTION_TAG_PREFIX)) return null;
  return tag.slice(SUBSCRIPTION_TAG_PREFIX.length) || null;
}
export function parseReceivableTag(tag?: string): string | null {
  if (!tag || !tag.startsWith(RECEIVABLE_TAG_PREFIX)) return null;
  return tag.slice(RECEIVABLE_TAG_PREFIX.length) || null;
}
export function parseInvoicePaymentTag(tag?: string): { cardId: string; userTag?: string } | null {
  if (!tag || !tag.startsWith(INVOICE_PAYMENT_TAG_PREFIX)) return null;
  const rest = tag.slice(INVOICE_PAYMENT_TAG_PREFIX.length);
  const [cardId, userTag] = rest.split("|");
  return { cardId, userTag: userTag || undefined };
}

// Etiqueta usada nas compras criadas pela aba de Cartões (roadmap de parcelas).
// Formato: `__cp__` (parcela em aberto) ou `__cp__:paid` (parcela quitada).
export const CARD_PURCHASE_TAG = "__cp__";
export const CARD_PURCHASE_PAID_TAG = "__cp__:paid";
export function isCardPurchaseTx(t: Transaction): boolean {
  return (t.tag ?? "").startsWith(CARD_PURCHASE_TAG);
}
export function isCardPurchasePaid(t: Transaction): boolean {
  return t.tag === CARD_PURCHASE_PAID_TAG;
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
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
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
function recurringDates(firstChargeDate: string, recurrenceMonths: number, monthsAhead = 24) {
  const first = new Date(`${firstChargeDate}T00:00:00`);
  const horizon = new Date();
  horizon.setMonth(horizon.getMonth() + monthsAhead);
  const dates: string[] = [];
  for (let i = 0; i < 120; i += 1) {
    const target = new Date(first.getFullYear(), first.getMonth() + i * recurrenceMonths, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(first.getDate(), lastDay));
    if (target > horizon) break;
    dates.push(target.toISOString().slice(0, 10));
  }
  return dates;
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
          subscription_id: t.subscriptionId ?? null,
        };
      });
      const { data, error } = await supabase.from("transactions").insert(rows).select("*");
      if (error) { console.error(error); return; }
      const inserted = (data ?? []).map(r => mapTx(r as Record<string, unknown>));
      set({ transactions: [...inserted, ...memory.transactions].sort((a, b) => b.date.localeCompare(a.date)) });

      // Apenas lançamentos com data até hoje impactam o saldo atual
      const todayStr = new Date().toISOString().slice(0, 10);
      const appliedRows = inserted.filter(x => x.date <= todayStr);
      const appliedIds = appliedRows.map(x => x.id);

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

      // Ganho recebido em banco: credita no saldo em conta (somente parcelas com data até hoje)
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

      // Marca as parcelas já aplicadas ao saldo (evita reaplicação futura pelo auto-crédito)
      if (appliedIds.length) {
        await supabase.from("transactions").update({ applied_to_balance: true }).in("id", appliedIds);
        set({ transactions: memory.transactions.map(x => appliedIds.includes(x.id) ? { ...x, appliedToBalance: true } : x) });
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
      if (p.subscriptionId !== undefined) patch.subscription_id = p.subscriptionId || null;
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

      // Se o lançamento é de uma parcela de dívida/devedor, remove a parcela correspondente
      const dropInstallmentForTx = async (transaction: Transaction) => {
        const tag = transaction.tag ?? "";
        const isDebt = tag.startsWith(DEBT_TAG_PREFIX);
        const isRecv = !isDebt && tag.startsWith(RECEIVABLE_TAG_PREFIX);
        if (!isDebt && !isRecv) return;
        const ownerId = tag.slice((isDebt ? DEBT_TAG_PREFIX : RECEIVABLE_TAG_PREFIX).length);
        const instTable = isDebt ? "debt_installments" : "receivable_installments";
        const ownerTable = isDebt ? "debts" : "receivables";

        const applyShrink = async (
          owner: Debt | Receivable,
          remaining: (DebtInstallment | ReceivableInstallment)[],
        ) => {
          const newTotal = remaining.length;

          // Sem parcelas restantes: apaga a dívida/devedor inteiro
          if (newTotal === 0) {
            await supabase.from(ownerTable).delete().eq("id", ownerId);
            if (isDebt) set({ debts: memory.debts.filter(d => d.id !== ownerId) });
            else set({ receivables: memory.receivables.filter(r => r.id !== ownerId) });
            return;
          }

          const newAmount = remaining.reduce((s, x) => s + x.amount, 0);
          await supabase.from(ownerTable).update({ installments_total: newTotal, total_amount: newAmount }).eq("id", ownerId);

          // Renumera parcelas e descrições dos lançamentos vinculados
          for (const x of remaining) {
            const old = owner.installments.find(o => o.id === x.id);
            if (old && old.number !== x.number) {
              await supabase.from(instTable).update({ number: x.number }).eq("id", x.id);
            }
            if (x.transactionId) {
              const desc = `${owner.name} (${x.number}/${newTotal})`;
              await supabase.from("transactions").update({ description: desc }).eq("id", x.transactionId);
              set({ transactions: memory.transactions.map(t => t.id === x.transactionId ? { ...t, description: desc } : t) });
            }
          }
        };

        if (isDebt) {
          const owner = memory.debts.find(d => d.id === ownerId);
          if (!owner) return;
          const inst = owner.installments.find(x => x.transactionId === transaction.id);
          if (!inst) return;
          await supabase.from(instTable).delete().eq("id", inst.id);
          const remaining = owner.installments
            .filter(x => x.id !== inst.id)
            .sort((a, b) => a.number - b.number)
            .map((x, idx) => ({ ...x, number: idx + 1 }));
          await applyShrink(owner, remaining);
          if (remaining.length > 0) {
            const newTotal = remaining.length;
            const newAmount = remaining.reduce((s, x) => s + x.amount, 0);
            set({ debts: memory.debts.map(d => d.id !== ownerId ? d : { ...d, installments: remaining, installmentsTotal: newTotal, totalAmount: newAmount }) });
          }
        } else {
          const owner = memory.receivables.find(r => r.id === ownerId);
          if (!owner) return;
          const inst = owner.installments.find(x => x.transactionId === transaction.id);
          if (!inst) return;
          await supabase.from(instTable).delete().eq("id", inst.id);
          const remaining = owner.installments
            .filter(x => x.id !== inst.id)
            .sort((a, b) => a.number - b.number)
            .map((x, idx) => ({ ...x, number: idx + 1 }));
          await applyShrink(owner, remaining);
          if (remaining.length > 0) {
            const newTotal = remaining.length;
            const newAmount = remaining.reduce((s, x) => s + x.amount, 0);
            set({ receivables: memory.receivables.map(r => r.id !== ownerId ? r : { ...r, installments: remaining, installmentsTotal: newTotal, totalAmount: newAmount }) });
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
        for (const gtx of groupTxs) await dropInstallmentForTx(gtx);
      } else {
        const { error } = await supabase.from("transactions").delete().eq("id", i);
        if (error) return console.error(error);
        set({ transactions: memory.transactions.filter(x => x.id !== i) });
        if (tx) {
          reverseSideEffects(tx);
          await dropInstallmentForTx(tx);
        }
      }
    },

    // ---------- CATEGORIES ----------
    addCategory: async (c: Omit<Category, "id">) => {
      const uid = memory.currentUserId; if (!uid) return;
      const { data, error } = await supabase.from("categories").insert({ user_id: uid, name: c.name, color: c.color, icon: c.icon ?? null, kind: c.kind ?? "expense", budget_group: c.budgetGroup ?? null }).select("*").single();
      if (error || !data) return console.error(error);
      set({ categories: [...memory.categories, mapCat(data as Record<string, unknown>)] });
    },
    updateCategory: async (i: string, p: Partial<Category>) => {
      const patch: Record<string, unknown> = {};
      if (p.name !== undefined) patch.name = p.name;
      if (p.color !== undefined) patch.color = p.color;
      if (p.icon !== undefined) patch.icon = p.icon || null;
      if (p.kind !== undefined) patch.kind = p.kind;
      if (p.budgetGroup !== undefined) patch.budget_group = p.budgetGroup;
      const { error } = await supabase.from("categories").update(patch as never).eq("id", i);
      if (error) { notifyToast("Não foi possível salvar a categoria."); return; }
      set({ categories: memory.categories.map(x => x.id === i ? { ...x, ...p } : x) });
    },
    removeCategory: async (i: string) => {
      const cat = memory.categories.find(c => c.id === i);
      if (cat && LOCKED_CATEGORY_NAMES.includes(cat.name.trim().toLowerCase())) {
        console.warn(`Categoria padrão "${cat.name}" não pode ser apagada.`);
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

    // ---------- ASSINATURAS ----------
    addSubscription: async (input: Omit<Subscription, "id" | "createdAt">) => {
      const uid = memory.currentUserId; if (!uid) return null;
      const category = memory.categories.find(c => c.name.trim().toLowerCase() === "assinaturas");
      const { data, error } = await supabase.from("subscriptions").insert({
        user_id: uid, name: input.name, amount: input.amount, first_charge_date: input.firstChargeDate,
        recurrence_months: input.recurrenceMonths, color: input.color, icon: input.icon,
        essential: input.essential, active: input.active,
      }).select("*").single();
      if (error || !data) { console.error(error); return null; }
      const subscription = mapSubscription(data as Record<string, unknown>);
      const dates = recurringDates(input.firstChargeDate, input.recurrenceMonths);
      const rows = dates.map(date => ({
        user_id: uid, type: "expense", amount: input.amount, description: input.name, date,
        category_id: category?.id ?? null, essential: input.essential, payment_method: null,
        subscription_id: subscription.id, tag: `${SUBSCRIPTION_TAG_PREFIX}${subscription.id}`,
        applied_to_balance: false,
      }));
      const { data: txData, error: txError } = rows.length
        ? await supabase.from("transactions").insert(rows as never).select("*")
        : { data: [], error: null };
      if (txError) { console.error(txError); await supabase.from("subscriptions").delete().eq("id", subscription.id); return null; }
      const inserted = (txData ?? []).map(r => mapTx(r as Record<string, unknown>));
      set({
        subscriptions: [...memory.subscriptions, subscription],
        transactions: [...inserted, ...memory.transactions].sort((a, b) => b.date.localeCompare(a.date)),
      });
      return subscription;
    },
    updateSubscription: async (subscriptionId: string, patch: Partial<Omit<Subscription, "id" | "createdAt">>) => {
      const current = memory.subscriptions.find(s => s.id === subscriptionId); if (!current) return false;
      const dbPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) dbPatch.name = patch.name;
      if (patch.amount !== undefined) dbPatch.amount = patch.amount;
      if (patch.firstChargeDate !== undefined) dbPatch.first_charge_date = patch.firstChargeDate;
      if (patch.recurrenceMonths !== undefined) dbPatch.recurrence_months = patch.recurrenceMonths;
      if (patch.color !== undefined) dbPatch.color = patch.color;
      if (patch.icon !== undefined) dbPatch.icon = patch.icon;
      if (patch.essential !== undefined) dbPatch.essential = patch.essential;
      if (patch.active !== undefined) dbPatch.active = patch.active;
      if (patch.usageFrequency !== undefined) dbPatch.usage_frequency = patch.usageFrequency;
      if (patch.importance !== undefined) dbPatch.importance = patch.importance;
      const { error } = await supabase.from("subscriptions").update(dbPatch as never).eq("id", subscriptionId);
      if (error) { console.error(error); return false; }
      const next = { ...current, ...patch };
      const today = new Date().toISOString().slice(0, 10);
      await supabase.from("transactions").delete().eq("subscription_id", subscriptionId).gte("date", today);
      let inserted: Transaction[] = [];
      if (next.active) {
        const category = memory.categories.find(c => c.name.trim().toLowerCase() === "assinaturas");
        const existingDates = new Set(memory.transactions.filter(t => t.subscriptionId === subscriptionId && t.date < today).map(t => t.date));
        const rows = recurringDates(next.firstChargeDate, next.recurrenceMonths)
          .filter(date => date >= today && !existingDates.has(date))
          .map(date => ({
            user_id: memory.currentUserId, type: "expense", amount: next.amount, description: next.name, date,
            category_id: category?.id ?? null, essential: next.essential, payment_method: null,
            subscription_id: subscriptionId, tag: `${SUBSCRIPTION_TAG_PREFIX}${subscriptionId}`, applied_to_balance: false,
          }));
        if (rows.length) {
          const { data } = await supabase.from("transactions").insert(rows as never).select("*");
          inserted = (data ?? []).map(r => mapTx(r as Record<string, unknown>));
        }
      }
      const historical = memory.transactions.map(t => t.subscriptionId === subscriptionId && t.date < today
        ? { ...t, description: next.name, essential: next.essential }
        : t).filter(t => t.subscriptionId !== subscriptionId || t.date < today);
      if (patch.name !== undefined || patch.essential !== undefined) {
        await supabase.from("transactions").update({ description: next.name, essential: next.essential }).eq("subscription_id", subscriptionId).lt("date", today);
      }
      set({ subscriptions: memory.subscriptions.map(s => s.id === subscriptionId ? next : s), transactions: [...inserted, ...historical].sort((a, b) => b.date.localeCompare(a.date)) });
      return true;
    },
    removeSubscription: async (subscriptionId: string) => {
      const today = new Date().toISOString().slice(0, 10);
      await supabase.from("transactions").delete().eq("subscription_id", subscriptionId).gte("date", today);
      const { error } = await supabase.from("subscriptions").delete().eq("id", subscriptionId);
      if (error) { console.error(error); return false; }
      set({
        subscriptions: memory.subscriptions.filter(s => s.id !== subscriptionId),
        transactions: memory.transactions.filter(t => t.subscriptionId !== subscriptionId || t.date < today).map(t => t.subscriptionId === subscriptionId ? { ...t, subscriptionId: undefined } : t),
      });
      return true;
    },

    // Upgrade/downgrade: aplica o novo valor a partir do mês escolhido (inclusive meses passados).
    changeSubscriptionPlan: async (subscriptionId: string, amount: number, fromMonth: string) => {
      const from = `${fromMonth}-01`;
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from("transactions").update({ amount }).eq("subscription_id", subscriptionId).gte("date", from).lt("date", today);
      if (error) { console.error(error); return false; }
      set({ transactions: memory.transactions.map(t => t.subscriptionId === subscriptionId && t.date >= from && t.date < today ? { ...t, amount } : t) });
      return api.updateSubscription(subscriptionId, { amount });
    },

    // ---------- DÍVIDAS ----------
    // Cria a dívida, gera um gasto para cada parcela na data escolhida e vincula
    // os dois. Parcelas com data já vencida debitam o banco na hora; as futuras
    // são debitadas automaticamente quando a data chegar (ver loadAll).
    addDebt: async (input: {
      name: string; icon: string; color: string; totalAmount: number;
      bankId?: string; categoryId?: string; note?: string;
      installments: { number: number; amount: number; dueDate: string }[];
    }) => {
      const uid = memory.currentUserId; if (!uid) return null;
      const { data: debtRow, error } = await supabase.from("debts").insert({
        user_id: uid, name: input.name, icon: input.icon, color: input.color,
        total_amount: input.totalAmount, installments_total: input.installments.length,
        bank_id: input.bankId ?? null, category_id: input.categoryId ?? null, note: input.note ?? null,
      }).select("*").single();
      if (error || !debtRow) { console.error(error); return null; }
      const debtId = String((debtRow as Record<string, unknown>).id);
      const todayStr = new Date().toISOString().slice(0, 10);
      const total = input.installments.length;

      const txRows = input.installments.map(p => ({
        user_id: uid, type: "expense", amount: p.amount,
        description: `${input.name} (${p.number}/${total})`,
        date: p.dueDate,
        category_id: input.categoryId ?? null,
        bank_id: input.bankId ?? null,
        card_id: null,
        essential: "essential",
        payment_method: input.bankId ? "debit" : null,
        installment_no: p.number, installment_total: total,
        installment_group_id: null,
        tag: `${DEBT_TAG_PREFIX}${debtId}`,
        applied_to_balance: p.dueDate <= todayStr,
      }));
      const { data: txData, error: txErr } = await supabase.from("transactions").insert(txRows as never).select("*");
      if (txErr) console.error(txErr);
      const insertedTx = (txData ?? []).map(r => mapTx(r as Record<string, unknown>));

      const instRows = input.installments.map((p, i) => ({
        user_id: uid, debt_id: debtId, number: p.number, amount: p.amount,
        due_date: p.dueDate, paid: p.dueDate <= todayStr,
        transaction_id: insertedTx[i]?.id ?? null,
      }));
      const { data: instData } = await supabase.from("debt_installments").insert(instRows as never).select("*");
      const installments = (instData ?? []).map(r => mapDebtInstallment(r as Record<string, unknown>));

      // Debita do banco as parcelas que já venceram
      if (input.bankId) {
        const dueNow = insertedTx.filter(t => t.date <= todayStr).reduce((s, t) => s + t.amount, 0);
        const bank = memory.banks.find(b => b.id === input.bankId);
        if (bank && dueNow > 0) {
          const newBalance = bank.accountBalance - dueNow;
          await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
          set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
        }
      }

      const debt = mapDebt(debtRow as Record<string, unknown>, installments);
      set({
        debts: [...memory.debts, debt],
        transactions: [...insertedTx, ...memory.transactions].sort((a, b) => b.date.localeCompare(a.date)),
      });
      try { await api.awardMission("add_expense"); } catch {}
      return debt;
    },
    reorderDebts: async (ids: string[]) => {
      const uid = memory.currentUserId; if (!uid) return false;
      const results = await Promise.all(ids.map((id, index) => supabase.from("debts").update({ sort_order: index }).eq("id", id).eq("user_id", uid)));
      if (results.some(result => result.error)) { notifyToast("Não foi possível salvar a ordem. Tente novamente."); return false; }
      const positions = new Map(ids.map((id, index) => [id, index]));
      set({ debts: memory.debts.map(item => ({ ...item, sortOrder: positions.get(item.id) ?? item.sortOrder })) });
      return true;
    },
    updateDebt: async (debtId: string, p: Partial<Pick<Debt, "name" | "icon" | "color" | "note" | "bankId" | "categoryId" | "archived">>) => {
      const patch: Record<string, unknown> = {};
      if (p.archived !== undefined) patch.archived = p.archived;
      if (p.name !== undefined) patch.name = p.name;
      if (p.icon !== undefined) patch.icon = p.icon;
      if (p.color !== undefined) patch.color = p.color;
      if (p.note !== undefined) patch.note = p.note || null;
      if (p.bankId !== undefined) patch.bank_id = p.bankId || null;
      if (p.categoryId !== undefined) patch.category_id = p.categoryId || null;
      const { error } = await supabase.from("debts").update(patch as never).eq("id", debtId);
      if (error) { console.error(error); return false; }
      set({ debts: memory.debts.map(d => d.id === debtId ? { ...d, ...p } : d) });
      // Renomeia os gastos vinculados às parcelas
      if (p.name !== undefined) {
        const debt = memory.debts.find(d => d.id === debtId);
        if (debt) {
          const totalInst = debt.installments.length;
          for (const inst of debt.installments) {
            if (!inst.transactionId) continue;
            const desc = `${p.name} (${inst.number}/${totalInst})`;
            await supabase.from("transactions").update({ description: desc }).eq("id", inst.transactionId);
            set({ transactions: memory.transactions.map(t => t.id === inst.transactionId ? { ...t, description: desc } : t) });
          }
        }
      }
      return true;
    },

    removeDebt: async (debtId: string) => {
      const debt = memory.debts.find(d => d.id === debtId);
      if (!debt) return;
      const txIds = debt.installments.map(i => i.transactionId).filter(Boolean) as string[];
      // Estorna o que já foi debitado do banco
      if (debt.bankId) {
        const back = memory.transactions
          .filter(t => txIds.includes(t.id) && t.appliedToBalance)
          .reduce((s, t) => s + t.amount, 0);
        const bank = memory.banks.find(b => b.id === debt.bankId);
        if (bank && back > 0) {
          const newBalance = bank.accountBalance + back;
          await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
          set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
        }
      }
      if (txIds.length) await supabase.from("transactions").delete().in("id", txIds);
      const { error } = await supabase.from("debts").delete().eq("id", debtId);
      if (error) return console.error(error);
      set({
        debts: memory.debts.filter(d => d.id !== debtId),
        transactions: memory.transactions.filter(t => !txIds.includes(t.id)),
      });
    },
    // Marca/desmarca uma parcela como paga e sincroniza o gasto vinculado.
    setInstallmentPaid: async (debtId: string, instId: string, paid: boolean) => {
      const debt = memory.debts.find(d => d.id === debtId);
      const inst = debt?.installments.find(i => i.id === instId);
      if (!debt || !inst) return;
      // Ao marcar como paga, a data da parcela passa a ser o dia da marcação
      const today = new Date().toISOString().slice(0, 10);
      const newDue = paid ? today : inst.dueDate;
      const { error: paidError } = await supabase.from("debt_installments").update({ paid, due_date: newDue }).eq("id", instId);
      if (paidError) { notifyToast("Não foi possível confirmar o pagamento."); throw paidError; }
      set({
        debts: memory.debts.map(d => d.id !== debtId ? d : {
          ...d, installments: d.installments.map(i => i.id === instId ? { ...i, paid, dueDate: newDue } : i),
        }),
      });
      const tx = inst.transactionId ? memory.transactions.find(t => t.id === inst.transactionId) : undefined;
      if (!tx) return;
      if (paid && tx.date !== today) {
        await supabase.from("transactions").update({ date: today }).eq("id", tx.id);
        set({ transactions: memory.transactions.map(t => t.id === tx.id ? { ...t, date: today } : t) });
      }
      // Antecipa/estorna o débito no banco conforme a marcação manual
      if (paid && !tx.appliedToBalance) {
        if (debt.bankId) {
          const bank = memory.banks.find(b => b.id === debt.bankId);
          if (bank) {
            const newBalance = bank.accountBalance - tx.amount;
            await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
            set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
          }
        }
        await supabase.from("transactions").update({ applied_to_balance: true }).eq("id", tx.id);
        set({ transactions: memory.transactions.map(t => t.id === tx.id ? { ...t, appliedToBalance: true } : t) });
      } else if (!paid && tx.appliedToBalance) {
        if (debt.bankId) {
          const bank = memory.banks.find(b => b.id === debt.bankId);
          if (bank) {
            const newBalance = bank.accountBalance + tx.amount;
            await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
            set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
          }
        }
        await supabase.from("transactions").update({ applied_to_balance: false }).eq("id", tx.id);
        set({ transactions: memory.transactions.map(t => t.id === tx.id ? { ...t, appliedToBalance: false } : t) });
      }
    },
    // Ajusta valor/data de uma parcela e reflete no gasto vinculado.
    updateInstallment: async (debtId: string, instId: string, p: { amount?: number; dueDate?: string }) => {
      const debt = memory.debts.find(d => d.id === debtId);
      const inst = debt?.installments.find(i => i.id === instId);
      if (!debt || !inst) return;
      const patch: Record<string, unknown> = {};
      if (p.amount !== undefined) patch.amount = p.amount;
      if (p.dueDate !== undefined) patch.due_date = p.dueDate;
      const { error: installmentError } = await supabase.from("debt_installments").update(patch as never).eq("id", instId);
      if (installmentError) throw installmentError;
      set({
        debts: memory.debts.map(d => d.id !== debtId ? d : {
          ...d,
          installments: d.installments.map(i => i.id === instId ? { ...i, ...p } : i),
          totalAmount: d.installments.reduce((s, i) => s + (i.id === instId && p.amount !== undefined ? p.amount : i.amount), 0),
        }),
      });
      if (inst.transactionId) {
        const tx = memory.transactions.find(t => t.id === inst.transactionId);
        const txPatch: Record<string, unknown> = {};
        if (p.amount !== undefined) txPatch.amount = p.amount;
        if (p.dueDate !== undefined) txPatch.date = p.dueDate;
        const { error: transactionError } = await supabase.from("transactions").update(txPatch as never).eq("id", inst.transactionId);
        if (transactionError) throw transactionError;
        set({ transactions: memory.transactions.map(t => t.id === inst.transactionId ? { ...t, ...(p.amount !== undefined ? { amount: p.amount } : {}), ...(p.dueDate !== undefined ? { date: p.dueDate } : {}) } : t) });
        // Ajusta o saldo do banco quando o valor muda e o gasto já foi debitado
        if (p.amount !== undefined && tx?.appliedToBalance && debt.bankId) {
          const diff = p.amount - tx.amount;
          const bank = memory.banks.find(b => b.id === debt.bankId);
          if (bank && diff !== 0) {
            const newBalance = bank.accountBalance - diff;
            await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
            set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
          }
        }
      }
      const newTotal = (memory.debts.find(d => d.id === debtId)?.installments ?? []).reduce((s, i) => s + i.amount, 0);
      await supabase.from("debts").update({ total_amount: newTotal }).eq("id", debtId);
    },


    // ============= DEVEDORES (valores a receber) =============
    addReceivable: async (input: {
      name: string; icon: string; color: string; totalAmount: number;
      bankId?: string; categoryId?: string; note?: string;
      installments: { number: number; amount: number; dueDate: string }[];
    }) => {
      const uid = memory.currentUserId; if (!uid) return null;
      const { data: recvRow, error } = await supabase.from("receivables").insert({
        user_id: uid, name: input.name, icon: input.icon, color: input.color,
        total_amount: input.totalAmount, installments_total: input.installments.length,
        bank_id: input.bankId ?? null, category_id: input.categoryId ?? null, note: input.note ?? null,
      }).select("*").single();
      if (error || !recvRow) { console.error(error); return null; }
      const recvId = String((recvRow as Record<string, unknown>).id);
      const todayStr = new Date().toISOString().slice(0, 10);
      const total = input.installments.length;

      const txRows = input.installments.map(p => ({
        user_id: uid, type: "income", amount: p.amount,
        description: `${input.name} (${p.number}/${total})`,
        date: p.dueDate,
        category_id: input.categoryId ?? null,
        bank_id: input.bankId ?? null,
        card_id: null,
        essential: null,
        payment_method: input.bankId ? null : "cash",
        installment_no: p.number, installment_total: total,
        installment_group_id: null,
        tag: `${RECEIVABLE_TAG_PREFIX}${recvId}`,
        applied_to_balance: Boolean(input.bankId) && p.dueDate <= todayStr,
      }));
      const { data: txData, error: txErr } = await supabase.from("transactions").insert(txRows as never).select("*");
      if (txErr) console.error(txErr);
      const insertedTx = (txData ?? []).map(r => mapTx(r as Record<string, unknown>));

      const instRows = input.installments.map((p, i) => ({
        user_id: uid, receivable_id: recvId, number: p.number, amount: p.amount,
        due_date: p.dueDate, received: p.dueDate <= todayStr,
        transaction_id: insertedTx[i]?.id ?? null,
      }));
      const { data: instData } = await supabase.from("receivable_installments").insert(instRows as never).select("*");
      const installments = (instData ?? []).map(r => mapReceivableInstallment(r as Record<string, unknown>));

      // Credita no banco as parcelas cuja data já chegou
      if (input.bankId) {
        const dueNow = insertedTx.filter(t => t.date <= todayStr).reduce((s, t) => s + t.amount, 0);
        const bank = memory.banks.find(b => b.id === input.bankId);
        if (bank && dueNow > 0) {
          const newBalance = bank.accountBalance + dueNow;
          await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
          set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
        }
      }

      const receivable = mapReceivable(recvRow as Record<string, unknown>, installments);
      set({
        receivables: [...memory.receivables, receivable],
        transactions: [...insertedTx, ...memory.transactions].sort((a, b) => b.date.localeCompare(a.date)),
      });
      return receivable;
    },
    reorderReceivables: async (ids: string[]) => {
      const uid = memory.currentUserId; if (!uid) return false;
      const results = await Promise.all(ids.map((id, index) => supabase.from("receivables").update({ sort_order: index }).eq("id", id).eq("user_id", uid)));
      if (results.some(result => result.error)) { notifyToast("Não foi possível salvar a ordem. Tente novamente."); return false; }
      const positions = new Map(ids.map((id, index) => [id, index]));
      set({ receivables: memory.receivables.map(item => ({ ...item, sortOrder: positions.get(item.id) ?? item.sortOrder })) });
      return true;
    },
    updateReceivable: async (recvId: string, p: Partial<Pick<Receivable, "name" | "icon" | "color" | "note" | "bankId" | "categoryId" | "archived">>) => {
      const patch: Record<string, unknown> = {};
      if (p.archived !== undefined) patch.archived = p.archived;
      if (p.name !== undefined) patch.name = p.name;
      if (p.icon !== undefined) patch.icon = p.icon;
      if (p.color !== undefined) patch.color = p.color;
      if (p.note !== undefined) patch.note = p.note || null;
      if (p.bankId !== undefined) patch.bank_id = p.bankId || null;
      if (p.categoryId !== undefined) patch.category_id = p.categoryId || null;
      const { error } = await supabase.from("receivables").update(patch as never).eq("id", recvId);
      if (error) { console.error(error); return false; }
      set({ receivables: memory.receivables.map(d => d.id === recvId ? { ...d, ...p } : d) });
      // Renomeia os ganhos vinculados às parcelas
      if (p.name !== undefined) {
        const recv = memory.receivables.find(d => d.id === recvId);
        if (recv) {
          const totalInst = recv.installments.length;
          for (const inst of recv.installments) {
            if (!inst.transactionId) continue;
            const desc = `${p.name} (${inst.number}/${totalInst})`;
            await supabase.from("transactions").update({ description: desc }).eq("id", inst.transactionId);
            set({ transactions: memory.transactions.map(t => t.id === inst.transactionId ? { ...t, description: desc } : t) });
          }
        }
      }
      return true;
    },

    removeReceivable: async (recvId: string) => {
      const recv = memory.receivables.find(d => d.id === recvId);
      if (!recv) return;
      const txIds = recv.installments.map(i => i.transactionId).filter(Boolean) as string[];
      if (recv.bankId) {
        const back = memory.transactions
          .filter(t => txIds.includes(t.id) && t.appliedToBalance)
          .reduce((s, t) => s + t.amount, 0);
        const bank = memory.banks.find(b => b.id === recv.bankId);
        if (bank && back > 0) {
          const newBalance = bank.accountBalance - back;
          await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
          set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
        }
      }
      if (txIds.length) await supabase.from("transactions").delete().in("id", txIds);
      const { error } = await supabase.from("receivables").delete().eq("id", recvId);
      if (error) return console.error(error);
      set({
        receivables: memory.receivables.filter(d => d.id !== recvId),
        transactions: memory.transactions.filter(t => !txIds.includes(t.id)),
      });
    },
    setReceivableInstallmentReceived: async (recvId: string, instId: string, received: boolean) => {
      const recv = memory.receivables.find(d => d.id === recvId);
      const inst = recv?.installments.find(i => i.id === instId);
      if (!recv || !inst) return;
      // Ao marcar como recebida, a data da parcela passa a ser o dia da marcação
      const today = new Date().toISOString().slice(0, 10);
      const newDue = received ? today : inst.dueDate;
      const { error: receiveError } = await supabase.from("receivable_installments").update({ received, due_date: newDue }).eq("id", instId);
      if (receiveError) { notifyToast("Não foi possível confirmar o recebimento."); return false; }
      set({
        receivables: memory.receivables.map(d => d.id !== recvId ? d : {
          ...d, installments: d.installments.map(i => i.id === instId ? { ...i, received, dueDate: newDue } : i),
        }),
      });
      const tx = inst.transactionId ? memory.transactions.find(t => t.id === inst.transactionId) : undefined;
      if (!tx) return true;
      if (received && tx.date !== today) {
        await supabase.from("transactions").update({ date: today }).eq("id", tx.id);
        set({ transactions: memory.transactions.map(t => t.id === tx.id ? { ...t, date: today } : t) });
      }
      if (received && !tx.appliedToBalance) {
        if (recv.bankId) {
          const bank = memory.banks.find(b => b.id === recv.bankId);
          if (bank) {
            const newBalance = bank.accountBalance + tx.amount;
            await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
            set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
          }
        }
        await supabase.from("transactions").update({ applied_to_balance: true }).eq("id", tx.id);
        set({ transactions: memory.transactions.map(t => t.id === tx.id ? { ...t, appliedToBalance: true } : t) });
      } else if (!received && tx.appliedToBalance) {
        if (recv.bankId) {
          const bank = memory.banks.find(b => b.id === recv.bankId);
          if (bank) {
            const newBalance = bank.accountBalance - tx.amount;
            await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
            set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
          }
        }
        await supabase.from("transactions").update({ applied_to_balance: false }).eq("id", tx.id);
        set({ transactions: memory.transactions.map(t => t.id === tx.id ? { ...t, appliedToBalance: false } : t) });
      }
      return true;
    },
    updateReceivableInstallment: async (recvId: string, instId: string, p: { amount?: number; dueDate?: string }) => {
      const recv = memory.receivables.find(d => d.id === recvId);
      const inst = recv?.installments.find(i => i.id === instId);
      if (!recv || !inst) return;
      const patch: Record<string, unknown> = {};
      if (p.amount !== undefined) patch.amount = p.amount;
      if (p.dueDate !== undefined) patch.due_date = p.dueDate;
      const { error: installmentError } = await supabase.from("receivable_installments").update(patch as never).eq("id", instId);
      if (installmentError) throw installmentError;
      set({
        receivables: memory.receivables.map(d => d.id !== recvId ? d : {
          ...d,
          installments: d.installments.map(i => i.id === instId ? { ...i, ...p } : i),
          totalAmount: d.installments.reduce((s, i) => s + (i.id === instId && p.amount !== undefined ? p.amount : i.amount), 0),
        }),
      });
      if (inst.transactionId) {
        const tx = memory.transactions.find(t => t.id === inst.transactionId);
        const txPatch: Record<string, unknown> = {};
        if (p.amount !== undefined) txPatch.amount = p.amount;
        if (p.dueDate !== undefined) txPatch.date = p.dueDate;
        const { error: transactionError } = await supabase.from("transactions").update(txPatch as never).eq("id", inst.transactionId);
        if (transactionError) throw transactionError;
        set({ transactions: memory.transactions.map(t => t.id === inst.transactionId ? { ...t, ...(p.amount !== undefined ? { amount: p.amount } : {}), ...(p.dueDate !== undefined ? { date: p.dueDate } : {}) } : t) });
        // Ajusta o saldo do banco quando o valor muda e o ganho já foi creditado
        if (p.amount !== undefined && tx?.appliedToBalance && recv.bankId) {
          const diff = p.amount - tx.amount;
          const bank = memory.banks.find(b => b.id === recv.bankId);
          if (bank && diff !== 0) {
            const newBalance = bank.accountBalance + diff;
            await supabase.from("banks").update({ account_balance: newBalance }).eq("id", bank.id);
            set({ banks: memory.banks.map(b => b.id === bank.id ? { ...b, accountBalance: newBalance } : b) });
          }
        }
      }

      const newTotal = (memory.receivables.find(d => d.id === recvId)?.installments ?? []).reduce((s, i) => s + i.amount, 0);
      await supabase.from("receivables").update({ total_amount: newTotal }).eq("id", recvId);
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
      if (patch.budgetPlan !== undefined) p.budget_plan = patch.budgetPlan;
      if (patch.avatar !== undefined) p.avatar = patch.avatar || null;
      if (patch.gender !== undefined) p.gender = patch.gender;
      if (patch.cashAmount !== undefined) p.cash_amount = patch.cashAmount;
      const { error } = await supabase.from("profiles").update(p as never).eq("id", uid);
      if (error) { notifyToast("Não foi possível salvar suas alterações."); return { ok: false as const }; }
      set({ users: memory.users.map(u => u.id === uid ? { ...u, ...patch } : u) });
      return { ok: true as const };
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
      if (!isTabHidden("/missoes")) try {
        playCheck();
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
      try { playCheck(); } catch { /* noop */ }
    },

    // ---------- BACKUP ----------
    exportData: async (_scope: "user" | "all" = "user") => {
      const user = memory.users.find(u => u.id === memory.currentUserId) ?? null;
      const uid = memory.currentUserId;
      const q = async (t: string) => uid ? ((await supabase.from(t as never).select("*").eq("user_id", uid)).data ?? []) : [];
      const [babyExpenses, babySavings, projects, projectExpenses, projectGoals, subscriptionUsage] = await Promise.all([
        q("baby_expenses"), q("baby_savings"), q("projects"), q("project_expenses"), q("project_goals"), q("subscription_usage_logs"),
      ]);
      const prof = uid ? (await supabase.from("profiles").select("baby_mode,hidden_tabs,yearly_goal,budget_plan").eq("id", uid).maybeSingle()).data : null;
      const local: Record<string, string> = {};
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)!;
          if (k === "cf_state_cache_v1" || k.startsWith("sb-")) continue;
          if (k.startsWith("cf_") || k.startsWith("cf.") || k.startsWith("closefinance")) local[k.replace(uid ?? "§", "{uid}")] = localStorage.getItem(k) ?? "";
        }
      }
      const cards = memory.cards.map(c => ({ ...c, usedManual: c.usedManual ?? 0 }));
      return JSON.stringify({
        app: "CloseFinance", version: 4, exportedAt: new Date().toISOString(),
        data: {
          transactions: memory.transactions,
          categories: memory.categories,
          cards,
          banks: memory.banks,
          debts: memory.debts,
          receivables: memory.receivables,
          subscriptions: memory.subscriptions,
          cashAmount: user?.cashAmount ?? 0,
          user,
          missions: memory.missions,
          babyExpenses, babySavings, projects, projectExpenses, projectGoals, subscriptionUsage,
          profilePrefs: prof, local,
        },
      }, null, 2);
    },
    wipeData: async () => {
      const uid = memory.currentUserId; if (!uid) return { ok: false as const, error: "Você precisa estar logado." };
      try {
        await supabase.from("debt_installments").delete().eq("user_id", uid);
        await supabase.from("receivable_installments").delete().eq("user_id", uid);
        await supabase.from("debts").delete().eq("user_id", uid);
        await supabase.from("receivables").delete().eq("user_id", uid);
        await supabase.from("transactions").delete().eq("user_id", uid);
        await supabase.from("subscriptions").delete().eq("user_id", uid);
        await Promise.all(["baby_expenses", "baby_savings", "projects"].map(t => supabase.from(t as never).delete().eq("user_id", uid)));
        await supabase.from("cards").delete().eq("user_id", uid);
        await supabase.from("banks").delete().eq("user_id", uid);
        // Categorias são mantidas de propósito — inclusive as padrão fixas (Salário, Renda extra, Pagamento de fatura)
        await supabase.from("profiles").update({ cash_amount: 0 } as never).eq("id", uid);
        const { data: u } = await supabase.auth.getUser();
        if (u.user) await loadAll(u.user);
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: "Não foi possível apagar os dados." };
      }
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
        const incomingDebts: Debt[] = Array.isArray(d.debts) ? d.debts : [];
        const incomingRecvs: Receivable[] = Array.isArray(d.receivables) ? d.receivables : [];
        const incomingSubscriptions: Subscription[] = Array.isArray(d.subscriptions) ? d.subscriptions : [];

        if (mode === "replace") {
          await supabase.from("debt_installments").delete().eq("user_id", uid);
          await supabase.from("receivable_installments").delete().eq("user_id", uid);
          await Promise.all([
            supabase.from("debts").delete().eq("user_id", uid),
            supabase.from("receivables").delete().eq("user_id", uid),
            supabase.from("subscriptions").delete().eq("user_id", uid),
            ...["baby_expenses", "baby_savings", "projects"].map(t => supabase.from(t as never).delete().eq("user_id", uid)),
          ]);
          await Promise.all([
            supabase.from("transactions").delete().eq("user_id", uid),
            supabase.from("cards").delete().eq("user_id", uid),
            supabase.from("banks").delete().eq("user_id", uid),
          ]);
          // Categorias padrão (Salário, Renda extra, Pagamento de fatura) são fixas — nunca apagadas
          const removableCatIds = memory.categories
            .filter(c => !LOCKED_CATEGORY_NAMES.includes(c.name.trim().toLowerCase()))
            .map(c => c.id);
          if (removableCatIds.length) await supabase.from("categories").delete().in("id", removableCatIds);
        }
        // Insert categories first (so tx FK works); remap ids
        const catIdMap = new Map<string, string>();
        const existingCats = mode === "merge" ? memory.categories : memory.categories.filter(c => LOCKED_CATEGORY_NAMES.includes(c.name.trim().toLowerCase()));
        const existingCards = mode === "merge" ? memory.cards : [];
        const existingBanks = mode === "merge" ? memory.banks : [];
        const norm = (s: string) => s.trim().toLowerCase();

        for (const c of incomingCats) {
          const dup = existingCats.find(x => norm(x.name) === norm(c.name));
          if (dup) {
            catIdMap.set(c.id, dup.id);
            if (c.budgetGroup !== undefined) await supabase.from("categories").update({ budget_group: isBudgetGroup(c.budgetGroup) ? c.budgetGroup : null }).eq("id", dup.id);
            continue;
          }
          const { data } = await supabase.from("categories").insert({ user_id: uid, name: c.name, color: c.color, icon: c.icon ?? null, kind: c.kind ?? "expense", budget_group: isBudgetGroup(c.budgetGroup) ? c.budgetGroup : null }).select("id").single();
          if (data) catIdMap.set(c.id, String((data as Record<string, unknown>).id));
        }
        const cardIdMap = new Map<string, string>();
        for (const c of incomingCards) {
          const dup = existingCards.find(x => norm(x.name) === norm(c.name));
          if (dup) {
            await supabase.from("cards").update({
              limit_amount: c.limit, closing_day: c.closingDay, due_day: c.dueDay, color: c.color,
              used_manual: c.usedManual ?? 0,
            } as never).eq("id", dup.id);
            cardIdMap.set(c.id, dup.id);
            continue;
          }
          const { data } = await supabase.from("cards").insert({ user_id: uid, name: c.name, limit_amount: c.limit, closing_day: c.closingDay, due_day: c.dueDay, color: c.color, used_manual: c.usedManual ?? 0 } as never).select("id").single();
          if (data) cardIdMap.set(c.id, String((data as Record<string, unknown>).id));
        }
        const bankIdMap = new Map<string, string>();
        for (const b of incomingBanks) {
          const dup = existingBanks.find(x => norm(x.name) === norm(b.name));
          if (dup) {
            await supabase.from("banks").update({ color: b.color, account_balance: b.accountBalance ?? 0, saved_amount: b.savedAmount ?? 0, note: b.note ?? null } as never).eq("id", dup.id);
            bankIdMap.set(b.id, dup.id);
            continue;
          }
          const { data } = await supabase.from("banks").insert({ user_id: uid, name: b.name, color: b.color, account_balance: b.accountBalance ?? 0, saved_amount: b.savedAmount ?? 0, note: b.note ?? null }).select("id").single();
          if (data) bankIdMap.set(b.id, String((data as Record<string, unknown>).id));
        }

        // Dívidas e devedores (cabeçalhos) — antes das transações para remapear as tags
        const existingDebts = mode === "merge" ? memory.debts : [];
        const existingRecvs = mode === "merge" ? memory.receivables : [];
        const debtIdMap = new Map<string, string>();
        for (const dv of incomingDebts) {
          const dup = existingDebts.find(x => norm(x.name) === norm(dv.name));
          if (dup) { debtIdMap.set(dv.id, dup.id); continue; }
          const { data } = await supabase.from("debts").insert({
            user_id: uid, name: dv.name, icon: dv.icon ?? "wallet", color: dv.color ?? "#540BD3",
            total_amount: dv.totalAmount, installments_total: dv.installmentsTotal ?? (dv.installments?.length ?? 0),
            bank_id: dv.bankId ? bankIdMap.get(dv.bankId) ?? null : null,
            category_id: dv.categoryId ? catIdMap.get(dv.categoryId) ?? null : null,
            note: dv.note ?? null, sort_order: dv.sortOrder ?? 0, archived: dv.archived ?? false, created_at: dv.createdAt || new Date().toISOString(),
          }).select("id").single();
          if (data) debtIdMap.set(dv.id, String((data as Record<string, unknown>).id));
        }
        const recvIdMap = new Map<string, string>();
        for (const rv of incomingRecvs) {
          const dup = existingRecvs.find(x => norm(x.name) === norm(rv.name));
          if (dup) { recvIdMap.set(rv.id, dup.id); continue; }
          const { data } = await supabase.from("receivables").insert({
            user_id: uid, name: rv.name, icon: rv.icon ?? "wallet", color: rv.color ?? "#2BD9A1",
            total_amount: rv.totalAmount, installments_total: rv.installmentsTotal ?? (rv.installments?.length ?? 0),
            bank_id: rv.bankId ? bankIdMap.get(rv.bankId) ?? null : null,
            category_id: rv.categoryId ? catIdMap.get(rv.categoryId) ?? null : null,
            note: rv.note ?? null, sort_order: rv.sortOrder ?? 0, archived: rv.archived ?? false, created_at: rv.createdAt || new Date().toISOString(),
          }).select("id").single();
          if (data) recvIdMap.set(rv.id, String((data as Record<string, unknown>).id));
        }

        const subscriptionIdMap = new Map<string, string>();
        const existingSubscriptions = mode === "merge" ? memory.subscriptions : [];
        for (const sub of incomingSubscriptions) {
          const dup = existingSubscriptions.find(x => norm(x.name) === norm(sub.name));
          if (dup) { subscriptionIdMap.set(sub.id, dup.id); continue; }
          const { data } = await supabase.from("subscriptions").insert({
            user_id: uid, name: sub.name, amount: sub.amount, first_charge_date: sub.firstChargeDate,
            recurrence_months: sub.recurrenceMonths, color: sub.color, icon: sub.icon,
            essential: sub.essential, active: sub.active,
            usage_frequency: sub.usageFrequency ?? "monthly", importance: sub.importance ?? "important",
          }).select("id").single();
          if (data) subscriptionIdMap.set(sub.id, String((data as Record<string, unknown>).id));
        }

        type Row = Record<string, unknown>;
        const arr = (x: unknown): Row[] => Array.isArray(x) ? x as Row[] : [];
        const projIdMap = new Map<string, string>();
        const projExpIdMap = new Map<string, string>();
        for (const pr of arr(d.projects)) {
          const { data } = await supabase.from("projects").insert({ user_id: uid, name: String(pr.name ?? ""), description: String(pr.description ?? ""), cover: (pr.cover as string) ?? null, target_date: (pr.target_date as string) ?? null, sort_order: Number(pr.sort_order ?? 0) }).select("id").single();
          if (data) projIdMap.set(String(pr.id), data.id);
        }
        for (const e of arr(d.projectExpenses)) {
          const pid = projIdMap.get(String(e.project_id)); if (!pid) continue;
          const { data } = await supabase.from("project_expenses").insert({ user_id: uid, project_id: pid, name: String(e.name ?? ""), amount: Number(e.amount ?? 0), date: String(e.date), include_in_expenses: Boolean(e.include_in_expenses) }).select("id").single();
          if (data) projExpIdMap.set(String(e.id), data.id);
        }
        const goalRows = arr(d.projectGoals).filter(g => projIdMap.has(String(g.project_id))).map(g => ({ user_id: uid, project_id: projIdMap.get(String(g.project_id))!, title: String(g.title ?? ""), description: String(g.description ?? ""), date: (g.date as string) ?? null, done: Boolean(g.done), icon: String(g.icon ?? "target"), link: (g.link as string) ?? null }));
        if (goalRows.length) await supabase.from("project_goals").insert(goalRows);
        const babyRows = arr(d.babyExpenses).map(b => ({ user_id: uid, name: String(b.name ?? ""), amount: Number(b.amount ?? 0), date: String(b.date), essential: String(b.essential ?? "essential"), category_id: b.category_id ? catIdMap.get(String(b.category_id)) ?? null : null, payment_method: String(b.payment_method ?? "pix") }));
        if (babyRows.length) await supabase.from("baby_expenses").insert(babyRows);
        const savRows = arr(d.babySavings).map(b => ({ user_id: uid, month: String(b.month), amount: Number(b.amount ?? 0), note: (b.note as string) ?? null }));
        if (savRows.length) await supabase.from("baby_savings").insert(savRows);
        const usageRows = arr(d.subscriptionUsage).filter(u => subscriptionIdMap.has(String(u.subscription_id))).map(u => ({ user_id: uid, subscription_id: subscriptionIdMap.get(String(u.subscription_id))!, week_start: String(u.week_start), level: String(u.level) }));
        if (usageRows.length) await supabase.from("subscription_usage_logs").upsert(usageRows, { onConflict: "subscription_id,week_start" });
        if (d.profilePrefs && typeof d.profilePrefs === "object") {
          const pp = d.profilePrefs as Row;
          await supabase.from("profiles").update({ baby_mode: Boolean(pp.baby_mode), hidden_tabs: Array.isArray(pp.hidden_tabs) ? pp.hidden_tabs as string[] : [], yearly_goal: pp.yearly_goal != null ? Number(pp.yearly_goal) : null } as never).eq("id", uid);
        }
        const importedPlan = d.profilePrefs?.budget_plan ?? d.user?.budgetPlan;
        if (importedPlan) {
          const incomingPlan = readBudgetPlan(importedPlan);
          const previousPlan = memory.users.find(u => u.id === uid)?.budgetPlan;
          const budgetPlan = mode === "merge" ? { months: { ...previousPlan?.months, ...incomingPlan.months } } : incomingPlan;
          await supabase.from("profiles").update({ budget_plan: budgetPlan } as never).eq("id", uid);
        }
        if (d.local && typeof d.local === "object" && typeof window !== "undefined") {
          for (const [k, v] of Object.entries(d.local as Record<string, string>)) {
            const key = k.replace("{uid}", uid);
            if (mode === "merge" && key.startsWith("cf_ext_purchases_")) {
              try { const cur = JSON.parse(localStorage.getItem(key) || "[]"); const inc = JSON.parse(v || "[]"); const ids = new Set(cur.map((x: { id: string }) => x.id)); localStorage.setItem(key, JSON.stringify([...cur, ...inc.filter((x: { id: string }) => !ids.has(x.id))])); } catch { /* ignore */ }
            } else localStorage.setItem(key, v);
          }
        }

        const remapTag = (tag?: string | null): string | null => {
          if (!tag) return null;
          if (tag.startsWith(SUBSCRIPTION_TAG_PREFIX)) {
            const id = subscriptionIdMap.get(tag.slice(SUBSCRIPTION_TAG_PREFIX.length));
            return id ? `${SUBSCRIPTION_TAG_PREFIX}${id}` : null;
          }
          if (tag.startsWith("__pj__:")) {
            const id = projExpIdMap.get(tag.slice(7));
            return id ? `__pj__:${id}` : null;
          }
          if (tag.startsWith(INVOICE_PAYMENT_TAG_PREFIX)) {
            const rest = tag.slice(INVOICE_PAYMENT_TAG_PREFIX.length);
            const [cid, ...u] = rest.split("|");
            const nid = cardIdMap.get(cid) ?? cid;
            return `${INVOICE_PAYMENT_TAG_PREFIX}${nid}${u.length ? "|" + u.join("|") : ""}`;
          }
          if (tag.startsWith(DEBT_TAG_PREFIX)) {
            const id = debtIdMap.get(tag.slice(DEBT_TAG_PREFIX.length));
            return id ? `${DEBT_TAG_PREFIX}${id}` : null;
          }
          if (tag.startsWith(RECEIVABLE_TAG_PREFIX)) {
            const id = recvIdMap.get(tag.slice(RECEIVABLE_TAG_PREFIX.length));
            return id ? `${RECEIVABLE_TAG_PREFIX}${id}` : null;
          }
          return tag;
        };

        const txIdMap = new Map<string, string>();
        if (incomingTx.length) {
          const rows = incomingTx.map(t => ({
            user_id: uid, type: t.type, amount: t.amount, description: t.description ?? "",
            date: t.date, category_id: t.categoryId ? catIdMap.get(t.categoryId) ?? null : null,
            card_id: t.cardId ? cardIdMap.get(t.cardId) ?? null : null,
            bank_id: t.bankId ? bankIdMap.get(t.bankId) ?? null : null,
            essential: t.essential ?? null, payment_method: t.paymentMethod ?? null,
            installment_no: t.installmentNo ?? null, installment_total: t.installmentTotal ?? null,
            installment_group_id: null, tag: remapTag(t.tag),
            subscription_id: t.subscriptionId ? subscriptionIdMap.get(t.subscriptionId) ?? null : null,
            applied_to_balance: t.appliedToBalance ?? false,
          }));
          const { data: txData } = await supabase.from("transactions").insert(rows as never).select("id");
          const ids = (txData ?? []) as Record<string, unknown>[];
          incomingTx.forEach((t, i) => { const nid = ids[i]?.id; if (nid) txIdMap.set(t.id, String(nid)); });
        }

        // Parcelas de dívidas e devedores
        const debtInstRows = incomingDebts.flatMap(dv => {
          const newDebtId = debtIdMap.get(dv.id);
          if (!newDebtId || !Array.isArray(dv.installments)) return [];
          return dv.installments.map(i => ({
            user_id: uid, debt_id: newDebtId, number: i.number, amount: i.amount,
            due_date: i.dueDate, paid: Boolean(i.paid),
            transaction_id: i.transactionId ? txIdMap.get(i.transactionId) ?? null : null,
          }));
        });
        if (debtInstRows.length) await supabase.from("debt_installments").insert(debtInstRows as never);

        const recvInstRows = incomingRecvs.flatMap(rv => {
          const newRecvId = recvIdMap.get(rv.id);
          if (!newRecvId || !Array.isArray(rv.installments)) return [];
          return rv.installments.map(i => ({
            user_id: uid, receivable_id: newRecvId, number: i.number, amount: i.amount,
            due_date: i.dueDate, received: Boolean(i.received),
            transaction_id: i.transactionId ? txIdMap.get(i.transactionId) ?? null : null,
          }));
        });
        if (recvInstRows.length) await supabase.from("receivable_installments").insert(recvInstRows as never);

        // Dinheiro físico
        if (typeof d.cashAmount === "number") {
          await supabase.from("profiles").update({ cash_amount: d.cashAmount } as never).eq("id", uid);
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
