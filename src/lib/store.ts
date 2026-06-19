import { useEffect, useState } from "react";

export type TxType = "income" | "expense";
export type Essential = "essential" | "non_essential";

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  description: string;
  date: string; // ISO yyyy-mm-dd
  categoryId?: string;
  essential?: Essential;
  cardId?: string; // when expense paid via card
}

export interface Category {
  id: string;
  name: string;
  color: string; // hex
  icon?: string;
}

export interface Card {
  id: string;
  name: string;
  limit: number;
  closingDay: number; // 1-28
  dueDay: number;
  color: string;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  cards: Card[];
}

const KEY = "finlux:v1";

const DEFAULT_STATE: AppState = {
  transactions: [],
  categories: [
    { id: "c-food", name: "Alimentação", color: "#FFCC00" },
    { id: "c-home", name: "Moradia", color: "#540BD3" },
    { id: "c-transport", name: "Transporte", color: "#006F77" },
    { id: "c-leisure", name: "Lazer", color: "#820432" },
    { id: "c-salary", name: "Salário", color: "#2BD9A1" },
  ],
  cards: [],
};

function load(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

let memory: AppState = DEFAULT_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function ensureInit() {
  if (!initialized && typeof window !== "undefined") {
    memory = load();
    initialized = true;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(memory));
  listeners.forEach((l) => l());
}

export function useStore(): [AppState, {
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  addCard: (c: Omit<Card, "id">) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
  removeCard: (id: string) => void;
  reset: () => void;
}] {
  ensureInit();
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const id = () => Math.random().toString(36).slice(2, 10);

  return [memory, {
    addTransaction: (t) => { memory = { ...memory, transactions: [...memory.transactions, { ...t, id: id() }] }; persist(); },
    updateTransaction: (i, p) => { memory = { ...memory, transactions: memory.transactions.map(x => x.id === i ? { ...x, ...p } : x) }; persist(); },
    removeTransaction: (i) => { memory = { ...memory, transactions: memory.transactions.filter(x => x.id !== i) }; persist(); },
    addCategory: (c) => { memory = { ...memory, categories: [...memory.categories, { ...c, id: id() }] }; persist(); },
    updateCategory: (i, p) => { memory = { ...memory, categories: memory.categories.map(x => x.id === i ? { ...x, ...p } : x) }; persist(); },
    removeCategory: (i) => { memory = { ...memory, categories: memory.categories.filter(x => x.id !== i) }; persist(); },
    addCard: (c) => { memory = { ...memory, cards: [...memory.cards, { ...c, id: id() }] }; persist(); },
    updateCard: (i, p) => { memory = { ...memory, cards: memory.cards.map(x => x.id === i ? { ...x, ...p } : x) }; persist(); },
    removeCard: (i) => { memory = { ...memory, cards: memory.cards.filter(x => x.id !== i) }; persist(); },
    reset: () => { memory = DEFAULT_STATE; persist(); },
  }];
}

export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function isSameMonth(iso: string, ref: Date) {
  const d = new Date(iso + "T00:00:00");
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
