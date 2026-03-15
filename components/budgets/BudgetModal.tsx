"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryEmoji } from "@/components/budgets/BudgetCard";
import type { BudgetCreateInput, BudgetItem } from "@/types";

const CATEGORIES = [
  "food", "transport", "utilities", "rent",
  "education", "entertainment", "health", "shopping", "savings", "other",
] as const;

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type FormState = {
  category: string;
  limit: string;
  period: "monthly" | "weekly";
  month: number;
  year: number;
};

function defaultForm(budget?: BudgetItem | null): FormState {
  const now = new Date();
  if (budget) {
    return {
      category: budget.category,
      limit:    String(budget.limit),
      period:   budget.period,
      month:    budget.month,
      year:     budget.year,
    };
  }
  return {
    category: "food",
    limit:    "",
    period:   "monthly",
    month:    now.getMonth() + 1,
    year:     now.getFullYear(),
  };
}

type Props = {
  mode: "add" | "edit";
  budget: BudgetItem | null;
  saving: boolean;
  error: string | null;
  onSave: (payload: BudgetCreateInput, id?: string) => void;
  onClose: () => void;
};

export default function BudgetModal({ mode, budget, saving, error, onSave, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [form, setForm]       = useState<FormState>(() => defaultForm(budget));

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  // Re-seed form when the editing target changes
  useEffect(() => { setForm(defaultForm(budget)); }, [budget]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = () => {
    const limit = Number(form.limit);
    if (!limit || limit <= 0) return;

    const payload: BudgetCreateInput = {
      category: form.category as BudgetCreateInput["category"],
      limit,
      period: form.period,
      month:  form.month,
      year:   form.year,
    };

    onSave(payload, budget?._id);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9998 }}
      className="flex items-end justify-center sm:items-center"
    >
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        className="bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet on mobile, dialog on sm+ */}
      <div
        style={{ position: "relative", zIndex: 9999 }}
        className="w-full rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {mode === "add" ? "New Budget" : "Edit Budget"}
            </h2>
            <p className="text-xs text-slate-500">Set a spending limit for a category</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Category emoji grid */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Category</label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border py-2 text-center transition-all",
                    form.category === cat
                      ? "border-sky-400 bg-sky-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span className="text-lg leading-none">{categoryEmoji[cat]}</span>
                  <span className={cn(
                    "text-[9px] font-semibold capitalize leading-none",
                    form.category === cat ? "text-sky-700" : "text-slate-500",
                  )}>
                    {cat}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Limit */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Limit (KES)</label>
            <input
              type="number"
              min={1}
              value={form.limit}
              onChange={(e) => setForm((f) => ({ ...f, limit: e.target.value }))}
              placeholder="e.g. 5000"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-sky-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Period / Month / Year */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Period</label>
              <select
                value={form.period}
                onChange={(e) => setForm((f) => ({ ...f, period: e.target.value as "monthly" | "weekly" }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-400 focus:bg-white transition-colors"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Month</label>
              <select
                value={form.month}
                onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-400 focus:bg-white transition-colors"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m.slice(0, 3)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-400 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.limit || saving}
            className="flex-1 rounded-xl bg-sky-900 py-2.5 text-sm font-bold text-white transition-all hover:bg-sky-800 disabled:opacity-40"
          >
            {saving ? "Saving…" : mode === "add" ? "Add Budget" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}