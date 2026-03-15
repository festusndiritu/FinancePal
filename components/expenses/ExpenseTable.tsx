"use client";

import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
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

type Props = {
  items: ExpenseItem[];
  onEdit: (expense: ExpenseItem) => void;
  onDelete: (id: string) => void;
};

export default function ExpenseTable({ items, onEdit, onDelete }: Props) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm font-semibold text-slate-500">No expenses found</p>
        <p className="text-xs text-slate-400">Try adjusting your filters or add a new expense</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile: card list ── */}
      <div className="divide-y divide-slate-100 md:hidden">
        {items.map((expense) => {
          const config = categoryConfig[expense.category] ?? categoryConfig.other;
          return (
            <div key={expense._id} className="flex items-start gap-3 px-5 py-4">
              {/* Category dot */}
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${config.bg} ${config.color}`}>
                {expense.category.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {expense.description}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${config.bg} ${config.color}`}>
                    {expense.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {format(new Date(expense.date), "dd MMM yyyy")}
                  </span>
                  {expense.source === "chatbot" && (
                    <span className="text-[10px] text-slate-400">· AI chat</span>
                  )}
                </div>
              </div>

              {/* Amount + actions */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <p className="text-sm font-bold text-slate-900">
                  {new Intl.NumberFormat("en-KE", {
                    style: "currency",
                    currency: "KES",
                    maximumFractionDigits: 0,
                  }).format(expense.amount)}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onEdit(expense)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDelete(expense._id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop: full table ── */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Date</th>
              <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Description</th>
              <th className="border-b border-slate-200 px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Category</th>
              <th className="border-b border-slate-200 px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Amount</th>
              <th className="border-b border-slate-200 px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((expense, idx) => {
              const config = categoryConfig[expense.category] ?? categoryConfig.other;
              const isLast = idx === items.length - 1;
              return (
                <tr key={expense._id} className="transition-colors hover:bg-slate-50/60">
                  <td className={`px-5 py-3.5 text-sm text-slate-500 ${!isLast ? "border-b border-slate-100" : ""}`}>
                    {format(new Date(expense.date), "dd MMM yyyy")}
                  </td>
                  <td className={`px-5 py-3.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                    <p className="text-sm font-semibold text-slate-800">{expense.description}</p>
                    {expense.source === "chatbot" && (
                      <p className="text-[10px] text-slate-400">via AI chat</p>
                    )}
                  </td>
                  <td className={`px-5 py-3.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold capitalize ${config.bg} ${config.color}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-right text-sm font-bold text-slate-900 ${!isLast ? "border-b border-slate-100" : ""}`}>
                    {new Intl.NumberFormat("en-KE", {
                      style: "currency",
                      currency: "KES",
                      maximumFractionDigits: 0,
                    }).format(expense.amount)}
                  </td>
                  <td className={`px-5 py-3.5 ${!isLast ? "border-b border-slate-100" : ""}`}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(expense)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(expense._id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}