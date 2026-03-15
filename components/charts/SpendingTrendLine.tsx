"use client";

import { format } from "date-fns";
import { TrendingUp } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { SpendingTrendReport } from "@/types";

type Props = { data: SpendingTrendReport };

export default function SpendingTrendLine({ data }: Props) {
  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 text-center">
        <TrendingUp className="h-8 w-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-500">No spending data for this period</p>
        <p className="text-xs text-slate-400">Log some expenses to see your spending trend.</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    label: format(new Date(item.date), "dd MMM"),
  }));

  return (
    <div className="h-72 rounded-xl bg-slate-50 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={20} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value) => [`KES ${Number(value).toLocaleString()}`, "Spent"]}
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#0284c7"
            fill="#bae6fd"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}