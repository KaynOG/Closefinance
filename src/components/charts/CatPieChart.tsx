import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartTooltip } from "@/components/ChartTooltip";

export default function CatPieChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={2}
          animationDuration={900}
          animationBegin={120}
          animationEasing="ease-out"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="rgba(0,0,0,0)" />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip showTotal={false} />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#fff" }} formatter={(value) => <span style={{ color: "#fff" }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
