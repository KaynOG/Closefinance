import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { GlassCard, SectionTitle, Stat } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { RANKS, getRank } from "@/lib/ranks";
import { useMemo } from "react";
import { Trophy, Flame, CheckCircle2, Circle, Sparkles, Lock } from "lucide-react";

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

function MissoesPage() {
  const [{ missions }, api, user] = useStore();
  const gender = user?.gender;

  const rank = useMemo(() => getRank(missions.totalPoints, gender), [missions.totalPoints, gender]);

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
  const RankIcon = rank.current.Icon;

  return (
    <AppShell>
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Gamificação</p>
        <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3">Missões <Trophy className="size-8 text-secondary" /></h1>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Pontos totais" value={missions.totalPoints.toString()} accent="yellow" sub="acumulado" />
        <Stat label="Hoje" value={`+${Math.max(0, todayPoints)}`} accent="success" sub={`${completedToday}/${DAILY_MISSIONS.length} missões`} />
        <Stat label="Patente" value={rank.displayName} accent="violet" sub={rank.next ? `+${rank.next.min - missions.totalPoints} p/ ${rank.nextDisplayName}` : "máxima"} />
        <Stat label="Dias com pontos" value={byDay.length.toString()} accent="teal" sub="histórico recente" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="lg:col-span-2">
          <SectionTitle title="Missões de hoje" subtitle="cada missão pontua apenas 1× por dia" />
          <ul className="space-y-2">
            {DAILY_MISSIONS.map((m) => {
              const done = missions.completed.includes(m.id);
              const awarded = missions.history.some(h => h.missionId === m.id && h.points > 0 && h.date.slice(0,10) === missions.date);
              return (
                <li key={m.id}>
                  <button onClick={() => api.toggleMission(m.id)}
                    className={`w-full flex items-start gap-3 text-left rounded-2xl p-3 border transition active:scale-[0.99] ${done ? "bg-[#2BD9A1]/10 border-[#2BD9A1]/40" : "border-border hover:bg-white/5"}`}>
                    {done ? <CheckCircle2 className="size-5 text-[#2BD9A1] shrink-0 mt-0.5" /> : <Circle className="size-5 text-muted-foreground shrink-0 mt-0.5" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{m.title}</p>
                        {awarded ? (
                          <span className="font-mono text-[10px] rounded-md px-2 py-0.5 bg-[#2BD9A1]/20 text-[#7DF2C5] shrink-0 flex items-center gap-1"><Lock className="size-3" /> pontuada</span>
                        ) : (
                          <span className="font-mono text-[10px] rounded-md px-2 py-0.5 bg-secondary/20 text-secondary shrink-0">+{m.points} pts</span>
                        )}
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
            <RankIcon className="size-5" style={{ color: rank.current.color }} />
            <h3 className="font-semibold">Sua patente</h3>
          </div>
          <p className="font-display font-bold text-2xl" style={{ color: rank.current.color }}>{rank.displayName}</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">{missions.totalPoints} pts acumulados</p>
          {rank.next && (
            <>
              <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full transition-all duration-700" style={{ width: `${rank.progress}%`, background: `linear-gradient(90deg, ${rank.current.color}, ${rank.next.color})` }} />
              </div>
              <p className="mt-2 text-xs font-mono text-muted-foreground">
                Faltam <span className="text-foreground">{rank.next.min - missions.totalPoints} pontos</span> para <span className="text-foreground">{rank.nextDisplayName}</span>
              </p>
            </>
          )}
          <ul className="mt-5 space-y-2">
            {RANKS.map((r) => {
              const RIcon = r.Icon;
              const label = gender === "female" ? r.nameF : r.name;
              const active = r.id === rank.current.id;
              return (
                <li key={r.id} className={`flex items-center justify-between text-xs font-mono rounded-lg px-2 py-1.5 ${active ? "bg-white/5" : ""}`}>
                  <span className="flex items-center gap-2">
                    <RIcon className="size-4" style={{ color: r.color }} />
                    <span className={active ? "text-foreground font-semibold" : "text-muted-foreground"}>{label}</span>
                  </span>
                  <span className="text-muted-foreground">{r.min} pts</span>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      </section>

      <GlassCard>
        <SectionTitle title="Histórico de pontuação" subtitle="data e hora de cada conclusão" />
        {missions.history.length === 0 ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Sparkles className="size-4" /> Complete sua primeira missão para começar a pontuar!</p>
        ) : (
          <>
            <ul className="space-y-2 mb-5">
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
            <SectionTitle title="Últimas conclusões" subtitle="data e hora exatas" />
            <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {missions.history.slice(0, 30).map((h, i) => {
                const m = DAILY_MISSIONS.find(x => x.id === h.missionId);
                const d = new Date(h.date);
                return (
                  <li key={i} className="flex items-center justify-between text-xs font-mono rounded-lg bg-white/[0.03] px-3 py-2">
                    <span className="truncate">
                      <span className="text-foreground">{m?.title ?? h.missionId}</span>
                      <span className="text-muted-foreground"> · {d.toLocaleDateString("pt-BR")} {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                    <span className={`shrink-0 ${h.points >= 0 ? "text-[#7DF2C5]" : "text-[#FF8FA3]"}`}>{h.points >= 0 ? "+" : ""}{h.points}</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </GlassCard>
    </AppShell>
  );
}
