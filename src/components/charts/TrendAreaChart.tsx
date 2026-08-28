import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatBRL } from "@/lib/store";

export type TrendPoint = { month: string; valor: number };

export default function TrendAreaChart({ data, color, gradientId }: { data: TrendPoint[]; color: string; gradientId: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.7} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.7)" }} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.6)" }} />
        <Tooltip
          contentStyle={{ background: "#14062E", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" }}
          labelStyle={{ color: "#fff" }}
          itemStyle={{ color: "#fff" }}
          formatter={(v: number) => formatBRL(v)}
        />
        <Area type="monotone" dataKey="valor" stroke={color} fill={`url(#${gradientId})`} strokeWidth={2.5} animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
