## O que muda

### 1. Data das parcelas no crédito (nova regra)
Hoje a 1ª parcela cai no dia da compra e as demais no dia de **vencimento**. Vou trocar para o dia de **fechamento** do cartão, com a seguinte lógica:

- Se a compra acontece **antes ou no dia do fechamento** do mês corrente → 1ª parcela cai no fechamento **deste mês**.
- Se a compra acontece **depois do fechamento** → 1ª parcela cai no fechamento do **mês seguinte** (entra na próxima fatura).
- Parcelas seguintes: dia de fechamento dos meses consecutivos.

### 2. Crédito não conta como "saída" no fluxo
Hoje toda transação com `type=expense` (inclusive `payment_method=credit`) entra no total de gastos do mês em Dashboard, Transações, Calendário, etc. Vou filtrar `payment_method = "credit"` de TODAS as agregações de saída. As compras no crédito continuam visíveis nas listas (com tag clara de "no crédito") e continuam consumindo limite do cartão.

### 3. Fatura mensal consolidada vira a "saída"
Para cada cartão, em cada mês que tiver compras no crédito, vou gerar **dinamicamente** uma linha de fatura no fluxo do mês:

```text
Fatura do {nome do cartão} - {Mês/Ano}
valor = soma das parcelas daquele cartão com data dentro do mês
```

Essa linha entra como saída do mês (no Dashboard, Transações, Calendário). Não vou materializar no banco — calculo on-the-fly a partir das transações existentes (evita duplicação, edição em lote, descompasso). Aparece sempre que houver compras no crédito daquele cartão naquele mês.

Quando você pagar a fatura (fluxo já existente via tag `__pf__:<cardId>`), o pagamento permanece como hoje: debita do banco e libera limite. A fatura "virtual" e o pagamento real são coisas diferentes — uma representa o que entra na conta do mês, o outro o débito efetivo no banco.

## Pontos abertos (preciso confirmar antes de codar)

1. **"Banco do cartão"** — no app, cartões não têm banco vinculado (só nome e cor). O título da fatura vai usar o **nome do cartão** (`Fatura do Nubank Roxinho - Nov/2026`), não um banco. Confirma?
2. **Quando aparece a fatura?** Proponho: aparece no mês da **data da parcela** (que agora é o fechamento). Ex.: compra dia 20/11 num cartão que fecha dia 25 → parcela 1 com data 25/11 → fatura "Nov/2026". Ok?
3. **Compras antigas** já lançadas no crédito vão automaticamente parar de contar como saída e passar a aparecer dentro da fatura virtual do mês delas. Sem migração de dados. Ok?

## Arquivos que vou tocar

- `src/lib/store.ts` — nova regra de datas em `addTransaction` para crédito; helper `getMonthlyInvoices(month)` que devolve `[{cardId, cardName, monthLabel, amount, items[]}]`.
- `src/routes/index.tsx` (dashboard), `src/routes/transacoes.tsx`, `src/routes/gastos.tsx`, `src/routes/calendario.tsx` — filtrar `payment_method=credit` dos totais de saída e injetar as linhas de fatura virtual no lugar.
- `src/routes/cartoes.tsx` — sem mudança funcional, mas o "usado no mês" passa a refletir as parcelas com data no mês (já é o que faz hoje).

Confirma os 3 pontos abertos? Posso ajustar (1) para incluir um campo "banco" no cartão se preferir.