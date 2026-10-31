type DialogOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  secret?: boolean;
};
export type AppDialogRequest = DialogOptions & {
  id: number;
  kind: "confirm" | "alert" | "prompt";
  message: string;
  defaultValue?: string;
  resolve: (value: boolean | string | null) => void;
};

let active: AppDialogRequest | null = null;
let nextId = 0;
const queue: AppDialogRequest[] = [];
const listeners = new Set<() => void>();
export const getDialogSnapshot = () => active;
export function subscribeDialogs(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function emit() { listeners.forEach(listener => listener()); }
function requestDialog(kind: AppDialogRequest["kind"], message: string, options: DialogOptions, defaultValue?: string) {
  return new Promise<boolean | string | null>(resolve => {
    queue.push({ kind, message, ...options, id: ++nextId, defaultValue, resolve });
    if (!active) active = queue.shift() ?? null;
    emit();
  });
}
export function finishDialog(value: boolean | string | null, expectedId = active?.id) {
  if (!active || active.id !== expectedId) return;
  const current = active;
  active = queue.shift() ?? null;
  emit();
  current?.resolve(value);
}
export async function appConfirm(message: string, options: DialogOptions = {}) {
  return await requestDialog("confirm", message, options) === true;
}
export async function appAlert(message: string, options: DialogOptions = {}) {
  await requestDialog("alert", message, options);
}
export async function appPrompt(message: string, defaultValue = "", options: DialogOptions = {}) {
  const value = await requestDialog("prompt", message, options, defaultValue);
  return typeof value === "string" ? value : null;
}