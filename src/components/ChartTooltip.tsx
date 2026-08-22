import { formatBRL } from "@/lib/store";

type Item = { name?: string | number; value?: number; color?: string; payload?: Record<string, unknown> };

/**
 * Tooltip padrão dos gráficos: vidro fino, fonte mono, valores em BRL,
 * participação (%) por item e total do ponto.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  showTotal = true,
  showShare = true,
}: {
  active?: boolean;
  payload?: Item[];
  label?: string | number;
  showTotal?: boolean;
  showShare?: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const items = payload.filter(p => typeof p.value === "number");
  const total = items.reduce((s, p) => s + Math.abs(p.value ?? 0), 0);

  return (
    <div className="glass-strong rounded-lg px-3 py-2 min-w-[168px] animate-in fade-in zoom-in-95 duration-150">
      {label !== undefined && label !== "" && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
          {String(label)}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((p, i) => {
          const v = p.value ?? 0;
          const share = total > 0 ? Math.round((Math.abs(v) / total) * 100) : 0;
          return (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span className="size-2 rounded-[2px] shrink-0" style={{ background: p.color || "var(--primary)" }} />
              <span className="truncate flex-1 text-muted-foreground">{String(p.name ?? "")}</span>
              <span className="font-mono text-foreground">{formatBRL(v)}</span>
              {showShare && items.length > 1 && (
                <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">{share}%</span>
              )}
            </li>
          );
        })}
      </ul>
      {showTotal && items.length > 1 && (
        <div className="mt-1.5 pt-1.5 border-t border-border flex items-center justify-between text-[11px]">
          <span className="font-mono uppercase tracking-wider text-muted-foreground">Total</span>
          <span className="font-mono font-semibold">{formatBRL(total)}</span>
        </div>
      )}
    </div>
  );
}
