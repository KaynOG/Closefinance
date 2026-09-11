# Assinaturas (BETA)

## O que será criado

- Nova aba **Assinaturas (BETA)** na navegação desktop e mobile.
- Cadastro de assinatura com nome, valor, data da primeira cobrança, recorrência mensal, cor, ícone e classificação **Essencial / Não essencial**.
- Atalhos visuais para serviços conhecidos, incluindo Netflix, YouTube, Spotify, Amazon, Xbox, Lovable, Claude e ChatGPT, além de ícones genéricos para outros serviços.
- Lista de assinaturas com próxima cobrança, valor mensal, edição, ativação/pausa e exclusão.

## Integração financeira

- Nova categoria fixa **Assinaturas**, sem opção de exclusão.
- Ao criar uma assinatura, gerar automaticamente os gastos mensais vinculados à categoria Assinaturas.
- Manter os lançamentos futuros sincronizados quando nome, valor, data, essencialidade ou recorrência forem alterados.
- Ao pausar ou excluir uma assinatura, interromper/remover apenas os lançamentos futuros relacionados, preservando o histórico passado.
- Incluir assinaturas e seus lançamentos no backup, restauração e limpeza segura dos dados.

## Dashboard

- Adicionar um gráfico de rosca **Assinaturas essenciais x não essenciais**, com valores e proporções mensais.
- O gráfico acompanhará o mês selecionado no Dashboard e usará as cores do tema ativo.
- Incluir o novo gráfico no controle já existente de exibir/ocultar gráficos.

## Detalhes técnicos

- Criar tabelas protegidas por usuário para assinaturas e cobranças recorrentes, com permissões e políticas de acesso.
- Vincular cada cobrança gerada ao gasto correspondente para evitar duplicações e permitir sincronização segura.
- Criar a nova rota com metadados próprios e manter a interface responsiva nos mesmos padrões visuais do app.
- Validar criação, edição, pausa, exclusão, geração dos gastos e visualização do gráfico em desktop e mobile.
