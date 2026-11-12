import { describe, expect, it } from 'vitest';
import { receivableInstallmentDeletion } from '../src/lib/receivable-installment-deletion';

function snapshot() {
  return { receivables: [{ id: 'r', name: 'Cliente', total_amount: 300, installments_total: 3 }], receivable_installments: [
    { id: 'a', receivable_id: 'r', number: 1, amount: 50, received: false },
    { id: 'b', receivable_id: 'r', number: 2, amount: 100, received: true, transaction_id: 'tx' },
    { id: 'c', receivable_id: 'r', number: 3, amount: 150, received: false },
  ], transactions: [{ id: 'tx', bank_id: 'bank', amount: 100, applied_to_balance: true }], banks: [{ id: 'bank', account_balance: 500 }] };
}
describe('excluir parcela de devedor', () => {
  it('subtrai somente a parcela excluída e renumera sem redistribuir valores', () => {
    const before = snapshot();
    const changes = receivableInstallmentDeletion(before, 'r', 'a');
    expect(changes.find(c => c.table === 'receivables')?.target).toMatchObject({ total_amount: 250, installments_total: 2 });
    expect(changes.find(c => c.expected?.id === 'a')?.target).toBeNull();
    expect(changes.find(c => c.expected?.id === 'b')?.target).toMatchObject({ number: 1, amount: 100, received: true });
    expect(changes.find(c => c.expected?.id === 'c')?.target).toMatchObject({ number: 2, amount: 150, received: false });
    expect(before.receivables[0].total_amount).toBe(300);
  });
  it('remove o ganho vinculado e estorna apenas o crédito aplicado', () => {
    const changes = receivableInstallmentDeletion(snapshot(), 'r', 'b');
    expect(changes.find(c => c.table === 'receivables')?.target?.total_amount).toBe(200);
    expect(changes.find(c => c.table === 'transactions')?.target).toBeNull();
    expect(changes.find(c => c.table === 'banks')?.target?.account_balance).toBe(400);
  });
  it('remove o devedor quando não restam parcelas', () => {
    const before = snapshot();
    before.receivable_installments = before.receivable_installments.slice(0, 1);
    expect(receivableInstallmentDeletion(before, 'r', 'a').find(c => c.table === 'receivables')?.target).toBeNull();
  });
});