import { AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";

const MONO = "'JetBrains Mono', ui-monospace, monospace";

export type FlowPoint = { month: string; receitas: number; despesas: number };
export type FlowVariant = "area" | "line" | "bar";

export default function FlowAreaChart({ data, incomeColor, expenseColor, variant = "area" }: { data: FlowPoint[]; incomeColor: string; expenseColor: string; variant?: FlowVariant }) {
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
      <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.7)", fontFamily: MONO }} />
      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: "rgba(255,255,255,0.6)", fontFamily: MONO }} />
    </>
  );
  const margin = { top: 10, right: 10, left: -20, bottom: 0 };
  return (
    <ResponsiveContainer width="100%" height="100%">
      {variant === "bar" ? (
        <BarChart data={data} margin={margin}>
          {axes}
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip />} />
          <Bar dataKey="receitas" name="Ganhos" fill={incomeColor} radius={[6, 6, 0, 0]} animationDuration={800} />
          <Bar dataKey="despesas" name="Gastos" fill={expenseColor} radius={[6, 6, 0, 0]} animationDuration={800} animationBegin={150} />
        </BarChart>
      ) : variant === "line" ? (
        <LineChart data={data} margin={margin}>
          {axes}
          <Tooltip cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }} content={<ChartTooltip />} />
          <Line type="monotone" dataKey="receitas" name="Ganhos" stroke={incomeColor} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={1000} />
          <Line type="monotone" dataKey="despesas" name="Gastos" stroke={expenseColor} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} animationDuration={1000} animationBegin={150} />
        </LineChart>
      ) : (
        <AreaChart data={data} margin={margin}>
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
          {axes}
          <Tooltip cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }} content={<ChartTooltip />} />
          <Area type="monotone" dataKey="receitas" name="Ganhos" stroke={incomeColor} fill="url(#dCyan)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={1100} animationEasing="ease-out" />
          <Area type="monotone" dataKey="despesas" name="Gastos" stroke={expenseColor} fill="url(#dOrange)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={1100} animationBegin={180} animationEasing="ease-out" />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}
