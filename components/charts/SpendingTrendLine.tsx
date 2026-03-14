"use client";

import { format } from "date-fns";
import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpendingTrendReport } from "@/types";

type SpendingTrendLineProps = {
  data: SpendingTrendReport;
};

export default function SpendingTrendLine({ data }: SpendingTrendLineProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-6 text-sm text-muted-foreground">
        <TrendingUp className="h-5 w-5 text-slate-500" />
        <p>No trend data available for the selected range.</p>
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    label: format(new Date(item.date), "dd MMM"),
  }));

  return (
    <div className="h-80 rounded-xl bg-slate-50 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" minTickGap={20} />
          <YAxis />
          <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
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
