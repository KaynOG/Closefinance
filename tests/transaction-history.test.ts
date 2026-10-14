import { describe, expect, it } from "vitest";
import { EMPTY_HISTORY_FILTERS, filterHistory } from "../src/lib/transaction-history";
import type { Transaction, VirtualInvoiceRow } from "../src/lib/store";

const transactions: Transaction[] = [
  { id: "income", type: "income", description: "Salário", amount: 2000, date: "2026-09-01" },
  { id: "expense", type: "expense", description: "Alimentação", amount: 100, date: "2026-09-10", categoryId: "food", essential: "essential", paymentMethod: "pix" },
  { id: "credit", type: "expense", description: "Compra", amount: 250, date: "2026-09-20", cardId: "card", paymentMethod: "credit" },
  { id: "payment", type: "expense", description: "Pagamento", amount: 250, date: "2026-09-25", tag: "__pf__:card" },
  { id: "outside", type: "income", description: "Futuro", amount: 5000, date: "2026-11-01" },
];
const invoices: VirtualInvoiceRow[] = [{ id: "invoice", type: "expense", description: "Fatura", amount: 250, date: "2026-09-20", cardId: "card", virtual: true }];
describe("transaction history", () => {
  it("filters inclusive dates and avoids double counting settlements and invoice summaries", () => {
    const result = filterHistory(transactions, invoices, { ...EMPTY_HISTORY_FILTERS, start: "2026-09-01", end: "2026-09-25" });
    expect(result.incomeTotal).toBe(2000);
    expect(result.expenseTotal).toBe(350);
    expect(result.settlementTotal).toBe(250);
    expect(result.invoiceTotal).toBe(250);
    expect(result.expenses.map(row => row.id)).toEqual(["payment", "credit", "expense"]);
  });
  it("combines category, classification, payment and accent-insensitive search", () => {
    const result = filterHistory(transactions, invoices, { ...EMPTY_HISTORY_FILTERS, search: "alimentacao", category: "food", payment: "pix", essential: "essential" });
    expect(result.expenses.map(row => row.id)).toEqual(["expense"]);
    expect(result.invoices).toHaveLength(0);
  });
  it("filters cards and sorts oldest first", () => {
    const result = filterHistory(transactions, invoices, { ...EMPTY_HISTORY_FILTERS, card: "card", sort: "oldest" });
    expect(result.expenses.map(row => row.id)).toEqual(["credit"]);
    expect(result.invoices).toHaveLength(1);
  });
  it("returns no rows for an invalid date range", () => {
    const result = filterHistory(transactions, invoices, { ...EMPTY_HISTORY_FILTERS, start: "2026-10-01", end: "2026-09-01" });
    expect(result.valid).toBe(false);
    expect(result.incomeTotal + result.expenseTotal + result.invoiceTotal).toBe(0);
  });
});