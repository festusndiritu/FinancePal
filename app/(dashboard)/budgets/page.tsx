"use client";

import { useState } from "react";
import { Plus, TrendingUp, AlertTriangle } from "lucide-react";
import { useBudgets } from "@/hooks/useBudgets";
import BudgetCard from "@/components/budgets/BudgetCard";
import BudgetModal from "@/components/budgets/BudgetModal";
import DeleteBudgetDialog from "@/components/budgets/DeleteBudgetDialog";
import type { BudgetCreateInput, BudgetItem } from "@/types";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function BudgetsPage() {
  const { budgets, isLoading, error, mutate } = useBudgets();

  const [modalMode, setModalMode]         = useState<"add" | "edit" | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState<string | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetItem | null>(null);
  const [deleting, setDeleting]           = useState(false);

  const openAdd = () => { setEditingBudget(null); setSaveError(null); setModalMode("add"); };
  const openEdit = (b: BudgetItem) => { setEditingBudget(b); setSaveError(null); setModalMode("edit"); };
  const closeModal = () => { setModalMode(null); setEditingBudget(null); setSaveError(null); };

  const handleSave = async (payload: BudgetCreateInput, id?: string) => {
    setSaving(true); setSaveError(null);
    const res = await fetch("/api/budgets", {
      method:  id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(id ? { ...payload, id } : payload),
    });
    setSaving(false);
    if (!res.ok) { setSaveError(id ? "Failed to update budget." : "Failed to create budget."); return; }
    closeModal();
    await mutate();
    window.dispatchEvent(new Event("financepal:budgets-updated"));
  };

  const handleDelete = async () => {
    if (!deletingBudget) return;
    setDeleting(true);
    const res = await fetch(`/api/budgets?id=${deletingBudget._id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) { setDeletingBudget(null); await mutate(); window.dispatchEvent(new Event("financepal:budgets-updated")); }
  };

  const now       = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear  = now.getFullYear();
  const current   = budgets.filter((b) => b.month === thisMonth && b.year === thisYear);
  const other     = budgets.filter((b) => !(b.month === thisMonth && b.year === thisYear));

  return (
    <div className="px-4 py-6 pb-24 md:px-8 md:pb-8">
      {/* ── Toolbar ── */}
      <div className="mb-6 flex items-center justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-sky-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-sky-800 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Budget</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      )}

      {/* ── Error ── */}
      {!isLoading && error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && !error && budgets.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50">
            <TrendingUp className="h-7 w-7 text-sky-600" />
          </div>
          <div>
            <p className="font-black text-slate-800">No budgets yet</p>
            <p className="mt-1 text-sm text-slate-500">Set spending limits to keep your categories in check.</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-sky-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-800">
            <Plus className="h-4 w-4" /> Create your first budget
          </button>
        </div>
      )}

      {/* ── This month ── */}
      {!isLoading && !error && current.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            This Month — {MONTHS[thisMonth - 1]} {thisYear}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {current.map((b) => <BudgetCard key={b._id} budget={b} onEdit={openEdit} onDelete={setDeletingBudget} />)}
          </div>
        </div>
      )}

      {/* ── Other periods ── */}
      {!isLoading && !error && other.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Other Periods</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {other.map((b) => <BudgetCard key={b._id} budget={b} onEdit={openEdit} onDelete={setDeletingBudget} />)}
          </div>
        </div>
      )}

      {modalMode && (
        <BudgetModal mode={modalMode} budget={editingBudget} saving={saving} error={saveError} onSave={handleSave} onClose={closeModal} />
      )}
      {deletingBudget && (
        <DeleteBudgetDialog budget={deletingBudget} deleting={deleting} onConfirm={handleDelete} onClose={() => setDeletingBudget(null)} />
      )}
    </div>
  );
}