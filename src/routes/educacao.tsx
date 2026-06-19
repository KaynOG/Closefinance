import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/ui-kit";
import { BookOpen, Lightbulb, Target, PiggyBank, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/educacao")({
  head: () => ({ meta: [{ title: "Educação financeira — Finlux" }, { name: "description", content: "Conceitos e práticas para evoluir suas finanças." }] }),
  component: EduPage,
});

const LESSONS = [
  {
    icon: PiggyBank, color: "#2BD9A1",
    title: "Regra 50 / 30 / 20",
    body: "Direcione 50% da renda para necessidades essenciais, 30% para desejos e 20% para poupança e investimento. É um ponto de partida — adapte ao seu momento de vida.",
  },
  {
    icon: ShieldCheck, color: "#006F77",
    title: "Reserva de emergência",
    body: "Construa uma reserva equivalente a 3–6 meses dos seus gastos essenciais em ativos líquidos e seguros. Ela é o cinto de segurança que evita dívidas em imprevistos.",
  },
  {
    icon: Target, color: "#FFCC00",
    title: "Defina metas SMART",
    body: "Específicas, Mensuráveis, Atingíveis, Relevantes e com prazo. Ex.: 'Guardar R$ 6.000 em 12 meses para uma viagem' supera 'quero juntar dinheiro'.",
  },
  {
    icon: Lightbulb, color: "#540BD3",
    title: "Essencial vs. não essencial",
    body: "Gastos essenciais mantêm sua vida funcionando (moradia, comida, saúde). Não essenciais são desejos. Categorize tudo para enxergar onde existe gordura para cortar.",
  },
  {
    icon: BookOpen, color: "#820432",
    title: "Cuidado com o crédito rotativo",
    body: "Juros do rotativo do cartão estão entre os mais altos do mercado. Use o limite como meio de pagamento, nunca como extensão da renda.",
  },
];

function EduPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Aprenda enquanto controla</p>
        <h1 className="text-3xl lg:text-4xl font-bold">Educação <span className="text-gradient">financeira</span></h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">Pequenos conceitos, grandes mudanças. Comece com o essencial.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LESSONS.map((l) => (
          <GlassCard key={l.title} className="relative overflow-hidden">
            <div className="absolute -top-10 -right-10 size-32 rounded-full opacity-30 blur-2xl" style={{ background: l.color }} />
            <div className="relative">
              <div className="size-11 rounded-xl grid place-items-center mb-3" style={{ background: l.color + "26", color: l.color }}>
                <l.icon className="size-5" />
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
