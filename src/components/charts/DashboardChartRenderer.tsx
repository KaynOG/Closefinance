import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";

type Series = { key: string; name: string; color: string };
type Slice = { name: string; value: number; color: string };
export type DashboardChartProps = {
  label: string;
  data: Array<Record<string, string | number>>;
  series?: Series[];
  slices?: Slice[];
  initial?: "area" | "line" | "bar" | "stacked" | "donut" | "pie";
};

export default function DashboardChartRenderer({ data, series = [], slices, mode }: DashboardChartProps & { mode: string }) {
  const id = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const animation = { isAnimationActive: !reducedMotion, animationDuration: 450 };
  const tick = { fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" };
  const legend = <Legend wrapperStyle={{ fontSize: 11 }} formatter={value => <span className="text-muted-foreground">{value}</span>} />;
  if (slices && (mode === "pie" || mode === "donut")) {
    return <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie data={slices} dataKey="value" nameKey="name" innerRadius={mode === "donut" ? "50%" : 0} outerRadius="78%" paddingAngle={2} cornerRadius={4} {...animation}>
          {slices.map(slice => <Cell key={slice.name} fill={slice.color} stroke="var(--background)" />)}
        </Pie>
        <Tooltip content={<ChartTooltip showTotal={false} />} />
        {legend}
      </PieChart>
    </ResponsiveContainer>;
  }
  const chartData = slices ?? data;
  const axes = <>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
    <XAxis dataKey={slices ? "name" : "month"} tick={tick} stroke="var(--border)" tickLine={false} minTickGap={16} />
    <YAxis tick={tick} stroke="var(--border)" tickLine={false} width={62} />
    <Tooltip content={<ChartTooltip />} />
    {!slices && legend}
  </>;
  const margin = { top: 12, right: 12, left: 0, bottom: 8 };
  if (mode === "bar" || mode === "stacked" || slices) {
    return <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={chartData} margin={margin}>
        {axes}
        {slices ? <Bar dataKey="value" name="Valor" radius={[5, 5, 0, 0]} {...animation}>{slices.map(slice => <Cell key={slice.name} fill={slice.color} />)}</Bar> : series.map(s => <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} stackId={mode === "stacked" ? "total" : undefined} radius={[4, 4, 0, 0]} {...animation} />)}
      </BarChart>
    </ResponsiveContainer>;
  }
  if (mode === "line") {
    return <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart data={data} margin={margin}>{axes}{series.map(s => <Line key={s.key} dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} dot={{ r: 3 }} type="monotone" {...animation} />)}</LineChart>
    </ResponsiveContainer>;
  }
  return <ResponsiveContainer width="100%" height="100%" minWidth={0}>
    <AreaChart data={data} margin={margin}>
      <defs>{series.map((s, i) => <linearGradient key={s.key} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity={0.4} /><stop offset="100%" stopColor={s.color} stopOpacity={0.03} /></linearGradient>)}</defs>
      {axes}
      {series.map((s, i) => <Area key={s.key} dataKey={s.key} name={s.name} stroke={s.color} fill={`url(#${id}-${i})`} type="monotone" strokeWidth={2.5} {...animation} />)}
    </AreaChart>
  </ResponsiveContainer>;
}