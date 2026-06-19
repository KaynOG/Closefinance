import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { Trophy, Flame, Award, CheckCircle2, Circle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/missoes")({
  head: () => ({ meta: [{ title: "Missões — CloseFinance" }, { name: "description", content: "Acompanhe suas missões diárias e pontuação." }] }),
  component: MissoesPage,
});

const DAILY_MISSIONS = [
  { id: "m1", title: "Registre um gasto de hoje", desc: "Mantenha a planilha viva.", points: 10 },
  { id: "m2", title: "Classifique como essencial ou não", desc: "Crie consciência de prioridades.", points: 10 },
  { id: "m3", title: "Veja seu saldo do mês", desc: "Olhar é o primeiro passo do controle.", points: 10 },
  { id: "m4", title: "Anote uma meta da semana", desc: "Pequenas metas, grandes resultados.", points: 10 },
];

const RANKS = [
  { name: "Iniciante", min: 0, color: "#FFCC00" },
  { name: "Aprendiz", min: 100, color: "#22C3CC" },
  { name: "Disciplinado", min: 300, color: "#2BD9A1" },
  { name: "Estrategista", min: 700, color: "#540BD3" },
  { name: "Mestre Financeiro", min: 1500, color: "#FF6B1A" },
];

function MissoesPage() {
  const [{ missions }, api] = useStore();

  const rank = useMemo(() => {
    let r = RANKS[0];
    for (const x of RANKS) if (missions.totalPoints >= x.min) r = x;
    const next = RANKS.find(x => x.min > missions.totalPoints);
    return { current: r, next, progress: next ? Math.round(((missions.totalPoints - r.min) / (next.min - r.min)) * 100) : 100 };
  }, [missions.totalPoints]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    missions.history.forEach(h => {
      const day = h.date.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + h.points);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  }, [missions.history]);

  const completedToday = missions.completed.length;
  const todayPoints = missions.history.filter(h => h.date.slice(0, 10) === missions.date).reduce((s, h) => s + h.points, 0);

  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Gamificação</p>
        <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3">Missões <Trophy className="size-8 text-secondary" /></h1>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Pontos totais" value={missions.totalPoints.toString()} accent="yellow" sub="acumulado" />
        <Stat label="Hoje" value={`+${Math.max(0, todayPoints)}`} accent="success" sub={`${completedToday}/${DAILY_MISSIONS.length} missões`} />
        <Stat label="Patente" value={rank.current.name} accent="violet" sub={rank.next ? `+${rank.next.min - missions.totalPoints} p/ ${rank.next.name}` : "máxima"} />
        <Stat label="Dias com pontos" value={byDay.length.toString()} accent="teal" sub="histórico recente" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="lg:col-span-2">
          <SectionTitle title="Missões de hoje" subtitle={`+${DAILY_MISSIONS.reduce((s, m) => s + m.points, 0)} pontos possíveis`} />
          <ul className="space-y-2">
            {DAILY_MISSIONS.map((m) => {
              const done = missions.completed.includes(m.id);
              return (
                <li key={m.id}>
                  <button onClick={() => api.toggleMission(m.id)}
                    className={`w-full flex items-start gap-3 text-left rounded-2xl p-3 border transition active:scale-[0.99] ${done ? "bg-[#2BD9A1]/10 border-[#2BD9A1]/40" : "border-border hover:bg-white/5"}`}>
                    {done ? <CheckCircle2 className="size-5 text-[#2BD9A1] shrink-0 mt-0.5" /> : <Circle className="size-5 text-muted-foreground shrink-0 mt-0.5" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{m.title}</p>
                        <span className="font-mono text-[10px] rounded-md px-2 py-0.5 bg-secondary/20 text-secondary shrink-0">+{m.points} pts</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Award className="size-5" style={{ color: rank.current.color }} />
            <h3 className="font-semibold">Sua patente</h3>
          </div>
          <p className="font-display font-bold text-2xl" style={{ color: rank.current.color }}>{rank.current.name}</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">{missions.totalPoints} pts acumulados</p>
          {rank.next && (
            <>
              <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full transition-all duration-700" style={{ width: `${rank.progress}%`, background: `linear-gradient(90deg, ${rank.current.color}, ${rank.next.color})` }} />
              </div>
              <p className="mt-2 text-xs font-mono text-muted-foreground">
                Faltam <span className="text-foreground">{rank.next.min - missions.totalPoints} pontos</span> para <span className="text-foreground">{rank.next.name}</span>
              </p>
            </>
          )}
          <ul className="mt-5 space-y-2">
            {RANKS.map((r) => (
              <li key={r.name} className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: r.color }} />
                  <span className={r.name === rank.current.name ? "text-foreground font-semibold" : "text-muted-foreground"}>{r.name}</span>
                </span>
                <span className="text-muted-foreground">{r.min} pts</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>

      <GlassCard>
        <SectionTitle title="Histórico de pontuação" subtitle="últimos 14 dias com atividade" />
        {byDay.length === 0 ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Sparkles className="size-4" /> Complete sua primeira missão para começar a pontuar!</p>
        ) : (
          <ul className="space-y-2">
            {byDay.map(([day, pts]) => (
              <li key={day} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                <span className="font-mono text-sm flex items-center gap-2">
                  <Flame className="size-4 text-secondary" />
                  {new Date(day + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                </span>
                <span className={`font-mono font-semibold ${pts >= 0 ? "text-[#7DF2C5]" : "text-[#FF8FA3]"}`}>{pts >= 0 ? "+" : ""}{pts} pts</span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </AppShell>
  );
}
