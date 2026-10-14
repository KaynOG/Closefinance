import type { Transaction, VirtualInvoiceRow } from "@/lib/store";

export type HistoryFilters = {
  search: string; start: string; end: string; category: string; card: string;
  payment: string; essential: string; sort: "newest" | "oldest";
};
export const EMPTY_HISTORY_FILTERS: HistoryFilters = {
  search: "", start: "", end: "", category: "all", card: "all", payment: "all", essential: "all", sort: "newest",
};
export function filterHistory(transactions: Transaction[], invoices: VirtualInvoiceRow[], filters: HistoryFilters) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const query = normalize(filters.search.trim());
  const valid = !filters.start || !filters.end || filters.start <= filters.end;
  const matches = (row: Transaction | VirtualInvoiceRow) => {
    if (!valid || (filters.start && row.date < filters.start) || (filters.end && row.date > filters.end)) return false;
    if (query && !normalize(row.description).includes(query)) return false;
    if (filters.card !== "all" && row.cardId !== filters.card) return false;
    if ("virtual" in row) return filters.category === "all" && filters.essential === "all" && (filters.payment === "all" || filters.payment === "credit");
    return (filters.category === "all" || (row.categoryId ?? "none") === filters.category)
      && (filters.essential === "all" || row.essential === filters.essential)
      && (filters.payment === "all" || (row.paymentMethod ?? "unspecified") === filters.payment);
  };
  const sort = <T extends Transaction | VirtualInvoiceRow>(rows: T[]) => rows.filter(matches).sort((a, b) => {
    const comparison = a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
    return filters.sort === "oldest" ? comparison : -comparison;
  });
  const income = sort(transactions.filter(row => row.type === "income"));
  const expenses = sort(transactions.filter(row => row.type === "expense"));
  const invoiceRows = sort(invoices);
  const sum = (rows: Array<{ amount: number }>) => rows.reduce((total, row) => total + row.amount, 0);
  return {
    income, expenses, invoices: invoiceRows, valid,
    incomeTotal: sum(income),
    expenseTotal: sum(expenses.filter(row => !row.tag?.startsWith("__pf__:"))),
    settlementTotal: sum(expenses.filter(row => row.tag?.startsWith("__pf__:"))),
    invoiceTotal: sum(invoiceRows),
  };
}