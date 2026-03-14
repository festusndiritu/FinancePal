"use client";

import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetVsActualReport } from "@/types";

type BudgetBarChartProps = {
  data: BudgetVsActualReport;
};

export default function BudgetBarChart({ data }: BudgetBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-6 text-sm text-muted-foreground">
        <BarChart3 className="h-5 w-5 text-slate-500" />
        <p>No budget comparison data yet.</p>
      </div>
    );
  }

  return (
    <div className="h-80 rounded-xl bg-slate-50 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
          <Legend />
          <Bar dataKey="limit" fill="#22c55e" radius={[6, 6, 0, 0]} />
          <Bar dataKey="actual" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
