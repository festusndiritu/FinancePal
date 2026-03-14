"use client";

import { AlertTriangle, CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BudgetItem } from "@/types";

type BudgetListProps = {
  budgets: BudgetItem[];
  onEdit: (budget: BudgetItem) => void;
};

function monthLabel(month: number) {
  return new Date(2026, month - 1, 1).toLocaleString("en-US", { month: "long" });
}

function alertLabel(budget: BudgetItem) {
  if (budget.alertLevel === "danger") {
    return "Budget exceeded (100%+)";
  }
  if (budget.alertLevel === "warning") {
    return "Approaching budget limit (80%+)";
  }
  return "On track";
}

export default function BudgetList({ budgets, onEdit }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <div className="rounded-xl bg-slate-50 p-6 text-sm text-muted-foreground">
        No budgets yet. Add your first category limit above.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {budgets.map((budget) => {
        const progress = Math.min(100, Math.max(0, budget.usagePercent));

        return (
          <article key={budget._id} className="rounded-xl bg-slate-50 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold capitalize">{budget.category}</h3>
                <p className="text-sm text-muted-foreground">
                  {budget.period} • {monthLabel(budget.month)} {budget.year}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onEdit(budget)}>
                Edit
              </Button>
            </div>

            <div className="mb-2 h-2 rounded-full bg-muted">
              <div
                className={
                  budget.alertLevel === "danger"
                    ? "h-2 rounded-full bg-red-500"
                    : budget.alertLevel === "warning"
                      ? "h-2 rounded-full bg-amber-500"
                      : "h-2 rounded-full bg-emerald-500"
                }
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-sm">
              Spent <span className="font-medium">KES {budget.spent.toLocaleString()}</span>
              {" "}of <span className="font-medium">KES {budget.limit.toLocaleString()}</span>
              {" "}({budget.usagePercent.toFixed(1)}%)
            </p>

            <div
              className={
                budget.alertLevel === "danger"
                  ? "mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  : budget.alertLevel === "warning"
                    ? "mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700"
                    : "mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              }
            >
              {budget.alertLevel === "danger" ? (
                <CircleAlert className="h-4 w-4" />
              ) : budget.alertLevel === "warning" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CircleCheck className="h-4 w-4" />
              )}
              {alertLabel(budget)}
            </div>
          </article>
        );
      })}
    </div>
  );
}
