export type Theme = "light" | "dark";
export type Accent = "violet" | "crimson" | "teal" | "graphite";

const KEY = "closefinance:theme";
const AKEY = "closefinance:accent";
const listeners = new Set<(t: Theme) => void>();
const aListeners = new Set<(a: Accent) => void>();

export const ACCENTS: { id: Accent; name: string; color: string }[] = [
  { id: "violet", name: "Padrão", color: "#007078" },
  { id: "crimson", name: "Laranja", color: "#f59e0f" },
  { id: "teal", name: "Limão", color: "#e2e043" },
  { id: "graphite", name: "Grafite", color: "#292c40" },
];

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

export function getAccent(): Accent {
  if (typeof window === "undefined") return "violet";
  const v = localStorage.getItem(AKEY);
  return (["violet", "crimson", "teal", "graphite"] as Accent[]).includes(v as Accent) ? (v as Accent) : "violet";
}

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", t === "light");
  root.classList.toggle("dark", t === "dark");
  root.dataset.theme = t;
}

export function applyAccent(a: Accent) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.accent = a;
}

export function setTheme(t: Theme) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, t);
  applyTheme(t);
  listeners.forEach(l => l(t));
}

export function setAccent(a: Accent) {
  if (typeof window !== "undefined") localStorage.setItem(AKEY, a);
  applyAccent(a);
  aListeners.forEach(l => l(a));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function onThemeChange(cb: (t: Theme) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function onAccentChange(cb: (a: Accent) => void): () => void {
  aListeners.add(cb);
  return () => { aListeners.delete(cb); };
}

export function initTheme() {
  applyTheme(getTheme());
  applyAccent(getAccent());
}
