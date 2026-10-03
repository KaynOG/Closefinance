import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Tags,
  BookOpen,
  Menu,
  Activity,
  X,
  LogOut,
  User as UserIcon,
  Trophy,
  Landmark,
  Receipt,
  HandCoins,
  Repeat2,
  FolderKanban,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { getRank } from "@/lib/ranks";
import { Logo } from "./Logo";
import { installGlobalClickSounds } from "@/lib/sound";
import { initTheme } from "@/lib/theme";
const ConsentModal = lazy(() => import("./ConsentModal").then((m) => ({ default: m.ConsentModal })));
const SavingsMonitor = lazy(() => import("./SavingsMonitor").then((m) => ({ default: m.SavingsMonitor })));
const OnboardingModal = lazy(() => import("./OnboardingModal").then((m) => ({ default: m.OnboardingModal })));
import { ThemeToggle } from "./ThemeToggle";
import { RouteLoader } from "./RouteLoader";
const LicenseNotice = lazy(() => import("./LicenseNotice").then((m) => ({ default: m.LicenseNotice })));


const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ganhos", label: "Ganhos", icon: TrendingUp },
  { to: "/gastos", label: "Gastos", icon: TrendingDown },
  { to: "/transacoes", label: "Transações (BETA)", icon: Activity },
  { to: "/calendario", label: "Calendário", icon: Calendar },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/bancos", label: "Bancos", icon: Landmark },
  { to: "/dividas", label: "Dívidas", icon: Receipt },
  { to: "/devedores", label: "Devedores", icon: HandCoins },
  { to: "/assinaturas", label: "Assinaturas (BETA)", icon: Repeat2 },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/categorias", label: "Categorias", icon: Tags },
  { to: "/missoes", label: "Missões", icon: Trophy },
  { to: "/educacao", label: "Educação", icon: BookOpen },
  { to: "/perfil", label: "Perfil & Ajustes", icon: UserIcon },
] as const;

export function AppShell({ children }: { children?: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [state, api, user] = useStore();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deferred, setDeferred] = useState(false);

  useEffect(() => {
    setMounted(true);
    installGlobalClickSounds();
    initTheme();
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    const schedule = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600));
    schedule(() => setDeferred(true));
  }, []);
  useEffect(() => {
    if (mounted && !state.loading && !user && pathname !== "/auth") {
      navigate({ to: "/auth" });
    }
  }, [mounted, state.loading, user, pathname, navigate]);
  useEffect(() => {
    if (user) {
      api.awardMission("daily_login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user || !mounted) {
    return (
      <div className="min-h-screen grid place-items-center gap-3 text-sm text-muted-foreground font-mono">
        {state.loading || !mounted ? (
          <span className="block size-9 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
        ) : null}
      </div>
    );
  }


  return (
    <div className="min-h-screen flex">
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onClick={() => setExpanded((v) => !v)}
        className={`glass hidden lg:flex shrink-0 flex-col gap-2 p-3 m-4 rounded-lg sticky top-4 h-[calc(100vh-2rem)] overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          expanded ? "w-64" : "w-[76px]"
        }`}
      >
        <Brand compact hideText={!expanded} />
        <nav className="mt-6 flex flex-col gap-1">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                title={n.label}
                data-sound="nav"
                className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-violet)]"
                    : "hover:bg-white/5 text-foreground/80 hover:text-foreground"
                }`}
              >
                <n.icon className="size-4 shrink-0" />
                <span
                  className={`truncate transition-all duration-300 ${
                    expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 w-0"
                  }`}
                >
                  {n.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2">
          <Link to="/perfil" className="rounded-md p-2 glass flex items-center gap-3 hover:bg-white/5 transition">
            {(() => {
              const r = getRank(state.missions.totalPoints, user.gender);
              return (
                <div
                  className="size-9 rounded-full bg-[image:var(--gradient-primary)] grid place-items-center text-sm font-bold overflow-hidden border-2"
                  style={{ borderColor: r.current.color, boxShadow: `0 0 10px ${r.current.color}80` }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="size-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              );
            })()}
            <div className={`min-w-0 flex-1 transition-all duration-300 ${expanded ? "opacity-100" : "opacity-0 w-0"}`}>
              <p className="text-sm font-semibold truncate">{user.name}</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                api.logout();
                sessionStorage.removeItem("closefinance:greeting");
                navigate({ to: "/auth" });
              }}
              className={`rounded-md p-1.5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all duration-300 ${expanded ? "opacity-100" : "opacity-0 w-0 p-0 overflow-hidden"}`}
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </Link>
        </div>
      </aside>

      <div
        className="lg:hidden fixed top-0 inset-x-0 z-40 glass-strong px-4 py-3 flex items-center justify-between mx-3 rounded-2xl"
        style={{ marginTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <Brand compact />
        <button onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-white/10 active:scale-95 transition">
          <Menu className="size-5" />
        </button>
      </div>


      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-3 top-3 bottom-3 w-72 glass-strong rounded-3xl p-5 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Brand compact />
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-white/10">
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">
              {nav.map((n) => {
                const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    data-sound="nav"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition active:scale-95 ${
                      active ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-foreground/80"
                    }`}
                  >
                    <n.icon className="size-4" /> {n.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={() => {
                api.logout();
                sessionStorage.removeItem("closefinance:greeting");
                navigate({ to: "/auth" });
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm hover:bg-white/5"
            >
              <LogOut className="size-4" /> Sair
            </button>
          </div>
        </div>
      )}

      <main
        className="flex-1 min-w-0 p-4 lg:px-8 lg:py-6 pt-20 lg:pt-6 safe-area-main"
      >
        <div key={pathname} className="page-enter mx-auto w-full max-w-[1440px] 2xl:max-w-[1760px] min-[2200px]:max-w-[2040px]">
          {children ?? <Outlet />}
        </div>
      </main>



      {/* Botão fixo de alternar tema — mesmo lugar em todas as abas */}
      <div
        className="fixed z-40 right-4 lg:right-6"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div className="glass-strong rounded-2xl p-1 shadow-lg">
          <ThemeToggle />
        </div>
      </div>

      <RouteLoader />
      {deferred && (
        <Suspense fallback={null}>
          <ConsentModal />
          <SavingsMonitor />
          <OnboardingModal />
          <LicenseNotice />
        </Suspense>
      )}
    </div>
  );
}

function Brand({ compact = false, hideText = false }: { compact?: boolean; hideText?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
        <Logo size={compact ? 34 : 38} />
      </div>
      {!compact ? (
        <div>
          <p className="font-display font-bold leading-none text-lg">CloseFinance</p>
          <p className="font-mono text-[10px] text-muted-foreground leading-none mt-1">
            Bolso fechado, financeiro guardado
          </p>
        </div>
      ) : (
        <p className={`font-display font-bold text-lg whitespace-nowrap transition-all duration-300 ${hideText ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>CloseFinance</p>
      )}
    </Link>
  );
}

export { UserIcon };
