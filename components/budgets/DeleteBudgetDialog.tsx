"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { categoryEmoji, categoryColors } from "@/components/budgets/BudgetCard";
import { cn } from "@/lib/utils";
import type { BudgetItem } from "@/types";

type Props = {
  budget: BudgetItem;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function DeleteBudgetDialog({ budget, deleting, onConfirm, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted) return null;

  const colors = categoryColors[budget.category] ?? categoryColors.other;

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9998 }}
      className="flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998 }}
        className="bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        style={{ position: "relative", zIndex: 9999 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start gap-3">
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl",
            colors.bg,
          )}>
            {categoryEmoji[budget.category] ?? "📦"}
          </div>
          <div>
            <h3 className="font-black text-slate-900">Delete budget?</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              This will permanently remove your{" "}
              <span className="font-semibold capitalize text-slate-700">{budget.category}</span>{" "}
              {budget.period} budget of{" "}
              <span className="font-semibold text-slate-700">
                KES {budget.limit.toLocaleString()}
              </span>
              . This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}