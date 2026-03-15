"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Save, PlusCircle } from "lucide-react";
import {
  expenseCategories,
  type ExpenseCategory,
  type ExpenseCreateInput,
  type ExpenseItem,
} from "@/types";
import { cn } from "@/lib/utils";

type ExpenseModalProps = {
  mode: "create" | "edit";
  initialValue?: ExpenseItem | null;
  onSubmit: (data: ExpenseCreateInput) => Promise<void>;
  onClose: () => void;
};

const categoryEmojis: Record<ExpenseCategory, string> = {
  food:          "🍽️",
  transport:     "🚌",
  utilities:     "💡",
  rent:          "🏠",
  education:     "📚",
  entertainment: "🎬",
  health:        "💊",
  shopping:      "🛍️",
  savings:       "💰",
  other:         "📌",
};

export default function ExpenseModal({ mode, initialValue, onSubmit, onClose }: ExpenseModalProps) {
  const [amount,      setAmount]      = useState(initialValue?.amount.toString() ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [category,    setCategory]    = useState<ExpenseCategory>(initialValue?.category ?? "other");
  const [date,        setDate]        = useState(
    initialValue?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted,      setMounted]      = useState(false);
  // Controls the slide-up animation for the bottom sheet
  const [visible,      setVisible]      = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setVisible(true), 10);
    return () => { clearTimeout(t); setMounted(false); };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ amount: Number(amount), description, category, date, source: "manual" });
    setIsSubmitting(false);
  };

  if (!mounted) return null;

  // ── Shared form body ──────────────────────────────────────────────────────

  const formBody = (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Description
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Lunch at Java"
          required
          autoFocus
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
        />
      </div>

      {/* Amount + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Amount (KES)
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
        </div>
      </div>

      {/* Category grid */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Category
        </label>
        <div className="grid grid-cols-5 gap-2">
          {expenseCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 px-1 py-3 transition-all",
                category === cat
                  ? "border-sky-500 bg-sky-50"
                  : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-100",
              )}
            >
              <span className="text-xl leading-none">{categoryEmojis[cat]}</span>
              <span className={cn(
                "text-[9px] font-bold capitalize leading-none",
                category === cat ? "text-sky-700" : "text-slate-500",
              )}>
                {cat}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-900 py-2.5 text-sm font-bold text-white transition-all hover:bg-sky-800 disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : mode === "create" ? (
            <><PlusCircle className="h-4 w-4" /> Add expense</>
          ) : (
            <><Save className="h-4 w-4" /> Save changes</>
          )}
        </button>
      </div>
    </form>
  );

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-base font-bold text-slate-900">
          {mode === "create" ? "Add new expense" : "Edit expense"}
        </h2>
        <p className="text-xs text-slate-500">
          {mode === "create" ? "Log a new spending entry" : "Update this expense"}
        </p>
      </div>
      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* ── Mobile: bottom sheet ── */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9999 }}
        className="flex items-end md:hidden"
      >
        <div
          className={cn(
            "w-full rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out",
            visible ? "translate-y-0" : "translate-y-full",
          )}
        >
          {/* Drag handle */}
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-slate-200" />
          </div>
          <div className="px-5 pb-6 pt-3">
            <div className="mb-4">{header}</div>
            {formBody}
          </div>
        </div>
      </div>

      {/* ── Desktop: centered dialog ── */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "100%",
          maxWidth: "480px",
          padding: "0 16px",
          boxSizing: "border-box",
        }}
        className="hidden md:block"
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-6 py-4">{header}</div>
          <div className="p-6">{formBody}</div>
        </div>
      </div>
    </>,
    document.body,
  );
}