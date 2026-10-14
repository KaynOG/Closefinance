import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

// Os blocos não usam mais "ocultar" via olho; quando precisam ser retraídos,
// cada tela usa o padrão de expand/collapse com chevron. As props hideKey/hideLabel
// são aceitas por compatibilidade mas ignoradas.
type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  hideKey?: string;
  hideLabel?: string;
};

export function GlassCard({ className, hideKey: _hk, hideLabel: _hl, children, ...props }: GlassCardProps) {
  void _hk; void _hl;
  return (
    <div className={cn("glass panel-depth rounded-3xl p-3.5 sm:p-5 relative animate-in fade-in zoom-in-95 duration-300", className)} {...props}>
      {children}
    </div>
  );
}

export function GlassPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-strong panel-depth rounded-3xl p-4 sm:p-6", className)} {...props} />;
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3.5 sm:gap-4 sm:mb-5">
      <div>
        <h2 className="text-base sm:text-xl lg:text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-[11px] sm:text-sm font-mono text-muted-foreground mt-0.5 sm:mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, sub, accent = "violet", hideKey: _hk }: {
  label: string; value: string; sub?: string;
  accent?: "violet" | "yellow" | "teal" | "crimson" | "success" | "danger";
  hideKey?: string;
}) {
  void _hk;
  // Uses theme tokens so the glow follows the active palette
  const accentVar: Record<string, string> = {
    violet: "var(--primary)",
    yellow: "var(--secondary)",
    teal: "var(--primary)",
    crimson: "var(--destructive)",
    success: "var(--success)",
    danger: "var(--danger)",
  };
  const color = accentVar[accent];
  return (
    <div className="glass panel-depth rounded-2xl p-3.5 sm:p-5 relative overflow-hidden isolate animate-in fade-in zoom-in-95 duration-300">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 60% at 100% 0%, color-mix(in oklab, ${color} 45%, transparent), transparent 70%)`,
        }}
      />
      <div className="relative">
        <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <p className="mt-1.5 text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
        {sub && <p className="mt-1 text-[10px] sm:text-xs font-mono text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
