import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Calendar, TrendingUp, TrendingDown, CreditCard, Tags, BookOpen, Sparkles, Menu, X, LogOut, User as UserIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Logo } from "./Logo";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ganhos", label: "Ganhos", icon: TrendingUp },
  { to: "/gastos", label: "Gastos", icon: TrendingDown },
  { to: "/calendario", label: "Calendário", icon: Calendar },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/categorias", label: "Categorias", icon: Tags },
  { to: "/educacao", label: "Educação", icon: BookOpen },
  { to: "/design-system", label: "Design System", icon: Sparkles },
] as const;

export function AppShell({ children }: { children?: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [, api, user] = useStore();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !user && pathname !== "/auth") {
      navigate({ to: "/auth" });
    }
  }, [mounted, user, pathname, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="glass hidden lg:flex w-64 shrink-0 flex-col gap-2 p-5 m-4 rounded-3xl sticky top-4 h-[calc(100vh-2rem)]">
        <Brand />
        <nav className="mt-6 flex flex-col gap-1">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                  active ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-violet)]" : "hover:bg-white/5 hover:translate-x-0.5 text-foreground/80 hover:text-foreground"
                }`}>
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2">
          <div className="rounded-2xl p-3 glass flex items-center gap-3">
            <div className="size-9 rounded-full bg-[image:var(--gradient-primary)] grid place-items-center text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground truncate">{user.email}</p>
            </div>
            <button onClick={() => { api.logout(); navigate({ to: "/auth" }); }} className="rounded-lg p-1.5 hover:bg-white/10 text-muted-foreground hover:text-foreground" aria-label="Sair">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass-strong px-4 py-3 flex items-center justify-between m-3 rounded-2xl">
        <Brand compact />
        <button onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-white/10 active:scale-95 transition">
          <Menu className="size-5" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setOpen(false)}>
          <div className="absolute right-3 top-3 bottom-3 w-72 glass-strong rounded-3xl p-5 animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <Brand compact />
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-white/10"><X className="size-5" /></button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">
              {nav.map((n) => {
                const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
                return (
                  <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition active:scale-95 ${
                      active ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-foreground/80"
                    }`}>
                    <n.icon className="size-4" /> {n.label}
                  </Link>
                );
              })}
            </nav>
            <button onClick={() => { api.logout(); navigate({ to: "/auth" }); }} className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm hover:bg-white/5">
              <LogOut className="size-4" /> Sair
            </button>
          </div>
        </div>
      )}

      <main key={pathname} className="flex-1 min-w-0 p-4 lg:p-8 pt-20 lg:pt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
        <Logo size={compact ? 34 : 38} />
      </div>
      {!compact ? (
        <div>
          <p className="font-display font-bold leading-none text-lg">CloseFinance</p>
          <p className="font-mono text-[10px] text-muted-foreground leading-none mt-1">close your numbers</p>
        </div>
      ) : (
        <p className="font-display font-bold text-lg">CloseFinance</p>
      )}
    </Link>
  );
}

export { UserIcon };
