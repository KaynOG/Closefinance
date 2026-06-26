import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { BookOpen, Lightbulb, Target, PiggyBank, ShieldCheck, TrendingDown, Wallet, HeartPulse, Receipt, Calendar, Sparkles, BadgePercent, Rocket, Briefcase, GraduationCap, LineChart, Coins, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/educacao")({
  head: () => ({ meta: [{ title: "Educação financeira — CloseFinance" }, { name: "description", content: "Conceitos e práticas para evoluir suas finanças." }] }),
  component: EduPage,
});

const LESSONS = [
  { icon: PiggyBank, color: "#2BD9A1", tag: "Poupar", title: "Regra 50 / 30 / 20", summary: "Como dividir sua renda entre necessidades, desejos e poupança.",
    body: "Direcione 50% da renda para necessidades essenciais, 30% para desejos e 20% para poupança e investimento. É um ponto de partida — adapte ao seu momento de vida." },
  { icon: ShieldCheck, color: "#006F77", tag: "Segurança", title: "Reserva de emergência", summary: "O cinto de segurança que evita dívidas em imprevistos.",
    body: "Construa uma reserva equivalente a 3–6 meses dos seus gastos essenciais em ativos líquidos e seguros. Ela é o cinto de segurança que evita dívidas em imprevistos." },
  { icon: Target, color: "#FFCC00", tag: "Metas", title: "Defina metas SMART", summary: "Como transformar desejos vagos em objetivos atingíveis.",
    body: "Específicas, Mensuráveis, Atingíveis, Relevantes e com prazo. Ex.: 'Guardar R$ 6.000 em 12 meses para uma viagem' supera 'quero juntar dinheiro'." },
  { icon: Lightbulb, color: "#540BD3", tag: "Consciência", title: "Essencial vs. não essencial", summary: "Aprenda a separar gastos obrigatórios dos desejos.",
    body: "Gastos essenciais mantêm sua vida funcionando (moradia, comida, saúde). Não essenciais são desejos. Categorize tudo para enxergar onde existe gordura para cortar." },
  { icon: BookOpen, color: "#820432", tag: "Crédito", title: "Cuidado com o crédito rotativo", summary: "Por que o rotativo do cartão é uma das dívidas mais caras.",
    body: "Juros do rotativo do cartão estão entre os mais altos do mercado. Use o limite como meio de pagamento, nunca como extensão da renda." },
  { icon: Sparkles, color: "#FFCC00", tag: "Hábito", title: "Pague-se primeiro", summary: "Automatize sua poupança antes de gastar com o que sobra.",
    body: "Assim que a renda cair, transfira automaticamente 10–20% para uma conta de reserva ou investimento. O que sobra é o que você pode gastar." },
  { icon: TrendingDown, color: "#FF6B1A", tag: "Gastar menos", title: "Regra das 24 horas", summary: "Combata o impulso de compra com uma pausa estratégica.",
    body: "Antes de qualquer compra por impulso, espere 24h (ou 30 dias se for cara). A maioria dos desejos passa — e o que sobra é desejo real, não impulso." },
  { icon: Receipt, color: "#22C3CC", tag: "Gastar menos", title: "Revise assinaturas todo mês", summary: "Pequenos débitos esquecidos pesam no fim do mês.",
    body: "Streamings, apps e clubes de assinatura se acumulam silenciosamente. Liste todas, cancele as que você não usou nos últimos 30 dias e libere caixa mensal." },
  { icon: Wallet, color: "#2BD9A1", tag: "Poupar", title: "Método dos envelopes (digital)", summary: "Defina tetos por categoria e respeite até zerar.",
    body: "Crie 'envelopes' (categorias) com um teto mensal cada. Quando o envelope esvazia, pare de gastar nele. Visual simples, controle real." },
  { icon: BadgePercent, color: "#B388FF", tag: "Compras", title: "Liste antes de comprar", summary: "Listas evitam compras por impulso e excessos.",
    body: "Faça lista de mercado, lista de presentes, lista de desejos. Entrar no e-commerce sem lista é receita pronta para extrapolar o orçamento." },
  { icon: HeartPulse, color: "#FF8FA3", tag: "Saúde financeira", title: "Acompanhe seu score mensalmente", summary: "Acompanhe indicadores-chave para agir a tempo.",
    body: "Veja todo mês: taxa de poupança, % de essenciais e uso do limite do cartão. Score abaixo de 55? É hora de agir. Acima de 75? Mantenha o ritmo." },
  { icon: Calendar, color: "#540BD3", tag: "Rotina", title: "Reunião financeira semanal", summary: "15 minutos por semana valem mais que horas no fim do mês.",
    body: "Reserve 15 minutos por semana para revisar gastos, ajustar categorias e planejar a próxima. Constância vence intensidade no controle financeiro." },
  { icon: PiggyBank, color: "#FFD700", tag: "Investir", title: "Juros compostos a seu favor", summary: "O tempo é o melhor amigo de quem começa cedo.",
    body: "R$ 300/mês a 10% ao ano viram ~R$ 60 mil em 10 anos. Quanto antes começar, mais o tempo trabalha por você. Comece com qualquer valor." },
  { icon: Rocket, color: "#22C3CC", tag: "Aumentar renda", title: "Crie uma segunda fonte de renda", summary: "Renda extra acelera reservas e quitação de dívidas.",
    body: "Freelas, vendas online, aulas particulares, conteúdo. Não precisa ser grande — R$ 500 a mais por mês podem virar reserva, investimento ou quitar uma dívida cara." },
  { icon: Briefcase, color: "#540BD3", tag: "Carreira", title: "Invista na sua principal habilidade", summary: "Educação e cursos costumam ter o melhor ROI.",
    body: "Um curso, certificação ou idioma podem destravar promoções e aumentos. Investir em você costuma ter o melhor ROI do mercado — retorno em forma de salário." },
  { icon: GraduationCap, color: "#2BD9A1", tag: "Aumentar renda", title: "Negocie seu salário com dados", summary: "Aumento bem fundamentado é o caminho mais rápido.",
    body: "Liste resultados entregues, pesquise faixas salariais da sua função e marque uma conversa. Pedir aumento bem fundamentado é uma das formas mais rápidas de ganhar mais." },
  { icon: LineChart, color: "#FF6B1A", tag: "Investir", title: "Diversifique para proteger e crescer", summary: "Não dependa de um único tipo de ativo.",
    body: "Não coloque tudo em um lugar só: misture renda fixa (CDB, Tesouro), variável (ações, FIIs) e reserva líquida. Diversificação reduz risco sem cortar potencial." },
  { icon: Coins, color: "#FFCC00", tag: "Aumentar renda", title: "Venda o que não usa", summary: "Transforme objetos parados em dinheiro hoje.",
    body: "Roupas, eletrônicos parados, livros, móveis. Marketplaces transformam objetos esquecidos em dinheiro hoje — sem precisar trabalhar mais horas pra isso." },
];

