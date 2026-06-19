import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui-kit";
import { BookOpen, Lightbulb, Target, PiggyBank, ShieldCheck, TrendingDown, Wallet, HeartPulse, Receipt, Calendar, Sparkles, BadgePercent } from "lucide-react";

export const Route = createFileRoute("/educacao")({
  head: () => ({ meta: [{ title: "Educação financeira — CloseFinance" }, { name: "description", content: "Conceitos e práticas para evoluir suas finanças." }] }),
  component: EduPage,
});

const LESSONS = [
  { icon: PiggyBank, color: "#2BD9A1", tag: "Poupar",
    title: "Regra 50 / 30 / 20",
    body: "Direcione 50% da renda para necessidades essenciais, 30% para desejos e 20% para poupança e investimento. É um ponto de partida — adapte ao seu momento de vida." },
  { icon: ShieldCheck, color: "#006F77", tag: "Segurança",
    title: "Reserva de emergência",
    body: "Construa uma reserva equivalente a 3–6 meses dos seus gastos essenciais em ativos líquidos e seguros. Ela é o cinto de segurança que evita dívidas em imprevistos." },
  { icon: Target, color: "#FFCC00", tag: "Metas",
    title: "Defina metas SMART",
    body: "Específicas, Mensuráveis, Atingíveis, Relevantes e com prazo. Ex.: 'Guardar R$ 6.000 em 12 meses para uma viagem' supera 'quero juntar dinheiro'." },
  { icon: Lightbulb, color: "#540BD3", tag: "Consciência",
    title: "Essencial vs. não essencial",
    body: "Gastos essenciais mantêm sua vida funcionando (moradia, comida, saúde). Não essenciais são desejos. Categorize tudo para enxergar onde existe gordura para cortar." },
  { icon: BookOpen, color: "#820432", tag: "Crédito",
    title: "Cuidado com o crédito rotativo",
    body: "Juros do rotativo do cartão estão entre os mais altos do mercado. Use o limite como meio de pagamento, nunca como extensão da renda." },
  { icon: Sparkles, color: "#FFCC00", tag: "Hábito",
    title: "Pague-se primeiro",
    body: "Assim que a renda cair, transfira automaticamente 10–20% para uma conta de reserva ou investimento. O que sobra é o que você pode gastar." },
  { icon: TrendingDown, color: "#FF6B1A", tag: "Gastar menos",
    title: "Regra das 24 horas",
    body: "Antes de qualquer compra por impulso, espere 24h (ou 30 dias se for cara). A maioria dos desejos passa — e o que sobra é desejo real, não impulso." },
  { icon: Receipt, color: "#22C3CC", tag: "Gastar menos",
    title: "Revise assinaturas todo mês",
    body: "Streamings, apps e clubes de assinatura se acumulam silenciosamente. Liste todas, cancele as que você não usou nos últimos 30 dias e libere caixa mensal." },
  { icon: Wallet, color: "#2BD9A1", tag: "Poupar",
    title: "Método dos envelopes (digital)",
    body: "Crie 'envelopes' (categorias) com um teto mensal cada. Quando o envelope esvazia, pare de gastar nele. Visual simples, controle real." },
  { icon: BadgePercent, color: "#B388FF", tag: "Compras",
    title: "Liste antes de comprar",
    body: "Faça lista de mercado, lista de presentes, lista de desejos. Entrar no e-commerce sem lista é receita pronta para extrapolar o orçamento." },
  { icon: HeartPulse, color: "#FF8FA3", tag: "Saúde financeira",
    title: "Acompanhe seu score mensalmente",
    body: "Veja todo mês: taxa de poupança, % de essenciais e uso do limite do cartão. Score abaixo de 55? É hora de agir. Acima de 75? Mantenha o ritmo." },
  { icon: Calendar, color: "#540BD3", tag: "Rotina",
    title: "Reunião financeira semanal",
    body: "Reserve 15 minutos por semana para revisar gastos, ajustar categorias e planejar a próxima. Constância vence intensidade no controle financeiro." },
  { icon: PiggyBank, color: "#FFD700", tag: "Investir",
    title: "Juros compostos a seu favor",
    body: "R$ 300/mês a 10% ao ano viram ~R$ 60 mil em 10 anos. Quanto antes começar, mais o tempo trabalha por você. Comece com qualquer valor." },
];

function EduPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Aprenda enquanto controla</p>
        <h1 className="text-3xl lg:text-4xl font-bold">Educação <span className="text-gradient">financeira</span></h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">Pequenos conceitos, grandes mudanças. Práticas para poupar mais, gastar melhor e ter uma saúde financeira de longo prazo.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {LESSONS.map((l) => (
          <GlassCard key={l.title} className="relative overflow-hidden">
            <div className="absolute -top-10 -right-10 size-32 rounded-full opacity-30 blur-2xl" style={{ background: l.color }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="size-11 rounded-xl grid place-items-center" style={{ background: l.color + "26", color: l.color }}>
                  <l.icon className="size-5" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider rounded-md px-2 py-1" style={{ background: l.color + "1A", color: l.color }}>{l.tag}</span>
              </div>
              <h2 className="text-lg font-bold">{l.title}</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{l.body}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  );
}
