import type { Category, Transaction } from "./store";

export const BUDGET_GROUPS = [
  { id: "freedom", name: "Liberdade financeira", description: "Reserva e investimentos", percent: 25 },
  { id: "comfort", name: "Conforto", description: "Bem-estar e conforto", percent: 15 },
  { id: "pleasures", name: "Prazeres", description: "Lazer e recompensas pessoais", percent: 10 },
  { id: "knowledge", name: "Conhecimento", description: "Estudos, cursos e livros", percent: 10 },
  { id: "fixed", name: "Custos fixos", description: "Contas e necessidades básicas", percent: 30 },
  { id: "goals", name: "Metas", description: "Casa, reformas e objetivos", percent: 10 },
] as const;

export type BudgetGroup = typeof BUDGET_GROUPS[number]["id"];
export type BudgetPercentages = Record<BudgetGroup, number>;
export interface BudgetMonth { percentages: BudgetPercentages; savedAmount: number }
export interface BudgetPlan { months: Record<string, BudgetMonth> }
export const DEFAULT_PERCENTAGES = Object.fromEntries(BUDGET_GROUPS.map(g => [g.id, g.percent])) as BudgetPercentages;
export function isBudgetGroup(value: unknown): value is BudgetGroup {
  return BUDGET_GROUPS.some(g => g.id === value);
}
export function readBudgetPlan(value: unknown): BudgetPlan {
  const result: BudgetPlan = { months: {} };
  if (!value || typeof value !== "object" || !("months" in value) || !value.months || typeof value.months !== "object") return result;
  for (const [month, raw] of Object.entries(value.months)) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !raw || typeof raw !== "object") continue;
    const item = raw as Partial<BudgetMonth>;
    const percentages = { ...DEFAULT_PERCENTAGES };
    for (const g of BUDGET_GROUPS) {
      const n = item.percentages?.[g.id];
      if (typeof n === "number" && Number.isFinite(n)) percentages[g.id] = Math.max(0, Math.min(100, Math.round(n)));
    }
    result.months[month] = { percentages, savedAmount: typeof item.savedAmount === "number" && Number.isFinite(item.savedAmount) ? Math.max(0, item.savedAmount) : 0 };
  }
  return result;
}
export function localMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
export function localDay(date = new Date()) {
  return `${localMonth(date)}-${String(date.getDate()).padStart(2, "0")}`;
}
export function monthBudget(transactions: Transaction[], categories: Category[], month: string, savedAmount: number, today = localDay()) {
  const groups = Object.fromEntries(BUDGET_GROUPS.map(g => [g.id, 0])) as Record<BudgetGroup, number>;
  let income = 0, unassigned = 0, expenses = 0;
  const catMap = new Map(categories.map(c => [c.id, c.budgetGroup]));
  for (const t of transactions) {
    if (!t.date.startsWith(`${month}-`) || t.date > today) continue;
    if (t.type === "income") { income += t.amount; continue; }
    // Invoice payments settle credit expenses already included in this comparison.
    if (t.tag?.startsWith("__pf__:")) continue;
    expenses += t.amount;
    const group = t.categoryId ? catMap.get(t.categoryId) : undefined;
    if (isBudgetGroup(group)) groups[group] += t.amount;
    else unassigned += t.amount;
  }
  groups.freedom += savedAmount;
  const allocated = expenses + savedAmount;
  return { income, expenses, groups, unassigned, allocated, remaining: income - allocated };
}
/** Groups lose percentage in this order when another slider needs room (lowest priority first). */
export const REDUCE_ORDER: BudgetGroup[] = ["pleasures", "comfort", "goals", "knowledge", "freedom", "fixed"];
/** Adjusts one group keeping the total at most 100%; freed percentage goes to financial freedom. */
export function rebalance(p: BudgetPercentages, group: BudgetGroup, value: number): BudgetPercentages {
  const next = { ...p };
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const delta = v - p[group];
  next[group] = v;
  if (delta > 0) {
    let excess = BUDGET_GROUPS.reduce((s, g) => s + next[g.id], 0) - 100;
    for (const g of REDUCE_ORDER) {
      if (excess <= 0) break;
      if (g === group) continue;
      const take = Math.min(next[g], excess);
      next[g] -= take; excess -= take;
    }
    if (excess > 0) next[group] -= excess;
  } else if (delta < 0 && group !== "freedom") {
    const total = BUDGET_GROUPS.reduce((s, g) => s + next[g.id], 0);
    next.freedom += Math.max(0, 100 - total);
  }
  return next;
}
