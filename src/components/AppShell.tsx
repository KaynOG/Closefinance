import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, Wallet, CreditCard, Tags, BookOpen, Sparkles, Menu, X,
} from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendario", label: "Calendário", icon: Calendar },
  { to: "/transacoes", label: "Transações", icon: Wallet },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/categorias", label: "Categorias", icon: Tags },
  { to: "/educacao", label: "Educação", icon: BookOpen },
  { to: "/design-system", label: "Design System", icon: Sparkles },
] as const;

export function AppShell({ children }: { children?: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — desktop */}
      <aside className="glass hidden lg:flex w-64 shrink-0 flex-col gap-2 p-5 m-4 rounded-3xl sticky top-4 h-[calc(100vh-2rem)]">
        <Brand />
        <nav className="mt-6 flex flex-col gap-1">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-violet)]" : "hover:bg-white/5 text-foreground/80 hover:text-foreground"
                }`}>
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl p-4 glass">
          <p className="text-xs font-mono text-muted-foreground">Versão</p>
          <p className="text-sm font-semibold">Finlux 1.0</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass-strong px-4 py-3 flex items-center justify-between m-3 rounded-2xl">
        <Brand compact />
        <button onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-white/10">
          <Menu className="size-5" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute right-3 top-3 bottom-3 w-72 glass-strong rounded-3xl p-5 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <Brand compact />
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-white/10"><X className="size-5" /></button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">
              {nav.map((n) => {
                const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
                return (
                  <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-primary text-primary-foreground" : "hover:bg-white/5 text-foreground/80"
                    }`}>
                    <n.icon className="size-4" /> {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 p-4 lg:p-8 pt-20 lg:pt-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="size-9 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center font-display font-bold text-white shadow-[var(--shadow-glow-violet)]">
        F
      </div>
      {!compact && (
        <div>
          <p className="font-display font-bold leading-none text-lg">Finlux</p>
          <p className="font-mono text-[10px] text-muted-foreground leading-none mt-1">finanças com clareza</p>
        </div>
      )}
      {compact && <p className="font-display font-bold text-lg">Finlux</p>}
    </Link>
  );
}
