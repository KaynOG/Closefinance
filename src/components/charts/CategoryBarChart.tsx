import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { formatBRL } from "@/lib/store";

export type CategoryBar = { name: string; valor: number; color: string };

export default function CategoryBarChart({ data }: { data: CategoryBar[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={90} tick={{ fill: "rgba(255,255,255,0.75)" }} />
        <Tooltip
          contentStyle={{ background: "#14062E", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" }}
          labelStyle={{ color: "#fff" }}
          itemStyle={{ color: "#fff" }}
          formatter={(v: number) => formatBRL(v)}
        />
        <Bar dataKey="valor" radius={[0, 8, 8, 0]} animationDuration={800}>
          {data.map((c, i) => <Cell key={i} fill={c.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
