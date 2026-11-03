import { lazy, Suspense, useState } from "react";
import { ChartNoAxesCombined } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardChartProps } from "./DashboardChartRenderer";

const Renderer = lazy(() => import("./DashboardChartRenderer"));
const names: Record<string, string> = { area: "Área", line: "Linhas", bar: "Barras", stacked: "Barras empilhadas", donut: "Rosca", pie: "Pizza" };

export function DashboardChart(props: DashboardChartProps) {
  const modes = props.slices ? ["donut", "pie", "bar"] : ["area", "line", "bar", "stacked"];
  const [mode, setMode] = useState<string>(props.initial ?? modes[0]);
  return <div className="flex h-full min-h-0 min-w-0 flex-col gap-2" role="group" aria-label={props.label}>
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <span className="text-xs font-mono text-muted-foreground" aria-live="polite">{names[mode]}</span>
      <Button variant="outline" size="sm" aria-label={`Mudar gráfico: ${props.label}`} title={`Mudar gráfico: ${props.label}`} onClick={() => setMode(modes[(modes.indexOf(mode) + 1) % modes.length])}>
        <ChartNoAxesCombined /> Mudar gráfico
      </Button>
    </div>
    <div className="min-h-0 min-w-0 flex-1">
      <Suspense fallback={<div className="h-full animate-pulse rounded-md bg-muted" />}>
        <Renderer {...props} mode={mode} />
      </Suspense>
    </div>
  </div>;
}