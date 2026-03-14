"use client";

import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { SpendingHeatmapReport } from "@/types";

type SpendingHeatmapProps = {
  data: SpendingHeatmapReport;
};

function levelClass(intensity: number) {
  if (intensity >= 0.75) return "bg-red-500";
  if (intensity >= 0.5) return "bg-amber-500";
  if (intensity >= 0.25) return "bg-sky-500";
  if (intensity > 0) return "bg-sky-200";
  return "bg-muted";
}

export default function SpendingHeatmap({ data }: SpendingHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-6 text-sm text-muted-foreground">
        <CalendarDays className="h-5 w-5 text-slate-500" />
        <p>No heatmap data yet for the selected year.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="grid grid-cols-7 gap-2 sm:grid-cols-10 lg:grid-cols-14">
        {data.map((item) => (
          <div
            key={item.date}
            className={`h-8 rounded ${levelClass(item.intensity)}`}
            title={`${format(new Date(item.date), "dd MMM yyyy")}: KES ${item.total.toLocaleString()}`}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Low</span>
        <span className="h-3 w-3 rounded bg-muted" />
        <span className="h-3 w-3 rounded bg-sky-200" />
        <span className="h-3 w-3 rounded bg-sky-500" />
        <span className="h-3 w-3 rounded bg-amber-500" />
        <span className="h-3 w-3 rounded bg-red-500" />
        <span>High</span>
      </div>
    </div>
  );
}
