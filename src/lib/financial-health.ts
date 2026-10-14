import {
  monthExpenseTotal,
  isCashFlowExpense,
  isCreditPurchase,
  isSameMonth,
  formatBRL,
  type Transaction,
  type Category,
  type Card,
} from "@/lib/store";

export type MonthSummary = {
  key: string;
  label: string;
  income: number;
  expense: number;
  nonEssential: number;
  byCat: Map<string, number>;
};

export type Pillar = { id: string; label: string; points: number; max: number; hint: string };

export type Insight = {
  id: string;
  title: string;
  description: string;
  monthlySaving: number;
  severity: "info" | "warn" | "critical" | "good";
};

export type HealthAnalysis = {
  months: MonthSummary[]; // [0] = mês atual, depois anteriores
  current: MonthSummary;
  avgExpense: number; // média dos últimos 3 meses anteriores (com dados)
  avgIncome: number;
  paceExpense: number; // projeção do mês atual no ritmo atual
  expenseVsAvg: number | null; // % variação ritmo vs média
  prevExpense: number;
  savingsRate: number;
  score: number;
  grade: { label: string; color: string; message: string };
  pillars: Pillar[];
  insights: Insight[];
  catChanges: { id: string; name: string; current: number; avg: number; diff: number }[];
};

const MONTHS_BACK = 6;

