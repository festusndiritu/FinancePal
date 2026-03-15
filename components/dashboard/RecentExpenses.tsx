"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Receipt, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { ExpenseItem, ExpenseCategory } from "@/types";

const categoryConfig: Record<ExpenseCategory, { color: string; bg: string }> = {
  food:          { color: "text-amber-700",   bg: "bg-amber-50" },
  transport:     { color: "text-blue-700",    bg: "bg-blue-50" },
  utilities:     { color: "text-slate-600",   bg: "bg-slate-100" },
  rent:          { color: "text-violet-700",  bg: "bg-violet-50" },
  education:     { color: "text-indigo-700",  bg: "bg-indigo-50" },
  entertainment: { color: "text-pink-700",    bg: "bg-pink-50" },
  health:        { color: "text-emerald-700", bg: "bg-emerald-50" },
  shopping:      { color: "text-orange-700",  bg: "bg-orange-50" },
  savings:       { color: "text-teal-700",    bg: "bg-teal-50" },
  other:         { color: "text-zinc-600",    bg: "bg-zinc-100" },
};

export default function RecentExpenses() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/expenses", { cache: "no-store" });
    if (!res.ok) { setError("Unable to load expenses"); setLoading(false); return; }
    const payload = (await res.json()) as { data: ExpenseItem[] };
    setExpenses(payload.data.slice(0, 7));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    window.addEventListener("financepal:expenses-updated", load);
    return () => window.removeEventListener("financepal:expenses-updated", load);
  }, [load]);

  const confirmDelete = async () => {
    if (!deletingId) return;
    const res = await fetch(`/api/expenses/${deletingId}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) window.dispatchEvent(new Event("financepal:expenses-updated"));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
            <Receipt className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Expenses</h2>
            <p className="text-xs text-slate-500">Your latest transactions</p>
          </div>
        </div>
        <Link
          href="/expenses"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3 p-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-20 animate-pulse rounded bg-slate-50" />
              </div>
              <div className="h-3.5 w-14 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && <p className="p-5 text-sm text-red-600">{error}</p>}

      {!loading && !error && expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <Receipt className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">No expenses yet</p>
            <p className="text-xs text-slate-400">Add your first expense using Quick Add</p>
          </div>
        </div>
      )}

      {/* Mobile — card list */}
      {!loading && expenses.length > 0 && (
        <>
          <div className="divide-y divide-slate-50 md:hidden">
            {expenses.map((expense) => {
              const config = categoryConfig[expense.category] ?? categoryConfig.other;
              return (
                <div key={expense._id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${config.bg} ${config.color}`}>
                    {expense.category.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{expense.description}</p>
                    <p className="text-xs text-slate-400">
                      <span className={`font-semibold capitalize ${config.color}`}>{expense.category}</span>
                      {" · "}{format(new Date(expense.date), "dd MMM")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(expense.amount)}
                    </p>
                    <button
                      onClick={() => setDeletingId(expense._id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop — full table */}
          <table className="hidden w-full border-collapse md:table">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Description</th>
                <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Category</th>
                <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Date</th>
                <th className="border-b border-slate-200 px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Amount</th>
                <th className="border-b border-slate-200 px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, idx) => {
                const config = categoryConfig[expense.category] ?? categoryConfig.other;
                const isLast = idx === expenses.length - 1;
                return (
                  <tr key={expense._id} className="transition-colors hover:bg-slate-50/60">
                    <td className={`px-5 py-3.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <p className="truncate max-w-[180px] text-sm font-semibold text-slate-800">{expense.description}</p>
                    </td>
                    <td className={`px-5 py-3.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize ${config.bg} ${config.color}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-sm text-slate-500 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      {format(new Date(expense.date), "dd MMM yyyy")}
                    </td>
                    <td className={`px-5 py-3.5 text-right text-sm font-bold text-slate-900 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      {new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(expense.amount)}
                    </td>
                    <td className={`px-5 py-3.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href="/expenses"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeletingId(expense._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete expense"
          message="Are you sure you want to delete this expense? This cannot be undone."
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}