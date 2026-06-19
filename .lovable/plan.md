
## Visão geral

Vou ativar o **Lovable Cloud** (backend gerenciado e seguro) para mover login e dados financeiros para a nuvem, e implementar todas as funcionalidades pedidas. Após a migração, o login local antigo deixa de funcionar — o usuário cria uma conta nova (ou usa Backup/Importar para subir dados antigos).

---

## 1. Backend em nuvem (Lovable Cloud)

**Tabelas (todas com RLS por `user_id = auth.uid()`):**
- `profiles` — nome, data nasc., emprego, meta anual, gênero, avatar, total de pontos, prefs (som on/off)
- `categories` — nome, cor, ícone, tipo (income/expense/both)
- `cards` — nome, limite, dia de fechamento, vencimento, cor
- `banks` — nome, cor, saldo guardado, conta corrente, observação
- `transactions` — tipo, valor, descrição, data, category_id, card_id, bank_id, etiqueta, essencial, **payment_method** (credit/debit/cash/pix), **installment_no**, **installment_total**, **installment_group_id**
- `mission_history` — data/hora, mission_id, pontos

**Auth:** e-mail + senha (com validador de força já existente) + reset por e-mail real via Cloud. Trigger cria `profile` no signup. Roles em tabela separada `user_roles` (preparada para uso futuro, ainda sem painel admin).

## 2. Edição de transações
Botão de editar em cada linha (Ganhos, Gastos, Transações) abre modal com: data, descrição, categoria, etiqueta, valor, e — para gastos — método (crédito/débito/pix/dinheiro), cartão/banco, parcelas.

## 3. Parcelas no crédito (até 36x)
Ao criar uma compra parcelada, gero **N transações** (uma por mês a partir da data da compra), todas com o mesmo `installment_group_id`. Ficam visíveis como "3/12" na lista. Editar/excluir uma parcela pergunta se aplica só à parcela ou ao grupo todo. Calendário, fatura e dashboard passam a refletir as parcelas futuras.

## 4. Aba de Cartões — dashboard
Em cada cartão mostro:
- Limite total
- **Usado no mês atual** (gastos do ciclo da fatura corrente)
- **Limite disponível** (limite − total de parcelas futuras em aberto)
- Barra de saúde já existente com observações ("gasto excessivo", "uso saudável", etc.)

## 5. Nova aba **Bancos**
Mesmo formato visual de Cartões. CRUD de bancos com cor personalizável. Cada card de banco mostra:
- Saldo em conta (editável)
- Valor guardado / poupado (editável)
- Progresso em relação à **meta anual** do perfil (barra colorida, % atingido)
- Observação opcional

Manual — atualização pelo próprio usuário (conforme sua escolha).

## 6. Animações e sons
- Transições suaves entre abas (fade + slide leve), hover em cards, "pop" ao concluir missão, contador animado de pontos.
- Sons cozy adicionais: clique padrão (já existe), sucesso (salvar/missão), erro suave, abrir modal. Tudo respeita o toggle "Som da interface" do perfil.

---

## Detalhes técnicos

- **Stack:** mantém TanStack Start. Camada de dados nova em `src/lib/data/*.functions.ts` usando `createServerFn` + `requireSupabaseAuth`. `src/lib/store.ts` vira fachada que consome React Query, preservando os componentes atuais ao máximo.
- **Migração:** ao primeiro login pós-Cloud, um botão no Perfil ("Importar dados do navegador") sobe o JSON local para o backend. Não migro automaticamente para evitar duplicação.
- **Parcelas:** geração no servidor dentro de uma transação Postgres; `installment_group_id` permite editar/excluir em lote.
- **Reset de senha:** rota pública `/reset-password` consumindo `supabase.auth.updateUser`.
- **Animações:** Framer Motion (`bun add framer-motion`).
- **Sons novos:** estendo `src/lib/sound.ts` com osciladores Web Audio (sem novos assets).

## Fora deste escopo (posso fazer em seguida se quiser)
- Importar extrato bancário (OFX/CSV).
- Notificações push de vencimento de fatura.
- Compartilhamento de orçamento entre usuários.
