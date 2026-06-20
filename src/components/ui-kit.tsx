import { cn } from "@/lib/utils";
import { useEffect, useState, type HTMLAttributes } from "react";
import { EyeOff, Eye } from "lucide-react";

const HIDDEN_PREFIX = "closefinance:hidden:";

function readHidden(key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(HIDDEN_PREFIX + key) === "1";
}

function writeHidden(key: string, v: boolean) {
  if (v) localStorage.setItem(HIDDEN_PREFIX + key, "1");
  else localStorage.removeItem(HIDDEN_PREFIX + key);
}

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  hideKey?: string;
  hideLabel?: string;
};

export function GlassCard({ className, hideKey, hideLabel, children, ...props }: GlassCardProps) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => { if (hideKey) setHidden(readHidden(hideKey)); }, [hideKey]);

  if (hideKey && hidden) {
    return (
      <div className={cn("glass rounded-2xl px-4 py-2.5 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-300", className)}>
        <span className="text-xs font-mono text-muted-foreground truncate">{hideLabel ?? "Bloco oculto"}</span>
        <button onClick={() => { writeHidden(hideKey, false); setHidden(false); }}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-mono hover:bg-white/5 transition">
          <Eye className="size-3.5" /> Mostrar
        </button>
      </div>
    );
  }

  return (
    <div className={cn("glass rounded-3xl p-5 relative animate-in fade-in zoom-in-95 duration-300", className)} {...props}>
      {hideKey && (
        <button onClick={() => { writeHidden(hideKey, true); setHidden(true); }}
          className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition opacity-60 hover:opacity-100"
          aria-label="Ocultar bloco" title="Ocultar bloco">
          <EyeOff className="size-3.5" />
        </button>
      )}
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

export function Stat({ label, value, sub, accent = "violet", hideKey }: {
  label: string; value: string; sub?: string;
  accent?: "violet" | "yellow" | "teal" | "crimson" | "success" | "danger";
  hideKey?: string;
}) {
  const accentMap: Record<string, string> = {
    violet: "from-[#540BD3] to-[#B388FF]",
    yellow: "from-[#FFCC00] to-[#FFE066]",
    teal: "from-[#006F77] to-[#22C3CC]",
    crimson: "from-[#820432] to-[#D14B72]",
    success: "from-[#2BD9A1] to-[#7DF2C5]",
    danger: "from-[#FF4D6D] to-[#FF8FA3]",
  };
  const [hidden, setHidden] = useState(false);
  useEffect(() => { if (hideKey) setHidden(readHidden(hideKey)); }, [hideKey]);
  if (hideKey && hidden) {
    return (
      <div className="glass rounded-2xl px-4 py-2.5 flex items-center justify-between gap-2 animate-in fade-in duration-300">
        <span className="text-xs font-mono text-muted-foreground truncate">{label}</span>
        <button onClick={() => { writeHidden(hideKey, false); setHidden(false); }}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-0.5 text-[10px] font-mono hover:bg-white/5">
          <Eye className="size-3" /> Mostrar
        </button>
      </div>
    );
  }
  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className={cn("absolute -top-12 -right-12 size-32 rounded-full opacity-30 blur-2xl bg-gradient-to-br", accentMap[accent])} />
      {hideKey && (
        <button onClick={() => { writeHidden(hideKey, true); setHidden(true); }}
          className="absolute top-2 right-2 z-10 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 transition opacity-50 hover:opacity-100"
          aria-label="Ocultar" title="Ocultar"><EyeOff className="size-3" /></button>
      )}
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl lg:text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs font-mono text-muted-foreground">{sub}</p>}
    </div>
  );
}