function LessonCard({ l }: { l: typeof LESSONS[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <GlassCard className="relative overflow-hidden !p-3">
      <div className="absolute -top-8 -right-8 size-24 rounded-full opacity-25 blur-2xl" style={{ background: l.color }} />
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg grid place-items-center shrink-0" style={{ background: l.color + "26", color: l.color }}>
            <l.icon className="size-4" />
          </div>
          <h2 className="text-sm font-semibold leading-tight flex-1 truncate" title={l.title}>{l.title}</h2>
          <button onClick={() => setOpen(o => !o)}
            aria-label={open ? "Recolher" : "Expandir"}
            className="rounded-lg border border-border p-1.5 hover:bg-white/5 transition active:scale-95 shrink-0"
            style={{ color: l.color, borderColor: l.color + "55" }}>
            {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>
        <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <p className="text-xs text-muted-foreground mb-1.5">{l.summary}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{l.body}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function EduPage() {
  const [, api] = useStore();
  useEffect(() => { api.awardMission("visit_educacao"); }, []);
  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Aprenda enquanto controla</p>
        <h1 className="text-3xl lg:text-4xl font-bold">Educação <span className="text-gradient">financeira</span></h1>
        <p className="text-muted-foreground mt-2 text-sm">Toque no ícone <ChevronDown className="inline size-3.5" /> para expandir cada card.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
        {LESSONS.map((l) => <LessonCard key={l.title} l={l} />)}
      </div>
    </AppShell>
  );
}
