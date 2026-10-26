export type PartialInstallment = { id: string; number: number; amount: number; dueDate: string; settled: boolean };
export function nextInstallmentMonth(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const target = new Date(year, month, 1);
  target.setDate(Math.min(day, new Date(year, month + 1, 0).getDate()));
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}
export function projectPartialInstallment(rows: PartialInstallment[], selectedId: string, value: number) {
  const selected = rows.find(row => row.id === selectedId);
  const cents = Math.round(value * 100);
  if (!selected || selected.settled) throw new Error("Esta parcela não está pendente.");
  if (!Number.isFinite(value) || cents <= 0 || cents >= Math.round(selected.amount * 100)) {
    throw new Error("Informe um valor maior que zero e menor que o valor da parcela.");
  }
  const remainder = Math.round(selected.amount * 100) - cents;
  const pending = rows.filter(row => row.number > selected.number && !row.settled).sort((a, b) => a.number - b.number);
  const updates = pending.map((row, index) => ({
    ...row, previousAmount: row.amount,
    amount: (Math.round(row.amount * 100) + Math.floor(remainder / pending.length) + (index < remainder % pending.length ? 1 : 0)) / 100,
  }));
  const extra = pending.length ? null : {
    number: Math.max(...rows.map(row => row.number)) + 1,
    amount: remainder / 100,
    dueDate: nextInstallmentMonth([...rows].sort((a, b) => b.number - a.number)[0]?.dueDate ?? selected.dueDate),
  };
  return { paidAmount: cents / 100, remainder: remainder / 100, updates, extra };
}