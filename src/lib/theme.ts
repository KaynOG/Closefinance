export type Theme = "light" | "dark";

const KEY = "closefinance:theme";
const listeners = new Set<(t: Theme) => void>();

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem(KEY);
  return v === "light" ? "light" : "dark";
}

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", t === "light");
  root.classList.toggle("dark", t === "dark");
  root.dataset.theme = t;
}

export function setTheme(t: Theme) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, t);
  applyTheme(t);
  listeners.forEach(l => l(t));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function onThemeChange(cb: (t: Theme) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function initTheme() {
  applyTheme(getTheme());
}
