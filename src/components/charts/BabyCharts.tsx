import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const TICK = "var(--muted-foreground)";

export function BabyMonthlyBar({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" stroke={TICK} fontSize={11} tick={{ fill: TICK, fontFamily: MONO }} />
        <YAxis stroke={TICK} fontSize={11} tick={{ fill: TICK, fontFamily: MONO }} />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Essenciais" stackId="a" fill="var(--baby-mint)" animationDuration={800} animationEasing="ease-out" />
        <Bar dataKey="Não essenciais" stackId="a" fill="var(--baby-peach)" radius={[6, 6, 0, 0]} animationDuration={800} animationBegin={120} animationEasing="ease-out" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BabyEssentialPie({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} animationDuration={900} animationEasing="ease-out">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip showTotal={false} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
