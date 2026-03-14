"use client";

import { format } from "date-fns";
import { PiggyBank } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import type { SavingsReport } from "@/types";

type SavingsTrackerProps = {
  data: SavingsReport;
};

export default function SavingsTracker({ data }: SavingsTrackerProps) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-6 text-sm text-muted-foreground">
        <PiggyBank className="h-5 w-5 text-slate-500" />
        <p>No savings goals found. Add goals to see progress here.</p>
      </div>
    );
  }

  const chartData = data.map((goal) => ({
    name: goal.name,
    current: goal.currentAmount,
    target: goal.targetAmount,
  }));

  return (
    <section className="space-y-4">
      <div className="grid gap-3">
        {data.map((goal) => (
          <article key={goal._id} className="rounded-xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-medium">{goal.name}</h3>
              <span className="text-xs text-muted-foreground">
                Due {format(new Date(goal.deadline), "dd MMM yyyy")}
              </span>
            </div>
            <Progress value={Math.min(100, goal.progressPercent)} />
            <p className="mt-2 text-sm">
              KES {goal.currentAmount.toLocaleString()} / KES {goal.targetAmount.toLocaleString()} ({goal.progressPercent.toFixed(1)}%)
            </p>
            <p className="text-xs text-muted-foreground">
              Projected completion: {goal.projectedMonthsToGoal === null ? "N/A" : `${goal.projectedMonthsToGoal} months`}
            </p>
          </article>
        ))}
      </div>

      <div className="h-72 rounded-xl bg-slate-50 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
            <Line type="monotone" dataKey="current" stroke="#0ea5e9" strokeWidth={2} />
            <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
