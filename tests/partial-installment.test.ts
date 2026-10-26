import { describe, expect, it } from "vitest";
import { projectPartialInstallment, nextInstallmentMonth } from "../src/lib/partial-installment";

const rows = [1, 2, 3, 4].map(number => ({ id: String(number), number, amount: 100, dueDate: `2026-${String(number + 8).padStart(2, "0")}-10`, settled: false }));
describe("pagamento e recebimento parcial", () => {
  it("divide o saldo igualmente pelas parcelas seguintes, preservando centavos e total", () => {
    const result = projectPartialInstallment(rows, "1", 50);
    expect(result.updates.map(row => row.amount)).toEqual([116.67, 116.67, 116.66]);
    expect(result.paidAmount + result.updates.reduce((sum, row) => sum + Math.round(row.amount * 100), 0) / 100).toBe(400);
    expect(result.remainder).toBe(50);
  });
  it("não altera parcelas anteriores ou já confirmadas e preserva valores desiguais", () => {
    const result = projectPartialInstallment(rows.map(row => ({ ...row, settled: row.id === "3", amount: row.id === "4" ? 250 : row.amount })), "2", 40);
    expect(result.updates.map(row => [row.id, row.amount, row.settled])).toEqual([["4", 310, false]]);
  });
  it("mantém saldo pendente em uma nova parcela quando não existem parcelas seguintes", () => {
    const result = projectPartialInstallment(rows, "4", 30);
    expect(result.updates).toEqual([]);
    expect(result.extra).toEqual({ number: 5, amount: 70, dueDate: "2027-01-10" });
  });
  it("impede confirmar valores inválidos ou uma parcela já confirmada", () => {
    for (const value of [0, -1, 100, 110, NaN, Infinity]) expect(() => projectPartialInstallment(rows, "1", value)).toThrow();
    expect(() => projectPartialInstallment(rows.map(row => ({ ...row, settled: true })), "1", 50)).toThrow();
  });
  it("limita a data do novo saldo ao último dia do mês seguinte", () => {
    expect(nextInstallmentMonth("2026-01-31")).toBe("2026-02-28");
  });
});