import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Tags, Landmark, CreditCard, X, Sparkles, ArrowRight, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { useStore } from "@/lib/store";

const STORAGE_PREFIX = "cf_onboarding_seen_";

const STEPS = [
  {
    icon: Tags, color: "#FFCC00", title: "1. Crie suas categorias de gastos",
    desc: "Comece pelas categorias: são as 'gavetas' onde cada gasto será guardado. Cadastre as contas da casa, como Aluguel, Conta de luz, Água, Internet, Mercado, Transporte e Lazer. Sem elas, os gráficos e relatórios ficam vazios.",
    to: "/categorias" as const, cta: "Ir para Categorias",
  },
  {
    icon: Landmark, color: "#22C3CC", title: "2. Cadastre seus bancos",
    desc: "Adicione só os bancos que você usa de verdade, com o saldo atual de cada um. Os ganhos entram no banco escolhido e o app mostra seu saldo total, incluindo o dinheiro físico.",
    to: "/bancos" as const, cta: "Ir para Bancos",
  },
  {
    icon: CreditCard, color: "#540BD3", title: "3. Adicione seus cartões",
    desc: "Cadastre cada cartão de crédito com limite, dia de fechamento e dia de vencimento. Assim, as compras no crédito caem na fatura certa e as parcelas aparecem mês a mês.",
    to: "/cartoes" as const, cta: "Ir para Cartões",
  },
  {
    icon: TrendingUp, color: "#2BD9A1", title: "4. Registre seus ganhos",
    desc: "Lance seu salário e suas rendas extras, escolhendo o banco onde o dinheiro entrou. É com base na sua renda que o app calcula quanto sobra e a sua saúde financeira.",
    to: "/ganhos" as const, cta: "Ir para Ganhos",
  },
  {
    icon: TrendingDown, color: "#FF6B1A", title: "5. Registre seus gastos",
    desc: "Agora é só lançar cada gasto: valor, descrição, categoria, se é essencial e a forma de pagamento. Faça isso no dia a dia — leva segundos e mantém tudo atualizado.",
    to: "/gastos" as const, cta: "Ir para Gastos",
  },
];

export function OnboardingModal() {
  const [, , user] = useStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const key = STORAGE_PREFIX + user.id;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(key) === "1") return;
    // Delay a beat so it doesn't fight page paint
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [user?.id]);

  if (!open || !user) return null;

  function finish() {
    if (user && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_PREFIX + user.id, "1");
    }
    setOpen(false);
  }

  const S = STEPS[step];
  const Icon = S.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in duration-200"
      onClick={finish}
    >
      <div
        className="glass-strong rounded-3xl max-w-lg w-full p-6 sm:p-7 relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: S.color + "55" }}
      >
        <button
          onClick={finish}
          aria-label="Fechar"
          className="absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-4 text-secondary" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-secondary">
            Bem-vindo(a), {user.name.split(" ")[0]}!
          </p>
        </div>

        <div className="flex items-start gap-4 mb-4">
          <div
            className="size-14 rounded-2xl grid place-items-center shrink-0"
            style={{ background: S.color + "22", color: S.color, border: `1px solid ${S.color}66` }}
          >
            <Icon className="size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight">{S.title}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{S.desc}</p>
          </div>
        </div>

        {step === 0 && (
          <div className="rounded-2xl bg-white/5 border border-border p-3 mb-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Dica:</span> comece com poucas categorias amplas (5 a 8). Você pode refinar depois. Sem categorias, seus gastos ficam sem contexto e os gráficos vazios.
            </p>
          </div>
        )}

        <div className="flex items-center gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-8" : "w-1.5"}`}
              style={{ background: i <= step ? S.color : "rgba(255,255,255,0.15)" }}
            />
          ))}
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-xl border border-border px-3 py-2.5 text-sm font-mono text-muted-foreground hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center gap-1.5"
          >
            <ChevronLeft className="size-4" /> Voltar
          </button>

          <Link
            to={S.to}
            onClick={finish}
            className="flex-1 min-w-[160px] rounded-xl font-semibold px-4 py-2.5 text-sm text-center transition hover:opacity-90 inline-flex items-center justify-center gap-2"
            style={{ background: S.color, color: "#0a0a0a" }}
          >
            {S.cta} <ArrowRight className="size-4" />
          </Link>

          {!isLast ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-xl bg-primary text-primary-foreground font-semibold px-4 py-2.5 text-sm hover:opacity-90 inline-flex items-center gap-1.5"
            >
              Próximo <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-mono text-muted-foreground hover:bg-white/5"
            >
              Concluir
            </button>
          )}
        </div>

        <button
          onClick={finish}
          className="mt-3 text-[11px] font-mono text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          pular tutorial
        </button>
      </div>
    </div>
  );
}
