import { describe, expect, it } from 'vitest';
import { debtInstallmentDeletion } from '../src/lib/debt-installment-deletion';

function snapshot() {
  return { debts: [{ id: 'd', name: 'Empréstimo', total_amount: 300, installments_total: 3 }], debt_installments: [
    { id: 'a', debt_id: 'd', number: 1, amount: 50, paid: false },
    { id: 'b', debt_id: 'd', number: 2, amount: 100, paid: true, transaction_id: 'tx' },
    { id: 'c', debt_id: 'd', number: 3, amount: 150, paid: false },
  ], transactions: [{ id: 'tx', bank_id: 'bank', amount: 100, applied_to_balance: true }], banks: [{ id: 'bank', account_balance: 500 }] };
}
describe('excluir parcela de dívida', () => {
  it('subtrai somente a parcela excluída e renumera sem redistribuir valores', () => {
    const before = snapshot();
    const changes = debtInstallmentDeletion(before, 'd', 'a');
    expect(changes.find(c => c.table === 'debts')?.target).toMatchObject({ total_amount: 250, installments_total: 2 });
    expect(changes.find(c => c.expected?.id === 'a')?.target).toBeNull();
    expect(changes.find(c => c.expected?.id === 'b')?.target).toMatchObject({ number: 1, amount: 100, paid: true });
    expect(changes.find(c => c.expected?.id === 'c')?.target).toMatchObject({ number: 2, amount: 150, paid: false });
    expect(before.debts[0].total_amount).toBe(300);
  });
  it('remove o gasto vinculado e devolve ao banco apenas o débito aplicado', () => {
    const changes = debtInstallmentDeletion(snapshot(), 'd', 'b');
    expect(changes.find(c => c.table === 'debts')?.target?.total_amount).toBe(200);
    expect(changes.find(c => c.table === 'transactions')?.target).toBeNull();
    expect(changes.find(c => c.table === 'banks')?.target?.account_balance).toBe(600);
  });
  it('remove a dívida quando não restam parcelas', () => {
    const before = snapshot();
    before.debt_installments = before.debt_installments.slice(0, 1);
    expect(debtInstallmentDeletion(before, 'd', 'a').find(c => c.table === 'debts')?.target).toBeNull();
  });
});
