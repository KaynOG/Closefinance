import { BarChart, Bar, LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
export type CatStackVariant = "stacked" | "grouped" | "line" | "area";

export default function CatStackBarChart({
  data,
  cats,
  variant = "stacked",
}: {
  data: Array<Record<string, string | number>>;
  cats: Array<{ id: string; name: string; color: string }>;
  variant?: CatStackVariant;
}) {
  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
      <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.7)", fontFamily: MONO }} />
      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.6)", fontFamily: MONO }} />
      <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span className="text-foreground">{value}</span>} />
    </>
  );
  const margin = { top: 10, right: 10, left: -20, bottom: 0 };
  return (
    <ResponsiveContainer width="100%" height="100%">
      {variant === "line" ? (
        <LineChart data={data} margin={margin}>
          {common}
          <Tooltip content={<ChartTooltip />} />
          {cats.map((c, i) => <Line key={c.id} type="monotone" dataKey={c.name} stroke={c.color} strokeWidth={2.2} dot={{ r: 3 }} animationDuration={800} animationBegin={i * 90} />)}
        </LineChart>
      ) : variant === "area" ? (
        <AreaChart data={data} margin={margin}>
          {common}
          <Tooltip content={<ChartTooltip />} />
          {cats.map((c, i) => <Area key={c.id} type="monotone" dataKey={c.name} stackId="a" stroke={c.color} fill={c.color} fillOpacity={0.35} animationDuration={800} animationBegin={i * 90} />)}
        </AreaChart>
      ) : (
        <BarChart data={data} margin={margin}>
          {common}
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip />} />
          {cats.map((c, i) => (
            <Bar key={c.id} dataKey={c.name} stackId={variant === "stacked" ? "a" : undefined} fill={c.color} radius={[6, 6, 0, 0]} animationDuration={800} animationBegin={i * 90} animationEasing="ease-out" />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
