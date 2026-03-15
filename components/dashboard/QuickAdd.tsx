"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, PlusCircle, XCircle } from "lucide-react";
import type { ExpenseCategory } from "@/types";

const categories: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: "food",          label: "Food",          emoji: "🍽️" },
  { value: "transport",     label: "Transport",     emoji: "🚌" },
  { value: "utilities",     label: "Utilities",     emoji: "💡" },
  { value: "rent",          label: "Rent",          emoji: "🏠" },
  { value: "education",     label: "Education",     emoji: "📚" },
  { value: "entertainment", label: "Fun",           emoji: "🎬" },
  { value: "health",        label: "Health",        emoji: "💊" },
  { value: "shopping",      label: "Shopping",      emoji: "🛍️" },
  { value: "savings",       label: "Savings",       emoji: "💰" },
  { value: "other",         label: "Other",         emoji: "📌" },
];

export default function QuickAdd() {
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    setIsSubmitting(true);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setStatus("error");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        amount: parsedAmount,
        category,
        date: new Date().toISOString(),
        source: "manual",
      }),
    });

    setIsSubmitting(false);
    if (!response.ok) { setStatus("error"); return; }

    setStatus("success");
    setDescription("");
    setAmount("");
    window.dispatchEvent(new Event("financepal:expenses-updated"));
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50">
            <PlusCircle className="h-4 w-4 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Quick Add</h2>
            <p className="text-xs text-slate-500">Log an expense instantly</p>
          </div>
        </div>
      </div>

      <form className="flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            What did you spend on?
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Lunch at Java"
            required
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-300 transition-colors focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Amount (KES)
          </label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-300 transition-colors focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
          />
        </div>

        {/* Category pills */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Category
          </label>
          <div className="grid grid-cols-5 gap-2">
            {categories.map((cat) => {
              const isSelected = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 px-1 py-3 transition-all ${
                    isSelected
                      ? "border-sky-500 bg-sky-50"
                      : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white"
                  }`}
                >
                  <span className="text-xl leading-none">{cat.emoji}</span>
                  <span className={`text-[9px] font-bold leading-none ${
                    isSelected ? "text-sky-700" : "text-slate-500"
                  }`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        {status === "success" && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">Expense saved!</p>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-2.5">
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm font-semibold text-red-700">Something went wrong.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-900 text-sm font-bold text-white shadow-sm transition-all hover:bg-sky-800 active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <><PlusCircle className="h-4 w-4" /> Add Expense</>
          )}
        </button>
      </form>
    </div>
  );
}