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
  cardId?: string;
  tag?: string; // user-defined parameter (ex: "viagem-japão", "mercado-mensal")
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
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // toy hash
  birthdate?: string;
  job?: string;
  yearlyGoal?: number;
  avatar?: string; // data URL
  createdAt: string;
}

export interface PointEntry {
  date: string; // ISO datetime
  missionId: string;
  points: number; // +10 earn, -10 undo
}

export interface MissionState {
  date: string; // today yyyy-mm-dd
  completed: string[];
  totalPoints: number;
  history: PointEntry[];
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  cards: Card[];
  users: User[];
  currentUserId: string | null;
  missions: MissionState;
}

const KEY = "closefinance:v1";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "c-food", name: "Alimentação", color: "#FFCC00", kind: "expense" },
  { id: "c-home", name: "Moradia", color: "#540BD3", kind: "expense" },
  { id: "c-transport", name: "Transporte", color: "#006F77", kind: "expense" },
  { id: "c-leisure", name: "Lazer", color: "#820432", kind: "expense" },
  { id: "c-health", name: "Saúde", color: "#FF8FA3", kind: "expense" },
  { id: "c-salary", name: "Salário", color: "#2BD9A1", kind: "income" },
  { id: "c-extra", name: "Renda extra", color: "#22C3CC", kind: "income" },
];

const DEFAULT_STATE: AppState = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  cards: [],
  users: [],
  currentUserId: null,
  missions: { date: new Date().toISOString().slice(0, 10), completed: [], totalPoints: 0, history: [] },
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
    // reset missions if day changed
    const today = new Date().toISOString().slice(0, 10);
    if (memory.missions.date !== today) {
      memory = { ...memory, missions: { ...memory.missions, date: today, completed: [] } };
    }
    initialized = true;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(memory));
  listeners.forEach((l) => l());
}

// toy hash — NOT for real auth, only local profile gating
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

