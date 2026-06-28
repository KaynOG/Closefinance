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
    <div className={cn("glass rounded-3xl p-5 relative animate-in fade-in zoom-in-95 duration-300", className)} {...props}>
      {children}
    </div>
  );
}

export function GlassPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-strong rounded-3xl p-6", className)} {...props} />;
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm font-mono text-muted-foreground mt-1">{subtitle}</p>}
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
  const accentMap: Record<string, string> = {
    violet: "from-[#540BD3] to-[#B388FF]",
    yellow: "from-[#f4fafe] to-[#f4fafe]",
    teal: "from-[#006F77] to-[#22C3CC]",
    crimson: "from-[#820432] to-[#D14B72]",
    success: "from-[#2BD9A1] to-[#7DF2C5]",
    danger: "from-[#FF4D6D] to-[#FF8FA3]",
  };
  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className={cn("absolute -top-12 -right-12 size-32 rounded-full opacity-30 blur-2xl bg-gradient-to-br", accentMap[accent])} />
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl lg:text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs font-mono text-muted-foreground">{sub}</p>}
    </div>
  );
}
