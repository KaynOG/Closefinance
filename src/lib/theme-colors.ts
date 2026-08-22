import { useEffect, useState } from "react";
import { onAccentChange, onThemeChange } from "@/lib/theme";

export type ChartColors = {
  c1: string; c2: string; c3: string; c4: string; c5: string;
  primary: string; success: string; danger: string;
};

const FALLBACK: ChartColors = {
  c1: "#007078", c2: "#f59e0f", c3: "#2bd9a1", c4: "#820432", c5: "#5fd0d8",
  primary: "#007078", success: "#2BD9A1", danger: "#FF4D6D",
};

function read(): ChartColors {
  if (typeof window === "undefined") return FALLBACK;
  const s = getComputedStyle(document.documentElement);
  const g = (n: string, fb: string) => (s.getPropertyValue(n).trim() || fb);
  return {
    c1: g("--chart-1", FALLBACK.c1),
    c2: g("--chart-2", FALLBACK.c2),
    c3: g("--chart-3", FALLBACK.c3),
    c4: g("--chart-4", FALLBACK.c4),
    c5: g("--chart-5", FALLBACK.c5),
    primary: g("--primary", FALLBACK.primary),
    success: FALLBACK.success,
    danger: FALLBACK.danger,
  };
}

/** Cores dos gráficos derivadas do tema/acento ativo. */
export function useChartColors(): ChartColors {
  const [c, setC] = useState<ChartColors>(FALLBACK);
  useEffect(() => {
    const sync = () => setC(read());
    sync();
    const offT = onThemeChange(sync);
    const offA = onAccentChange(sync);
    return () => { offT(); offA(); };
  }, []);
  return c;
}
