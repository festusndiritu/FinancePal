"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlySummaryReport } from "@/types";

type MonthlySummaryProps = {
  data: MonthlySummaryReport;
};

export default function MonthlySummary({ data }: MonthlySummaryProps) {
  const chartData = data.topCategories.map((item) => ({
    category: item.category,
    total: item.total,
  }));

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">This month</p>
          <p className="mt-1 text-xl font-semibold">
            KES {data.thisMonthTotal.toLocaleString()}
          </p>
        </article>
        <article className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">Last month</p>
          <p className="mt-1 text-xl font-semibold">
            KES {data.lastMonthTotal.toLocaleString()}
          </p>
        </article>
        <article className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">Change</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              data.changePercent > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {data.changePercent.toFixed(1)}%
          </p>
        </article>
      </div>

      <div className="h-72 rounded-xl bg-slate-50 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
            <Bar dataKey="total" fill="#0284c7" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
