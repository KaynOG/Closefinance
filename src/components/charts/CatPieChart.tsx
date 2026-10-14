import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";

export default function CatPieChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col items-center gap-3">
    <div className="min-h-0 w-full flex-1">
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="85%"
          cornerRadius={5}
          paddingAngle={2}
          animationDuration={900}
          animationBegin={120}
          animationEasing="ease-out"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip showTotal={false} />} />
      </PieChart>
    </ResponsiveContainer>
    </div>
    <ul className="flex w-full shrink-0 flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {data.map((entry) => <li key={entry.name} className="flex min-w-0 items-center gap-1.5">
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden className="shrink-0"><circle cx="4" cy="4" r="4" fill={entry.color} /></svg>
        <span>{entry.name}</span>
      </li>)}
    </ul>
    </div>
  );
}
