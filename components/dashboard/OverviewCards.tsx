"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudgets } from "@/hooks/useBudgets";
import { useReports } from "@/hooks/useReports";
import type { BudgetItem } from "@/types";

type SummaryState = {
  totalSpend: number;
  budgetRemaining: number;
  budgetUsagePercent: number;
  savingsAmount: number;
  spendChangePercent: number;
};

function formatKes(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function OverviewCards() {
  const {
    data: reportData,
    error: reportError,
    mutate: mutateReport,
  } = useReports("/api/reports?type=monthly");
  const { budgets, error: budgetsError, mutate: mutateBudgets } = useBudgets();
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo<SummaryState | null>(() => {
    if (!reportData || reportData.type !== "monthly") return null;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentMonthlyBudgets = budgets.filter(
      (budget) =>
        budget.period === "monthly" &&
        budget.month === currentMonth &&
        budget.year === currentYear,
    );

    const budgetTotal = currentMonthlyBudgets.reduce(
      (sum, budget) => sum + budget.limit,
      0,
    );
    const totalSpend = reportData.data.thisMonthTotal;
    const budgetRemaining = Math.max(0, budgetTotal - totalSpend);
    const budgetUsagePercent = budgetTotal > 0 ? (totalSpend / budgetTotal) * 100 : 0;
    const savingsAmount =
      reportData.data.topCategories.find((item) => item.category === "savings")
        ?.total ?? 0;

    return {
      totalSpend,
      budgetRemaining,
      budgetUsagePercent,
      savingsAmount,
      spendChangePercent: reportData.data.changePercent,
    };
  }, [reportData, budgets]);

  useEffect(() => {
    if (reportError || budgetsError) {
      setError("Unable to load summary");
    } else {
      setError(null);
    }
  }, [reportError, budgetsError]);

  useEffect(() => {
    const handleRefresh = () => {
      void mutateReport();
      void mutateBudgets();
    };

    window.addEventListener("financepal:expenses-updated", handleRefresh);

    return () => {
      window.removeEventListener("financepal:expenses-updated", handleRefresh);
    };
  }, [mutateBudgets, mutateReport]);

  const cards = useMemo(
    () => [
      {
        title: "This Month Spend",
        value: formatKes(summary?.totalSpend ?? 0),
        trend: `${Math.abs(summary?.spendChangePercent ?? 0).toFixed(1)}% ${
          (summary?.spendChangePercent ?? 0) >= 0 ? "up" : "down"
        } vs last month`,
        icon: ArrowUpRight,
        trendClass:
          (summary?.spendChangePercent ?? 0) > 0 ? "text-rose-600" : "text-emerald-700",
        cardClass: "bg-slate-50",
        iconWrapClass: "bg-rose-100 text-rose-700",
      },
      {
        title: "Budget Remaining",
        value: formatKes(summary?.budgetRemaining ?? 0),
        trend: `${(summary?.budgetUsagePercent ?? 0).toFixed(1)}% of budget used`,
        icon: Wallet,
        trendClass:
          (summary?.budgetUsagePercent ?? 0) >= 90
            ? "text-rose-600"
            : "text-sky-700",
        cardClass: "bg-slate-50",
        iconWrapClass: "bg-sky-100 text-sky-700",
      },
      {
        title: "Savings Category",
        value: formatKes(summary?.savingsAmount ?? 0),
        trend: "Logged under savings this month",
        icon: ArrowDownRight,
        trendClass: "text-slate-600",
        cardClass: "bg-slate-50",
        iconWrapClass: "bg-emerald-100 text-emerald-700",
      },
    ],
    [summary],
  );

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {error ? (
        <p className="md:col-span-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {cards.map((card) => (
        <Card key={card.title} className={card.cardClass}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-slate-600">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-3xl font-black tracking-tight text-slate-900">{card.value}</p>
              <div className={`rounded-full p-2 ${card.iconWrapClass}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <p className={`text-xs ${card.trendClass}`}>{card.trend}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
