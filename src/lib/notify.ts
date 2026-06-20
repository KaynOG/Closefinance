import { toast } from "sonner";

const KEY = "closefinance:popupsEnabled";
const listeners = new Set<(v: boolean) => void>();

export function arePopupsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(KEY);
  return v === null ? true : v === "1";
}

export function setPopupsEnabled(v: boolean) {
  localStorage.setItem(KEY, v ? "1" : "0");
  listeners.forEach((l) => l(v));
}

export function onPopupsChange(cb: (v: boolean) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

type NotifyKind = "success" | "info" | "warning" | "error";

export function notify(message: string, kind: NotifyKind = "success") {
  if (!arePopupsEnabled()) return;
  const fn = (toast as unknown as Record<NotifyKind, (m: string) => void>)[kind] ?? toast.success;
  fn(message);
}
