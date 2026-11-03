import { useEffect, useState } from "react";
import { BarChart3, LineChart, AreaChart, PieChart, Donut, Layers, Columns3, AlignLeft } from "lucide-react";

const ICONS = { area: AreaChart, line: LineChart, bar: BarChart3, stacked: Layers, grouped: Columns3, donut: Donut, pie: PieChart, hbar: AlignLeft } as const;
export type ChartOption<T extends string> = { value: T; label: string; icon: keyof typeof ICONS };

/** Preferência de tipo de gráfico persistida por gráfico. */
export function useChartType<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const [v, setV] = useState<T>(fallback);
  useEffect(() => {
    const s = localStorage.getItem(`closefinance:chartType:${key}`) as T | null;
    if (s && allowed.includes(s)) setV(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (n: T) => { setV(n); localStorage.setItem(`closefinance:chartType:${key}`, n); };
  return [v, set] as const;
}

export function ChartTypeSwitch<T extends string>({ value, options, onChange }: { value: T; options: ChartOption<T>[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label="Tipo de gráfico" className="inline-flex items-center gap-1 rounded-xl border border-border bg-card/40 p-1">
      {options.map((o) => {
        const Icon = ICONS[o.icon];
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={active} title={o.label} aria-label={o.label}
            onClick={() => onChange(o.value)}
            className={`grid size-7 place-items-center rounded-lg transition-all ${active ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

export const FLOW_OPTIONS: ChartOption<"area" | "line" | "bar">[] = [
  { value: "area", label: "Área", icon: "area" }, { value: "line", label: "Linhas", icon: "line" }, { value: "bar", label: "Barras", icon: "bar" },
];
export const CAT_OPTIONS: ChartOption<"stacked" | "grouped" | "line" | "area">[] = [
  { value: "stacked", label: "Barras empilhadas", icon: "stacked" }, { value: "grouped", label: "Barras lado a lado", icon: "grouped" },
  { value: "line", label: "Linhas", icon: "line" }, { value: "area", label: "Área", icon: "area" },
];
export const PIE_OPTIONS: ChartOption<"donut" | "pie" | "bar">[] = [
  { value: "donut", label: "Rosca", icon: "donut" }, { value: "pie", label: "Pizza", icon: "pie" }, { value: "bar", label: "Barras horizontais", icon: "hbar" },
];
