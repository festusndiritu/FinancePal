
"use client";

import { Pencil, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BudgetItem } from "@/types";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const categoryEmoji: Record<string, string> = {
  food: "🍽️", transport: "🚌", utilities: "💡", rent: "🏠",
  education: "📚", entertainment: "🎮", health: "❤️‍🩹",
  shopping: "🛍️", savings: "🐖", other: "📦",
};

export const categoryColors: Record<string, { bar: string; bg: string; text: string }> = {
  food:          { bar: "bg-amber-500",   bg: "bg-amber-50",   text: "text-amber-700" },
  transport:     { bar: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700" },
  utilities:     { bar: "bg-slate-500",   bg: "bg-slate-100",  text: "text-slate-600" },
  rent:          { bar: "bg-violet-500",  bg: "bg-violet-50",  text: "text-violet-700" },
  education:     { bar: "bg-indigo-500",  bg: "bg-indigo-50",  text: "text-indigo-700" },
  entertainment: { bar: "bg-pink-500",    bg: "bg-pink-50",    text: "text-pink-700" },
  health:        { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  shopping:      { bar: "bg-orange-500",  bg: "bg-orange-50",  text: "text-orange-700" },
  savings:       { bar: "bg-teal-500",    bg: "bg-teal-50",    text: "text-teal-700" },
  other:         { bar: "bg-zinc-400",    bg: "bg-zinc-100",   text: "text-zinc-600" },
};

function getBarColor(pct: number, cat: string) {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80)  return "bg-amber-500";
  return categoryColors[cat]?.bar ?? "bg-sky-500";
}

function StatusPill({ pct }: { pct: number }) {
  if (pct >= 100) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
        <AlertTriangle className="h-3 w-3" /> Over budget
      </span>
    );
  }
  if (pct >= 80) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
        <AlertTriangle className="h-3 w-3" /> Near limit
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
      <CheckCircle2 className="h-3 w-3" /> On track
    </span>
  );
}

type Props = {
  budget: BudgetItem;
  onEdit: (b: BudgetItem) => void;
  onDelete: (b: BudgetItem) => void;
};

export default function BudgetCard({ budget, onEdit, onDelete }: Props) {
  const spent = budget.spent ?? 0;
  const pct   = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
  const left  = Math.max(budget.limit - spent, 0);
  const colors = categoryColors[budget.category] ?? categoryColors.other;

  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">

      {/* Header row */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl", colors.bg)}>
            {categoryEmoji[budget.category] ?? "📦"}
          </div>
          <div>
            <p className="font-black capitalize text-slate-900">{budget.category}</p>
            <p className="text-xs capitalize text-slate-400">
              {budget.period} · {MONTHS[(budget.month ?? 1) - 1]} {budget.year}
            </p>
          </div>
        </div>

        {/* Actions — always visible on mobile, hover on desktop */}
        <div className="flex shrink-0 items-center gap-1.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
          <button
            onClick={() => onEdit(budget)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
            aria-label="Edit budget"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(budget)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete budget"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Spent / remaining */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-2xl font-black text-slate-900">
            KES {spent.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">of KES {budget.limit.toLocaleString()} limit</p>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-sm font-bold",
            pct >= 100 ? "text-red-600" : pct >= 80 ? "text-amber-600" : "text-emerald-600",
          )}>
            KES {left.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">remaining</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getBarColor(pct, budget.category))}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Status + percentage */}
      <div className="flex items-center justify-between">
        <StatusPill pct={pct} />
        <span className="text-xs font-bold text-slate-400">{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}