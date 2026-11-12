import { recoveryChanges, reverseChanges, type Snapshot } from './action-history-core';

/** Build an atomic deletion with expected-state checks and unchanged remaining amounts. */
export function debtInstallmentDeletion(snapshot: Snapshot, debtId: string, installmentId: string) {
  const owner = snapshot.debts?.find(row => row.id === debtId);
  const installment = snapshot.debt_installments?.find(row => row.id === installmentId && row.debt_id === debtId);
  if (!owner || !installment) throw new Error('Esta parcela não está mais disponível. Atualize a página.');
  const after: Snapshot = Object.fromEntries(Object.entries(snapshot).map(([table, rows]) => [table, rows.map(row => ({ ...row }))]));
  const remaining = after.debt_installments.filter(row => row.debt_id === debtId && row.id !== installmentId).sort((a, b) => Number(a.number) - Number(b.number));
  remaining.forEach((row, index) => { row.number = index + 1; });
  after.debt_installments = after.debt_installments.filter(row => row.id !== installmentId);
  after.debts = after.debts.flatMap(row => row.id !== debtId ? [row] : remaining.length ? [{ ...row, total_amount: remaining.reduce((cents, part) => cents + Math.round(Number(part.amount) * 100), 0) / 100, installments_total: remaining.length }] : []);
  const transaction = after.transactions.find(row => row.id === installment.transaction_id);
  if (transaction) {
    after.transactions = after.transactions.filter(row => row.id !== transaction.id);
    if (transaction.applied_to_balance && transaction.bank_id) {
      // Gasto estornado: o valor volta para o saldo do banco.
      after.banks = after.banks.map(row => row.id === transaction.bank_id ? { ...row, account_balance: (Math.round(Number(row.account_balance) * 100) + Math.round(Number(transaction.amount) * 100)) / 100 } : row);
    }
  }
  for (const part of remaining) {
    after.transactions = after.transactions.map(row => row.id === part.transaction_id ? { ...row, description: `${owner.name} (${part.number}/${remaining.length})`, installment_no: part.number, installment_total: remaining.length } : row);
  }
  return reverseChanges(recoveryChanges(snapshot, after));
}
