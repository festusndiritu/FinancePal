"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CategoryBreakdownReport } from "@/types";

const COLORS = [
  "#0ea5e9",
  "#f59e0b",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#64748b",
];

type CategoryPieChartProps = {
  data: CategoryBreakdownReport;
};

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-6 text-sm text-muted-foreground">
        <PieChartIcon className="h-5 w-5 text-slate-500" />
        <p>No category data for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="h-80 rounded-xl bg-slate-50 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            innerRadius={65}
            outerRadius={100}
            label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
