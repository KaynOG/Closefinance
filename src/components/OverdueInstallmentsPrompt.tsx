import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { appConfirm } from "@/lib/app-dialog";
import { notify } from "@/lib/notify";

const SESSION_KEY = "cf_overdue_prompted";
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (iso: string) => iso.split("-").reverse().join("/");
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Asks once per session about overdue unpaid debt installments and unreceived receivable installments. */
export function OverdueInstallmentsPrompt() {
  const [{ debts, receivables, currentUserId }, api] = useStore();
  const running = useRef(false);

  useEffect(() => {
    if (!currentUserId || running.current) return;
    const today = localToday();
    let asked: string[] = [];
    try { asked = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]"); } catch { /* ignore */ }
    const items = [
      ...debts.filter(d => !d.archived).flatMap(d => d.installments.filter(i => !i.paid && i.dueDate < today).map(i => ({ key: `d:${i.id}`, kind: "debt" as const, owner: d, inst: i }))),
      ...receivables.filter(r => !r.archived).flatMap(r => r.installments.filter(i => !i.received && i.dueDate < today).map(i => ({ key: `r:${i.id}`, kind: "recv" as const, owner: r, inst: i }))),
    ].filter(x => !asked.includes(x.key)).sort((a, b) => a.inst.dueDate.localeCompare(b.inst.dueDate));
    if (!items.length) return;
    running.current = true;
    (async () => {
      for (const item of items) {
        asked.push(item.key);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(asked));
        const { owner, inst } = item;
        const isDebt = item.kind === "debt";
        const ok = await appConfirm(
          isDebt
            ? `A parcela ${inst.number} de "${owner.name}" (${brl(inst.amount)}) venceu em ${fmt(inst.dueDate)} e ainda não foi marcada como paga.\n\nVocê já pagou essa parcela?`
            : `A parcela ${inst.number} de "${owner.name}" (${brl(inst.amount)}) venceu em ${fmt(inst.dueDate)} e ainda não foi marcada como recebida.\n\nVocê já recebeu essa parcela?`,
          { title: isDebt ? "Parcela de dívida vencida" : "Parcela a receber vencida", confirmLabel: isDebt ? "Sim, paguei" : "Sim, recebi", cancelLabel: "Ainda não" },
        );
        if (!ok) continue;
        if (isDebt) await api.setInstallmentPaid(owner.id, inst.id, true);
        else await api.setReceivableInstallmentReceived(owner.id, inst.id, true);
        notify(isDebt ? `Parcela ${inst.number} de "${owner.name}" marcada como paga.` : `Parcela ${inst.number} de "${owner.name}" marcada como recebida.`);
      }
      running.current = false;
    })();
  }, [debts, receivables, currentUserId, api]);

  return null;
}