function summarize(transactions: Transaction[], cards: Card[], ref: Date): MonthSummary {
  const exp = transactions.filter(t => isSameMonth(t.date, ref) && (isCashFlowExpense(t) || isCreditPurchase(t)));
  const byCat = new Map<string, number>();
  let nonEssential = 0;
  for (const t of exp) {
    const k = t.categoryId || "__none__";
    byCat.set(k, (byCat.get(k) || 0) + t.amount);
    if (t.essential === "non_essential") nonEssential += t.amount;
  }
  return {
    key: `${ref.getFullYear()}-${ref.getMonth()}`,
    label: ref.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    income: transactions.filter(t => t.type === "income" && isSameMonth(t.date, ref)).reduce((s, t) => s + t.amount, 0),
    expense: monthExpenseTotal(transactions, cards, ref),
    nonEssential,
    byCat,
  };
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pct = (v: number) => `${Math.round(v * 100)}%`;

export function analyzeHealth(transactions: Transaction[], categories: Category[], cards: Card[]): HealthAnalysis {
  const now = new Date();
  const months: MonthSummary[] = Array.from({ length: MONTHS_BACK + 1 }, (_, i) =>
    summarize(transactions, cards, new Date(now.getFullYear(), now.getMonth() - i, 1)),
  );
  const current = months[0];
  const past = months.slice(1).filter(m => m.income > 0 || m.expense > 0);
  const last3 = past.slice(0, 3);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
  const avgExpense = avg(last3.map(m => m.expense));
  const avgIncome = avg(last3.map(m => m.income));
  const prevExpense = months[1].expense;

  const day = now.getDate();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // Fatura/contas fixas costumam cair cedo; usa o maior entre o realizado e o ritmo suavizado
  const paceExpense = Math.max(current.expense, day >= 5 ? (current.expense / day) * dim * 0.85 : current.expense);
  const expenseVsAvg = avgExpense > 0 ? paceExpense / avgExpense - 1 : null;

  const income = current.income || avgIncome; // renda ainda não caiu? usa a média
  const savingsRate = income > 0 ? (income - paceExpense) / income : 0;

  // ---------- Pilares (total 100) ----------
  const pillars: Pillar[] = [];
  // 1. Poupança (30): 20%+ = nota máxima
  const pSave = income > 0 ? Math.round(clamp(savingsRate / 0.2, 0, 1) * 30) : 0;
  pillars.push({ id: "save", label: "Taxa de poupança", points: pSave, max: 30, hint: income > 0 ? `${pct(Math.max(0, savingsRate))} da renda sobrando (meta 20%)` : "registre seus ganhos" });
  // 2. Comprometimento da renda (20): gastos <= 70% da renda = máx, >= 100% = 0
  const commit = income > 0 ? paceExpense / income : 1;
  const pCommit = Math.round(clamp((1 - commit) / 0.3, 0, 1) * 20);
  pillars.push({ id: "commit", label: "Renda comprometida", points: pCommit, max: 20, hint: income > 0 ? `${pct(commit)} da renda vai para gastos` : "sem renda registrada" });
  // 3. Controle vs meses passados (20)
  const pTrend = expenseVsAvg === null ? 12 : Math.round(clamp(1 - expenseVsAvg / 0.3, 0, 1) * 20);
  pillars.push({ id: "trend", label: "Gastos vs média", points: pTrend, max: 20, hint: expenseVsAvg === null ? "sem histórico suficiente" : `${expenseVsAvg >= 0 ? "+" : ""}${pct(expenseVsAvg)} vs média de ${last3.length} ${last3.length === 1 ? "mês" : "meses"}` });
  // 4. Não essenciais (15): <=20% máx, >=50% zero
  const neShare = current.expense > 0 ? current.nonEssential / current.expense : 0;
  const pNe = Math.round(clamp((0.5 - neShare) / 0.3, 0, 1) * 15);
  pillars.push({ id: "ne", label: "Gastos não essenciais", points: pNe, max: 15, hint: `${pct(neShare)} dos gastos do mês` });
  // 5. Consistência (15): meses passados fechados no azul
  const positive = past.filter(m => m.income - m.expense >= 0).length;
  const pCons = past.length ? Math.round((positive / past.length) * 15) : 8;
  pillars.push({ id: "cons", label: "Consistência", points: pCons, max: 15, hint: past.length ? `${positive} de ${past.length} meses fechados no positivo` : "sem histórico suficiente" });

  const hasData = current.income > 0 || current.expense > 0 || past.length > 0;
  const score = hasData ? clamp(pillars.reduce((s, p) => s + p.points, 0), 0, 100) : 0;
  const grade =
    score >= 80 ? { label: "Excelente", color: "#2BD9A1", message: "Finanças sob controle. Hora de fazer o dinheiro trabalhar por você." }
    : score >= 60 ? { label: "Boa", color: "#7DD3FC", message: "Você está bem, mas ainda há espaço para poupar mais." }
    : score >= 40 ? { label: "Atenção", color: "#FFCC00", message: "Seus gastos estão apertando a renda. Pequenos cortes fazem diferença." }
    : score >= 20 ? { label: "Frágil", color: "#FF8FA3", message: "Pouca folga no orçamento. Revise prioridades este mês." }
    : { label: "Crítica", color: "#FF4D6D", message: hasData ? "Gastos acima do que entra. Foque em cortar o excedente." : "Registre ganhos e gastos para receber sua análise." };

  // ---------- Variação por categoria ----------
  const catName = (id: string) => categories.find(c => c.id === id)?.name ?? "Sem categoria";
  const ids = new Set<string>([...current.byCat.keys(), ...last3.flatMap(m => [...m.byCat.keys()])]);
  const catChanges = [...ids]
    .map(id => {
      const cur = current.byCat.get(id) || 0;
      const a = avg(last3.map(m => m.byCat.get(id) || 0));
      return { id, name: catName(id), current: cur, avg: a, diff: cur - a };
    })
    .filter(c => c.avg > 0 || c.current > 0)
    .sort((a, b) => b.diff - a.diff);

  // ---------- Insights ----------
  const insights: Insight[] = [];
  if (!hasData) {
    insights.push({ id: "no-data", title: "Comece registrando seus lançamentos", description: "Adicione ganhos e gastos para receber comparações com meses anteriores e dicas personalizadas.", monthlySaving: 0, severity: "info" });
  } else {
    if (income > 0 && paceExpense > income) {
      insights.push({ id: "overspending", title: "No ritmo atual, você vai gastar mais do que ganha", description: `Projeção do mês: ${formatBRL(paceExpense)} de gastos para ${formatBRL(income)} de renda. Faltam ${formatBRL(paceExpense - income)} — que gasto você consegue adiar?`, monthlySaving: paceExpense - income, severity: "critical" });
    }
    if (expenseVsAvg !== null && expenseVsAvg > 0.1) {
      insights.push({ id: "above-avg", title: `Gastos ${pct(expenseVsAvg)} acima da sua média`, description: `Sua média dos últimos meses é ${formatBRL(avgExpense)} e este mês caminha para ${formatBRL(paceExpense)}. O que mudou? Foi algo pontual ou um novo hábito?`, monthlySaving: paceExpense - avgExpense, severity: "warn" });
    } else if (expenseVsAvg !== null && expenseVsAvg < -0.1) {
      insights.push({ id: "below-avg", title: `Você está gastando ${pct(-expenseVsAvg)} menos que a média`, description: `Ótimo! Economia estimada de ${formatBRL(avgExpense - paceExpense)} em relação aos meses anteriores. Que tal guardar essa diferença?`, monthlySaving: 0, severity: "good" });
    }
    if (prevExpense > 0 && current.expense > prevExpense) {
      insights.push({ id: "vs-prev", title: "Você já passou o total do mês passado", description: `Até agora: ${formatBRL(current.expense)}. Mês passado inteiro: ${formatBRL(prevExpense)}. Ainda faltam ${dim - day} dias.`, monthlySaving: 0, severity: "warn" });
    }
    for (const c of catChanges.slice(0, 2)) {
      if (c.avg > 0 && c.diff > Math.max(50, c.avg * 0.25)) {
        insights.push({ id: `cat-up-${c.id}`, title: `"${c.name}" subiu ${pct(c.diff / c.avg)}`, description: `Você gastou ${formatBRL(c.current)} contra uma média de ${formatBRL(c.avg)}. Voltar ao seu padrão economiza ${formatBRL(c.diff)}.`, monthlySaving: c.diff, severity: "warn" });
      }
    }
    if (neShare > 0.3) {
      const cut = current.nonEssential * 0.3;
      insights.push({ id: "cut-ne", title: "Reduza 30% dos não essenciais", description: `${pct(neShare)} dos seus gastos são não essenciais (${formatBRL(current.nonEssential)}). Antes de comprar, espere 48h: muita vontade passa sozinha.`, monthlySaving: cut, severity: "warn" });
    }
    if (income > 0 && current.income > 0 && avgIncome > 0 && current.income < avgIncome * 0.85) {
      insights.push({ id: "income-drop", title: "Sua renda caiu em relação à média", description: `Entrou ${formatBRL(current.income)} contra média de ${formatBRL(avgIncome)}. Ajuste os gastos ao novo cenário para não entrar no vermelho.`, monthlySaving: 0, severity: "warn" });
    }
    if (income > 0 && savingsRate < 0.2) {
      const target = income * 0.2 - Math.max(0, income - paceExpense);
      if (target > 0) insights.push({ id: "save-20", title: "Guarde ao menos 20% da renda", description: `Hoje sobra ${pct(Math.max(0, savingsRate))}. Para chegar a 20% você precisaria liberar ${formatBRL(target)}/mês. Pague-se primeiro: guarde assim que o salário cair.`, monthlySaving: target, severity: "info" });
    }
    if (past.length >= 2 && positive < past.length / 2) {
      insights.push({ id: "cons", title: "A maioria dos meses fechou no vermelho", description: `Só ${positive} de ${past.length} meses terminaram com sobra. Defina um teto de gastos semanal para quebrar esse ciclo.`, monthlySaving: 0, severity: "critical" });
    }
    insights.push({ id: "subs", title: "Revise assinaturas pouco usadas", description: "Abra a aba Assinaturas e cancele o que você marcou como 'quase não uso' ou 'não necessário'.", monthlySaving: Math.max(30, current.nonEssential * 0.1), severity: "info" });
    insights.push({ id: "emergency", title: "Monte uma reserva de emergência", description: `Meta: 6× seus gastos médios (${formatBRL((avgExpense || current.expense) * 6)}), numa conta que renda ao menos 100% do CDI.`, monthlySaving: Math.max(50, income * 0.05), severity: "info" });
    if (score >= 80) insights.push({ id: "healthy", title: "Você está no caminho certo", description: `Taxa de poupança de ${pct(savingsRate)}. Considere investir a sobra todo mês.`, monthlySaving: 0, severity: "good" });
  }

  return { months, current, avgExpense, avgIncome, paceExpense, expenseVsAvg, prevExpense, savingsRate, score, grade, pillars, insights, catChanges };
}

/** Perguntas de reflexão para a aba de missões */
export function reflectionQuestions(a: HealthAnalysis): string[] {
  const q: string[] = [];
  const top = a.catChanges[0];
  if (top && top.diff > 0) q.push(`Seus gastos com "${top.name}" aumentaram ${formatBRL(top.diff)} — isso te trouxe satisfação proporcional?`);
  if (a.current.nonEssential > 0) q.push(`Se você não tivesse gasto ${formatBRL(a.current.nonEssential)} em não essenciais, o que faria com esse dinheiro?`);
  if (a.expenseVsAvg !== null && a.expenseVsAvg > 0) q.push("O aumento deste mês foi uma necessidade real ou impulso?");
  q.push("Qual compra dos últimos 30 dias você não faria de novo?");
  q.push("Quantas horas de trabalho custou seu maior gasto do mês?");
  return q.slice(0, 4);
}
