"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingDown, TrendingUp, Wallet, PiggyBank, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type MonthlyData = { thisMonthTotal: number; lastMonthTotal: number; changePercent: number };
type BudgetData  = { _id: string; limit: number; spent: number; category: string };
type SavingsGoal = { _id: string; targetAmount: number; currentAmount: number; progressPercent: number };

function CardSkeleton({ className }: { className: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-5 shadow-lg", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 w-24 animate-pulse rounded-full bg-white/30" />
        <div className="h-8 w-8 animate-pulse rounded-xl bg-white/30" />
      </div>
      <div className="h-9 w-36 animate-pulse rounded-lg bg-white/30" />
      <div className="mt-2 h-3 w-28 animate-pulse rounded-full bg-white/20" />
    </div>
  );
}

export default function OverviewCards() {
  const [monthly, setMonthly] = useState<MonthlyData | null>(null);
  const [budgets, setBudgets] = useState<BudgetData[]  | null>(null);
  const [savings, setSavings] = useState<SavingsGoal[] | null>(null);

  const loadRef = useRef<(() => void) | null>(null);

  const load = () => {
    fetch("/api/reports?type=monthly")
      .then((r) => r.ok ? r.json() : null)
      .then((p: { data: MonthlyData } | null) => { if (p) setMonthly(p.data); })
      .catch(() => setMonthly({ thisMonthTotal: 0, lastMonthTotal: 0, changePercent: 0 }));

    fetch("/api/budgets")
      .then((r) => r.ok ? r.json() : null)
      .then((p: { data: BudgetData[] } | null) => setBudgets(p?.data ?? []))
      .catch(() => setBudgets([]));

    fetch("/api/savings")
      .then((r) => r.ok ? r.json() : null)
      .then((p: { data: SavingsGoal[] } | null) => setSavings(p?.data ?? []))
      .catch(() => setSavings([]));
  };

  // Keep ref in sync so the event handler always calls the latest version
  loadRef.current = load;

  // Load on mount — ref pattern avoids stale closure without needing the disable comment
  useEffect(() => {
    loadRef.current?.();
  }, []); // empty deps is intentional: only run once on mount

  useEffect(() => {
    const handler = () => { loadRef.current?.(); };
    window.addEventListener("financepal:expenses-updated", handler);
    window.addEventListener("financepal:budgets-updated", handler);
    return () => {
      window.removeEventListener("financepal:expenses-updated", handler);
      window.removeEventListener("financepal:budgets-updated", handler);
    };
  }, []);

  const thisMonth  = monthly?.thisMonthTotal ?? 0;
  const changeAbs  = monthly ? Math.abs(monthly.changePercent) : 0;
  const isUp       = (monthly?.changePercent ?? 0) >= 0;

  const totalLimit = (budgets ?? []).reduce((s, b) => s + b.limit, 0);
  const totalSpent = (budgets ?? []).reduce((s, b) => s + (b.spent ?? 0), 0);
  const budgetLeft = Math.max(totalLimit - totalSpent, 0);
  const budgetPct  = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  const totalSaved     = (savings ?? []).reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget    = (savings ?? []).reduce((s, g) => s + g.targetAmount, 0);
  const savingsPct     = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const goalsCount     = savings?.length ?? 0;
  const completedGoals = (savings ?? []).filter((g) => g.progressPercent >= 100).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

      {monthly === null ? (
        <CardSkeleton className="bg-gradient-to-br from-rose-500 to-rose-600" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-5 text-white shadow-lg shadow-rose-500/20">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-2 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-100">This Month</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black">KES {thisMonth.toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-1.5">
              {isUp
                ? <TrendingUp  className="h-3.5 w-3.5 text-rose-200" />
                : <TrendingDown className="h-3.5 w-3.5 text-emerald-300" />}
              <span className={cn("text-xs font-bold", isUp ? "text-rose-200" : "text-emerald-300")}>
                {changeAbs.toFixed(1)}% vs last month
              </span>
            </div>
          </div>
        </div>
      )}

      {budgets === null ? (
        <CardSkeleton className="bg-gradient-to-br from-sky-700 to-sky-800" />
      ) : (
        <div className={cn(
          "relative overflow-hidden rounded-2xl p-5 text-white shadow-lg",
          budgetPct >= 100 ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20"
            : budgetPct >= 80 ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/20"
            : "bg-gradient-to-br from-sky-700 to-sky-800 shadow-sky-700/20",
        )}>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-2 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Budget Left</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            {totalLimit > 0 ? (
              <>
                <p className="text-3xl font-black">KES {budgetLeft.toLocaleString()}</p>
                <div className="mt-2">
                  <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-white/70 transition-all"
                      style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                  </div>
                  <p className="text-xs font-semibold opacity-80">
                    {budgetPct.toFixed(0)}% used of KES {totalLimit.toLocaleString()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-lg font-black opacity-60">No budgets set</p>
                <Link href="/budgets" className="mt-2 flex items-center gap-1 text-xs font-bold opacity-80 hover:opacity-100">
                  Set a budget <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {savings === null ? (
        <CardSkeleton className="bg-gradient-to-br from-emerald-500 to-emerald-600" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-2 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Savings</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>
            {goalsCount > 0 ? (
              <>
                <p className="text-3xl font-black">KES {totalSaved.toLocaleString()}</p>
                <div className="mt-2">
                  <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-white/70 transition-all"
                      style={{ width: `${savingsPct}%` }} />
                  </div>
                  <p className="text-xs font-semibold text-emerald-100">
                    {completedGoals}/{goalsCount} goal{goalsCount !== 1 ? "s" : ""} · {savingsPct.toFixed(0)}% overall
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-lg font-black opacity-60">No goals yet</p>
                <Link href="/savings" className="mt-2 flex items-center gap-1 text-xs font-bold opacity-80 hover:opacity-100">
                  Create a goal <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}