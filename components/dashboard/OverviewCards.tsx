"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useBudgets } from "@/hooks/useBudgets";
import { useReports } from "@/hooks/useReports";

function formatKes(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function OverviewCards() {
  const { data: reportData, error: reportError, mutate: mutateReport } = useReports("/api/reports?type=monthly");
  const { budgets, error: budgetsError, mutate: mutateBudgets } = useBudgets();
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    if (!reportData || reportData.type !== "monthly") return null;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthlyBudgets = budgets.filter(
      (b) => b.period === "monthly" && b.month === currentMonth && b.year === currentYear,
    );
    const budgetTotal = currentMonthlyBudgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpend = reportData.data.thisMonthTotal;
    const budgetRemaining = Math.max(0, budgetTotal - totalSpend);
    const budgetUsagePercent = budgetTotal > 0 ? (totalSpend / budgetTotal) * 100 : 0;
    const savingsAmount =
      reportData.data.topCategories.find((item) => item.category === "savings")?.total ?? 0;
    return {
      totalSpend,
      budgetRemaining,
      budgetUsagePercent,
      savingsAmount,
      spendChangePercent: reportData.data.changePercent,
    };
  }, [reportData, budgets]);

  useEffect(() => {
    setError(reportError || budgetsError ? "Unable to load summary" : null);
  }, [reportError, budgetsError]);

  useEffect(() => {
    const handleRefresh = () => { void mutateReport(); void mutateBudgets(); };
    window.addEventListener("financepal:expenses-updated", handleRefresh);
    return () => window.removeEventListener("financepal:expenses-updated", handleRefresh);
  }, [mutateBudgets, mutateReport]);

  const spendChange = summary?.spendChangePercent ?? 0;
  const budgetUsage = summary?.budgetUsagePercent ?? 0;
  const isOverBudget = budgetUsage >= 80;

  return (
    <section>
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Monthly Spend */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-rose-50" />
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              This Month
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
              <ArrowUpRight className="h-4.5 w-4.5 text-rose-500" />
            </div>
          </div>
          <p className="text-4xl font-black leading-none tracking-tight text-slate-900">
            {formatKes(summary?.totalSpend ?? 0)}
          </p>
          <div className={`mt-4 flex items-center gap-1.5 text-sm font-semibold ${spendChange > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {spendChange > 0
              ? <TrendingUp className="h-4 w-4" />
              : <TrendingDown className="h-4 w-4" />
            }
            {Math.abs(spendChange).toFixed(1)}% vs last month
          </div>
        </div>

        {/* Budget Remaining */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-sky-50" />
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Budget Left
            </span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isOverBudget ? "bg-amber-50" : "bg-sky-50"}`}>
              <Wallet className={`h-4.5 w-4.5 ${isOverBudget ? "text-amber-500" : "text-sky-600"}`} />
            </div>
          </div>
          <p className="text-4xl font-black leading-none tracking-tight text-slate-900">
            {formatKes(summary?.budgetRemaining ?? 0)}
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>{budgetUsage.toFixed(0)}% of budget used</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isOverBudget ? "bg-amber-400" : "bg-sky-500"}`}
                style={{ width: `${Math.min(100, budgetUsage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Savings */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-emerald-50" />
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Savings
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <ArrowDownRight className="h-4.5 w-4.5 text-emerald-600" />
            </div>
          </div>
          <p className="text-4xl font-black leading-none tracking-tight text-slate-900">
            {formatKes(summary?.savingsAmount ?? 0)}
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-400">
            Logged under savings this month
          </p>
        </div>
      </div>
    </section>
  );
}