export function useStore() {
  ensureInit();
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const id = () => Math.random().toString(36).slice(2, 10);

  const api = {
    addTransaction: (t: Omit<Transaction, "id">) => { memory = { ...memory, transactions: [...memory.transactions, { ...t, id: id() }] }; persist(); },
    updateTransaction: (i: string, p: Partial<Transaction>) => { memory = { ...memory, transactions: memory.transactions.map(x => x.id === i ? { ...x, ...p } : x) }; persist(); },
    removeTransaction: (i: string) => { memory = { ...memory, transactions: memory.transactions.filter(x => x.id !== i) }; persist(); },
    addCategory: (c: Omit<Category, "id">) => { memory = { ...memory, categories: [...memory.categories, { ...c, id: id() }] }; persist(); },
    updateCategory: (i: string, p: Partial<Category>) => { memory = { ...memory, categories: memory.categories.map(x => x.id === i ? { ...x, ...p } : x) }; persist(); },
    removeCategory: (i: string) => { memory = { ...memory, categories: memory.categories.filter(x => x.id !== i) }; persist(); },
    addCard: (c: Omit<Card, "id">) => { memory = { ...memory, cards: [...memory.cards, { ...c, id: id() }] }; persist(); },
    updateCard: (i: string, p: Partial<Card>) => { memory = { ...memory, cards: memory.cards.map(x => x.id === i ? { ...x, ...p } : x) }; persist(); },
    removeCard: (i: string) => { memory = { ...memory, cards: memory.cards.filter(x => x.id !== i) }; persist(); },

    exportData: (scope: "user" | "all" = "user") => {
      const uid = memory.currentUserId;
      const payload = {
        app: "CloseFinance",
        version: 1,
        exportedAt: new Date().toISOString(),
        scope,
        data: scope === "all" ? memory : {
          transactions: memory.transactions,
          categories: memory.categories,
          cards: memory.cards,
          user: memory.users.find(u => u.id === uid) ?? null,
          missions: memory.missions,
        },
      };
      return JSON.stringify(payload, null, 2);
    },
    importData: (json: string, mode: "merge" | "replace" = "merge") => {
      try {
        const parsed = JSON.parse(json);
        if (!parsed || parsed.app !== "CloseFinance" || !parsed.data) {
          return { ok: false as const, error: "Arquivo inválido — não é um backup CloseFinance." };
        }
        const d = parsed.data;
        const incomingTx: Transaction[] = Array.isArray(d.transactions) ? d.transactions : [];
        const incomingCats: Category[] = Array.isArray(d.categories) ? d.categories : [];
        const incomingCards: Card[] = Array.isArray(d.cards) ? d.cards : [];

        if (mode === "replace") {
          memory = {
            ...memory,
            transactions: incomingTx,
            categories: incomingCats.length ? incomingCats : memory.categories,
            cards: incomingCards,
          };
        } else {
          const txIds = new Set(memory.transactions.map(x => x.id));
          const catIds = new Set(memory.categories.map(x => x.id));
          const cardIds = new Set(memory.cards.map(x => x.id));
          memory = {
            ...memory,
            transactions: [...memory.transactions, ...incomingTx.filter(x => x.id && !txIds.has(x.id))],
            categories: [...memory.categories, ...incomingCats.filter(x => x.id && !catIds.has(x.id))],
            cards: [...memory.cards, ...incomingCards.filter(x => x.id && !cardIds.has(x.id))],
          };
        }
        persist();
        return {
          ok: true as const,
          counts: { transactions: incomingTx.length, categories: incomingCats.length, cards: incomingCards.length },
        };
      } catch (e) {
        return { ok: false as const, error: "JSON inválido ou corrompido." };
      }
    },

    signup: (data: { name: string; email: string; password: string; birthdate?: string; job?: string; yearlyGoal?: number }) => {
      const email = data.email.trim().toLowerCase();
      if (memory.users.some(u => u.email === email)) return { ok: false as const, error: "E-mail já cadastrado." };
      const u: User = {
        id: id(), name: data.name.trim(), email, passwordHash: hash(data.password),
        birthdate: data.birthdate, job: data.job, yearlyGoal: data.yearlyGoal,
        createdAt: new Date().toISOString(),
      };
      memory = { ...memory, users: [...memory.users, u], currentUserId: u.id };
      persist();
      return { ok: true as const };
    },
    login: (email: string, password: string) => {
      const u = memory.users.find(x => x.email === email.trim().toLowerCase() && x.passwordHash === hash(password));
      if (!u) return { ok: false as const, error: "Credenciais inválidas." };
      memory = { ...memory, currentUserId: u.id };
      persist();
      return { ok: true as const };
    },
    logout: () => { memory = { ...memory, currentUserId: null }; persist(); },
    updateProfile: (patch: Partial<Omit<User, "id" | "passwordHash" | "createdAt" | "email">>) => {
      if (!memory.currentUserId) return;
      memory = { ...memory, users: memory.users.map(u => u.id === memory.currentUserId ? { ...u, ...patch } : u) };
      persist();
    },
    toggleMission: (missionId: string) => {
      const today = new Date().toISOString().slice(0, 10);
      const base: MissionState = memory.missions.date === today
        ? memory.missions
        : { date: today, completed: [], totalPoints: memory.missions.totalPoints, history: memory.missions.history };
      const isDone = base.completed.includes(missionId);
      const delta = isDone ? -10 : 10;
      const completed = isDone ? base.completed.filter(x => x !== missionId) : [...base.completed, missionId];
      const entry: PointEntry = { date: new Date().toISOString(), missionId, points: delta };
      memory = {
        ...memory,
        missions: {
          date: today,
          completed,
          totalPoints: Math.max(0, base.totalPoints + delta),
          history: [entry, ...base.history].slice(0, 500),
        },
      };
      persist();
    },
    reset: () => { memory = DEFAULT_STATE; persist(); },
  };

  const currentUser = memory.users.find(u => u.id === memory.currentUserId) ?? null;
  return [memory, api, currentUser] as const;
}

export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function isSameMonth(iso: string, ref: Date) {
  const d = new Date(iso + "T00:00:00");
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
