import { describe, expect, it } from 'vitest';
import { recoveryChanges, reverseChanges } from '../src/lib/action-history-core';

describe('exclusion recovery', () => {
  it('recovers an expense and its bank balance without changing unrelated rows', () => {
    const bank = { id: 'bank', account_balance: 900 };
    const expense = { id: 'expense', bank_id: 'bank', amount: 100, applied_to_balance: true };
    const unchanged = { id: 'other', amount: 40 };
    const changes = recoveryChanges({ banks: [bank], transactions: [expense, unchanged] }, { banks: [{ ...bank, account_balance: 1000 }], transactions: [unchanged] });
    expect(changes).toHaveLength(2);
    expect(changes.find(c => c.table === 'banks')?.target?.account_balance).toBe(900);
    expect(changes.find(c => c.table === 'transactions')?.target).toEqual(expense);
  });
  it('recovers a card and its original transaction links', () => {
    const tx = { id: 'tx', card_id: 'card', amount: 300 };
    const changes = recoveryChanges({ cards: [{ id: 'card', name: 'Cartão' }], transactions: [tx] }, { cards: [], transactions: [{ ...tx, card_id: null }] });
    expect(changes.map(c => c.table)).toEqual(['cards', 'transactions']);
    expect(changes[1].target?.card_id).toBe('card');
    expect(reverseChanges(reverseChanges(changes))).toEqual(changes);
  });
  it('restores the removed installment, paid checkbox and parent total', () => {
    const before = { debts: [{ id: 'debt', total_amount: 300 }], debt_installments: [{ id: 'part', debt_id: 'debt', amount: 100, paid: true, transaction_id: 'tx' }] };
    const changes = recoveryChanges(before, { debts: [{ id: 'debt', total_amount: 200 }], debt_installments: [] });
    expect(changes[1].target?.paid).toBe(true);
    expect(changes[1].target?.transaction_id).toBe('tx');
    expect(changes[0].target?.total_amount).toBe(300);
  });
  it('ignores automatic timestamp updates', () => {
    expect(recoveryChanges({ banks: [{ id: 'a', updated_at: 'old' }] }, { banks: [{ id: 'a', updated_at: 'new' }] })).toEqual([]);
  });
});