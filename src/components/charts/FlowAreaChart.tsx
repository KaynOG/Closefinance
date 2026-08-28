import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

export type FlowPoint = { month: string; receitas: number; despesas: number };

export default function FlowAreaChart({ data, incomeColor, expenseColor }: { data: FlowPoint[]; incomeColor: string; expenseColor: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="dCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={incomeColor} stopOpacity={0.7} />
            <stop offset="100%" stopColor={incomeColor} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="dOrange" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={expenseColor} stopOpacity={0.7} />
            <stop offset="100%" stopColor={expenseColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.7)", fontFamily: MONO }} />
        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.6)", fontFamily: MONO }} />
        <Tooltip cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }} content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="receitas"
          name="Ganhos"
          stroke={incomeColor}
          fill="url(#dCyan)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
          animationDuration={1100}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="despesas"
          name="Gastos"
          stroke={expenseColor}
          fill="url(#dOrange)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
          animationDuration={1100}
          animationBegin={180}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
