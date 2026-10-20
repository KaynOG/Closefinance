import { useEffect, useState } from "react";

/** Valores de fatura definidos manualmente pelo usuário (somente controle; não entram em Gastos). */
export type ManualInvoice = { id: string; cardId: string; month: string; amount: number; note?: string };

const key = (uid: string | null) => `cf_manual_invoices_${uid ?? "anon"}`;
const listeners = new Set<() => void>();

export function readManualInvoices(uid: string | null): ManualInvoice[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key(uid)) || "[]"); } catch { return []; }
}

export function saveManualInvoices(uid: string | null, items: ManualInvoice[]) {
  try { localStorage.setItem(key(uid), JSON.stringify(items)); } catch { /* ignore */ }
  listeners.forEach(l => l());
}

export function useManualInvoices(uid: string | null) {
  const [items, setItems] = useState<ManualInvoice[]>([]);
  useEffect(() => {
    const sync = () => setItems(readManualInvoices(uid));
    sync();
    listeners.add(sync);
    window.addEventListener("storage", sync);
    return () => { listeners.delete(sync); window.removeEventListener("storage", sync); };
  }, [uid]);
  return [items, (next: ManualInvoice[]) => saveManualInvoices(uid, next)] as const;
}

export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Total de faturas definidas pelo usuário em um mês (yyyy-mm). */
export function manualInvoiceTotal(items: ManualInvoice[], month: string) {
  return items.filter(i => i.month === month).reduce((s, i) => s + i.amount, 0);
}
