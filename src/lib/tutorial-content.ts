// Textos dos tutoriais de cada aba (exibidos pelo TutorialBox).
type T = { storageKey: string; title: string; steps: string[]; tip?: string };

export const TUTORIALS: Record<string, T> = {
  index: {
    storageKey: "dashboard", title: "Como usar o Dashboard",
    steps: [
      "Aqui você vê o resumo do mês: quanto entrou, quanto saiu e quanto sobrou.",
      "Use o filtro de mês no topo para comparar períodos.",
      "Os limites dos cartões mostram quanto já foi usado de cada um.",
      "Os gráficos mostram em quais categorias você mais gasta e o peso dos gastos essenciais.",
      "Toque no medidor de saúde para entender o que está ajudando ou atrapalhando suas finanças.",
    ],
    tip: "Ordem ideal para começar: Categorias → Bancos → Cartões → Ganhos → Gastos.",
  },
  transacoes: {
    storageKey: "transacoes", title: "Como usar Transações",
    steps: [
      "Esta aba junta todos os ganhos e gastos em uma única lista.",
      "Filtre por mês, tipo ou categoria para encontrar um lançamento rápido.",
      "Toque em um lançamento para editar ou apagar.",
      "O bloco de saúde financeira dá uma nota de 0 a 100 e dicas com base nos seus números.",
      "Use 'Extrato PDF' para baixar um relatório do período que quiser.",
    ],
  },
  dividas: {
    storageKey: "dividas", title: "Como usar Dívidas",
    steps: [
      "Cadastre cada dívida com nome, valor total e número de parcelas.",
      "Escolha 'Valores iguais' ou 'Valores desiguais' se as parcelas mudam de valor.",
      "Cada parcela vira um gasto automático na data de vencimento.",
      "Ao pagar, marque a caixinha da parcela — a data muda para o dia do pagamento.",
      "Quando quitar tudo, você pode mover a dívida para o bloco 'Dívidas pagas'.",
    ],
    tip: "Você pode editar nome, data e valor de qualquer parcela, e os gastos são atualizados juntos.",
  },
  devedores: {
    storageKey: "devedores", title: "Como usar Devedores",
    steps: [
      "Registre quem te deve: nome, valor total e número de parcelas.",
      "Cada parcela vira um ganho automático na data combinada.",
      "Quando receber, marque a caixinha — o valor entra no banco escolhido.",
      "Edite o valor ou a data de uma parcela se o combinado mudar.",
    ],
  },
  assinaturas: {
    storageKey: "assinaturas", title: "Como usar Assinaturas",
    steps: [
      "Toque em um serviço popular ou em 'Nova' para cadastrar uma assinatura.",
      "Informe valor, data da primeira cobrança e a cada quantos meses ela se repete.",
      "As cobranças entram sozinhas em Gastos, com a etiqueta Assinatura.",
      "Mudou de plano? Use 'Fez upgrade ou downgrade' e escolha desde qual mês vale o novo valor.",
      "Responda a pergunta semanal de uso para receber o relatório com sugestões de cancelamento.",
    ],
    tip: "Pause uma assinatura em vez de apagar se pretende voltar a usar.",
  },
  projetos: {
    storageKey: "projetos", title: "Como usar Projetos",
    steps: [
      "Crie um projeto (viagem, reforma, curso...) com nome, descrição, capa e data final.",
      "Adicione os gastos do projeto. Marque 'Incluir nos gastos' para que também entrem na aba Gastos.",
      "Crie objetivos com ícone, data e link, e marque quando conseguir cada um.",
      "Use as setas ↑ ↓ para escolher a ordem dos projetos.",
      "No final da página, o relatório compara os gastos de cada projeto mês a mês.",
    ],
  },
  bebe: {
    storageKey: "bebe", title: "Como usar Bebê a caminho",
    steps: [
      "Registre os itens do enxoval e preparativos — eles não entram na aba Gastos.",
      "Marque cada item como essencial ou não essencial e escolha a forma de pagamento.",
      "No 'Fundo para o bebê', anote quanto você guardou em cada mês.",
      "Os gráficos mostram a evolução dos gastos e a divisão do mês atual.",
    ],
  },
  calendario: {
    storageKey: "calendario", title: "Como usar o Calendário",
    steps: [
      "Cada dia mostra os ganhos e gastos lançados naquela data.",
      "Toque em um dia para ver os detalhes.",
      "Use para enxergar quando vencem parcelas, assinaturas e faturas.",
    ],
  },
  missoes: {
    storageKey: "missoes", title: "Como usar Missões",
    steps: [
      "Complete missões diárias para ganhar pontos e subir de patente.",
      "Compartilhe seu código de amigo e compare pontos no ranking.",
      "As missões de saúde financeira trazem desafios para cortar gastos e perguntas para refletir.",
    ],
  },
  educacao: {
    storageKey: "educacao", title: "Como usar Educação",
    steps: [
      "Aqui ficam conteúdos para aprender a organizar melhor o seu dinheiro.",
      "Leia com calma e aplique uma dica de cada vez nas outras abas.",
    ],
  },
};
