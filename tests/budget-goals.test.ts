import { describe, expect, test } from "vitest";
import { monthBudget, projectBudget, readBudgetPlan, DEFAULT_PERCENTAGES } from "../src/lib/budget-goals";
import type { Transaction, Category } from "../src/lib/store";

describe("monthly budget goals", () => {
  test("projects monthly income across all six pillars instead of treating percentages as money", () => {
    expect(projectBudget(4780, DEFAULT_PERCENTAGES)).toEqual({ freedom: 1195, comfort: 717, pleasures: 478, knowledge: 478, fixed: 1434, goals: 478 });
  });
  test("uses the user's percentages and the selected month's posted income", () => {
    const monthly = monthBudget([
      tx("salary", "income", 4000, "2026-10-01"),
      tx("extra", "income", 780, "2026-10-10"),
      tx("past", "income", 2000, "2026-09-01"),
      tx("future", "income", 1000, "2026-10-30"),
    ], cats, "2026-10", 0, "2026-10-19");
    expect(projectBudget(monthly.income, { freedom: 30, comfort: 20, pleasures: 5, knowledge: 5, fixed: 35, goals: 5 })).toEqual({ freedom: 1434, comfort: 956, pleasures: 239, knowledge: 239, fixed: 1673, goals: 239 });
  });
  test("does not invent a monetary budget without monthly income", () => {
    expect(Object.values(projectBudget(0, DEFAULT_PERCENTAGES))).toEqual([0, 0, 0, 0, 0, 0]);
  });
  test("preserves the income total when allocations require cent rounding", () => {
    const allocation = projectBudget(100.01, DEFAULT_PERCENTAGES);
    expect(Object.values(allocation).reduce((sum, amount) => sum + Math.round(amount * 100), 0)).toBe(10001);
    expect(allocation.fixed).toBe(30.01);
  });
  const cats: Category[] = [{ id: "fixed", name: "Aluguel", color: "", budgetGroup: "fixed" }];
  const tx = (id: string, type: "income" | "expense", amount: number, date: string, extras = {}): Transaction => ({ id, type, amount, date, description: id, ...extras });
  test("uses only the selected month and posted dates, without counting invoice payments twice", () => {
    const result = monthBudget([
      tx("salary", "income", 4000, "2026-10-01"),
      tx("rent", "expense", 1000, "2026-10-02", { categoryId: "fixed" }),
      tx("unlinked", "expense", 200, "2026-10-03"),
      tx("invoice", "expense", 1000, "2026-10-04", { tag: "__pf__:card" }),
      tx("future", "expense", 900, "2026-10-30"),
      tx("previous", "expense", 900, "2026-09-01"),
    ], cats, "2026-10", 500, "2026-10-14");
    expect(result).toEqual({ income: 4000, expenses: 1200, groups: { freedom: 500, comfort: 0, pleasures: 0, knowledge: 0, fixed: 1000, goals: 0 }, unassigned: 200, allocated: 1700, remaining: 2300 });
  });
  test("handles months without income and keeps investments separate from savings contributions", () => {
    const result = monthBudget([], cats, "2026-09", 0, "2026-10-14");
    expect(result.income).toBe(0);
    expect(result.allocated).toBe(0);
  });
  test("validates imported preferences and preserves past months", () => {
    expect(readBudgetPlan(null)).toEqual({ months: {} });
    const plan = readBudgetPlan({ months: { "2026-09": { percentages: { fixed: 120 }, savedAmount: -20 }, "bad": {} } });
    expect(plan.months["2026-09"]).toEqual({ percentages: { ...DEFAULT_PERCENTAGES, fixed: 100 }, savedAmount: 0 });
    expect(plan.months.bad).toBeUndefined();
  });
});