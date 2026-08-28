import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

export default function CatStackBarChart({
  data,
  cats,
}: {
  data: Array<Record<string, string | number>>;
  cats: Array<{ id: string; name: string; color: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.7)", fontFamily: MONO }} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.6)", fontFamily: MONO }} />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#fff" }} formatter={(value) => <span style={{ color: "#fff" }}>{value}</span>} />
        {cats.map((c, i) => (
          <Bar
            key={c.id}
            dataKey={c.name}
            stackId="a"
            fill={c.color}
            radius={[6, 6, 0, 0]}
            animationDuration={800}
            animationBegin={i * 90}
            animationEasing="ease-out"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
