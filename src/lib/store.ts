import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";
import { playCheck, playMissionComplete } from "@/lib/sound";
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
  appliedToBalance?: boolean;
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
    avatar: (p.avatar as string) ?? undefined,
    gender: ((p.gender as Gender) ?? "other"),
    cashAmount: p.cash_amount != null ? Number(p.cash_amount) : 0,
    friendCode: (p.friend_code as string) ?? undefined,
    createdAt: (p.created_at as string) ?? supa.created_at,
  };
}

// ============= CATEGORIAS PADRÃO (fixas) =============
export const DEFAULT_CATEGORIES = [
  { name: "Salário", color: "#2BD9A1", kind: "income", icon: "money" },
  { name: "Renda extra", color: "#22C3CC", kind: "income", icon: "coins" },
  { name: "Adiantamento/Pagamento de fatura", color: "#2BD9A1", kind: "expense", icon: null },
] as const;
export const LOCKED_CATEGORY_NAMES: string[] = DEFAULT_CATEGORIES.map(c => c.name.toLowerCase());

// ============= LOAD =============
async function loadAll(supaUser: SupaUser) {
  set({ loading: true });
  const uid = supaUser.id;
  const today = new Date().toISOString().slice(0, 10);
  const [profileR, catsR, cardsR, banksR, txR, missR, debtsR, debtInstR, recvR, recvInstR] = await Promise.all([
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
  ]);

  const profileRow = (profileR.data as Record<string, unknown> | null) ?? { id: uid, email: supaUser.email, name: supaUser.email?.split("@")[0] ?? "" };
  const user = mapProfile(profileRow, supaUser);
  const totalPoints = (profileRow.total_points as number) ?? 0;
  const history: PointEntry[] = (missR.data ?? []).map(r => ({ date: String((r as Record<string, unknown>).occurred_at), missionId: String((r as Record<string, unknown>).mission_id), points: Number((r as Record<string, unknown>).points) }));
  const completed = history.filter(h => h.date.slice(0, 10) === today && h.points > 0).map(h => h.missionId);

  let cats = (catsR.data ?? []).map(r => mapCat(r as Record<string, unknown>));
  // Garante as categorias padrão (fixas) de cada usuário
  const normName = (s: string) => s.trim().toLowerCase();
  for (const def of DEFAULT_CATEGORIES) {
    if (cats.some(c => normName(c.name) === normName(def.name))) continue;
    const { data: newCat } = await supabase.from("categories")
      .insert({ user_id: uid, name: def.name, color: def.color, kind: def.kind, icon: def.icon ?? null })
      .select("*").single();
    if (newCat) cats = [...cats, mapCat(newCat as Record<string, unknown>)];
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
    updateDebt: async (debtId: string, p: Partial<Pick<Debt, "name" | "icon" | "color" | "note" | "bankId" | "categoryId">>) => {
      const patch: Record<string, unknown> = {};
      if (p.name !== undefined) patch.name = p.name;
      if (p.icon !== undefined) patch.icon = p.icon;
      if (p.color !== undefined) patch.color = p.color;
      if (p.note !== undefined) patch.note = p.note || null;
      if (p.bankId !== undefined) patch.bank_id = p.bankId || null;
      if (p.categoryId !== undefined) patch.category_id = p.categoryId || null;
      const { error } = await supabase.from("debts").update(patch as never).eq("id", debtId);
      if (error) return console.error(error);
      set({ debts: memory.debts.map(d => d.id === debtId ? { ...d, ...p } : d) });
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
      await supabase.from("debt_installments").update({ paid }).eq("id", instId);
      set({
        debts: memory.debts.map(d => d.id !== debtId ? d : {
          ...d, installments: d.installments.map(i => i.id === instId ? { ...i, paid } : i),
        }),
      });
      const tx = inst.transactionId ? memory.transactions.find(t => t.id === inst.transactionId) : undefined;
      if (!tx) return;
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
      await supabase.from("debt_installments").update(patch as never).eq("id", instId);
      set({
        debts: memory.debts.map(d => d.id !== debtId ? d : {
          ...d,
          installments: d.installments.map(i => i.id === instId ? { ...i, ...p } : i),
          totalAmount: d.installments.reduce((s, i) => s + (i.id === instId && p.amount !== undefined ? p.amount : i.amount), 0),
        }),
      });
      if (inst.transactionId) {
        const txPatch: Record<string, unknown> = {};
        if (p.amount !== undefined) txPatch.amount = p.amount;
        if (p.dueDate !== undefined) txPatch.date = p.dueDate;
        await supabase.from("transactions").update(txPatch as never).eq("id", inst.transactionId);
        set({ transactions: memory.transactions.map(t => t.id === inst.transactionId ? { ...t, ...(p.amount !== undefined ? { amount: p.amount } : {}), ...(p.dueDate !== undefined ? { date: p.dueDate } : {}) } : t) });
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
    updateReceivable: async (recvId: string, p: Partial<Pick<Receivable, "name" | "icon" | "color" | "note" | "bankId" | "categoryId">>) => {
      const patch: Record<string, unknown> = {};
      if (p.name !== undefined) patch.name = p.name;
      if (p.icon !== undefined) patch.icon = p.icon;
      if (p.color !== undefined) patch.color = p.color;
      if (p.note !== undefined) patch.note = p.note || null;
      if (p.bankId !== undefined) patch.bank_id = p.bankId || null;
      if (p.categoryId !== undefined) patch.category_id = p.categoryId || null;
      const { error } = await supabase.from("receivables").update(patch as never).eq("id", recvId);
      if (error) return console.error(error);
      set({ receivables: memory.receivables.map(d => d.id === recvId ? { ...d, ...p } : d) });
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
      await supabase.from("receivable_installments").update({ received }).eq("id", instId);
      set({
        receivables: memory.receivables.map(d => d.id !== recvId ? d : {
          ...d, installments: d.installments.map(i => i.id === instId ? { ...i, received } : i),
        }),
      });
      const tx = inst.transactionId ? memory.transactions.find(t => t.id === inst.transactionId) : undefined;
      if (!tx) return;
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
    },
    updateReceivableInstallment: async (recvId: string, instId: string, p: { amount?: number; dueDate?: string }) => {
      const recv = memory.receivables.find(d => d.id === recvId);
      const inst = recv?.installments.find(i => i.id === instId);
      if (!recv || !inst) return;
      const patch: Record<string, unknown> = {};
      if (p.amount !== undefined) patch.amount = p.amount;
      if (p.dueDate !== undefined) patch.due_date = p.dueDate;
      await supabase.from("receivable_installments").update(patch as never).eq("id", instId);
      set({
        receivables: memory.receivables.map(d => d.id !== recvId ? d : {
          ...d,
          installments: d.installments.map(i => i.id === instId ? { ...i, ...p } : i),
          totalAmount: d.installments.reduce((s, i) => s + (i.id === instId && p.amount !== undefined ? p.amount : i.amount), 0),
        }),
      });
      if (inst.transactionId) {
        const txPatch: Record<string, unknown> = {};
        if (p.amount !== undefined) txPatch.amount = p.amount;
        if (p.dueDate !== undefined) txPatch.date = p.dueDate;
        await supabase.from("transactions").update(txPatch as never).eq("id", inst.transactionId);
        set({ transactions: memory.transactions.map(t => t.id === inst.transactionId ? { ...t, ...(p.amount !== undefined ? { amount: p.amount } : {}), ...(p.dueDate !== undefined ? { date: p.dueDate } : {}) } : t) });
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
    exportData: (_scope: "user" | "all" = "user") => {
      const user = memory.users.find(u => u.id === memory.currentUserId) ?? null;
      const cards = memory.cards.map(c => ({ ...c, usedManual: c.usedManual ?? 0 }));
      return JSON.stringify({
        app: "CloseFinance", version: 3, exportedAt: new Date().toISOString(),
        data: {
          transactions: memory.transactions,
          categories: memory.categories,
          cards,
          banks: memory.banks,
          debts: memory.debts,
          receivables: memory.receivables,
          cashAmount: user?.cashAmount ?? 0,
          user,
          missions: memory.missions,
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

        if (mode === "replace") {
          await supabase.from("debt_installments").delete().eq("user_id", uid);
          await supabase.from("receivable_installments").delete().eq("user_id", uid);
          await Promise.all([
            supabase.from("debts").delete().eq("user_id", uid),
            supabase.from("receivables").delete().eq("user_id", uid),
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
          if (dup) { catIdMap.set(c.id, dup.id); continue; }
          const { data } = await supabase.from("categories").insert({ user_id: uid, name: c.name, color: c.color, icon: c.icon ?? null, kind: c.kind ?? "expense" }).select("id").single();
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
            note: dv.note ?? null,
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
            note: rv.note ?? null,
          }).select("id").single();
          if (data) recvIdMap.set(rv.id, String((data as Record<string, unknown>).id));
        }

        const remapTag = (tag?: string | null): string | null => {
          if (!tag) return null;
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
