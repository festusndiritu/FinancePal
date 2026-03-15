"use client";

import { BarChart2 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { MonthlySummaryReport } from "@/types";

type Props = { data: MonthlySummaryReport };

export default function MonthlySummary({ data }: Props) {
  const hasData = data.thisMonthTotal > 0 || data.lastMonthTotal > 0;

  return (
    <section className="space-y-4">
      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "This month", value: `KES ${data.thisMonthTotal.toLocaleString()}` },
          { label: "Last month", value: `KES ${data.lastMonthTotal.toLocaleString()}` },
          {
            label: "Change",
            value: `${data.changePercent > 0 ? "+" : ""}${data.changePercent.toFixed(1)}%`,
            color: data.changePercent > 0 ? "text-red-600" : "text-emerald-600",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className={`mt-1 text-xl font-black ${s.color ?? "text-slate-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart or empty state */}
      {!hasData || data.topCategories.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 text-center">
          <BarChart2 className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No expenses this month yet</p>
          <p className="text-xs text-slate-400">Start logging expenses to see your breakdown.</p>
        </div>
      ) : (
        <div className="h-72 rounded-xl bg-slate-50 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topCategories.map((item) => ({ category: item.category, total: item.total }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [`KES ${Number(value).toLocaleString()}`, "Spent"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="total" fill="#0284c7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}