"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, Filter, Plus, FileText, Search, X } from "lucide-react";
import ExpenseModal from "@/components/expenses/ExpenseModal";
import ExpenseTable from "@/components/expenses/ExpenseTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import {
  expenseCategories,
  type ExpenseCategory,
  type ExpenseCreateInput,
  type ExpenseItem,
} from "@/types";

export default function ExpensesPage() {
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ExpenseCategory | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return params.toString();
  }, [category, startDate, endDate]);

  // Client-side search filter on top of server data
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q),
    );
  }, [items, search]);

  const hasActiveFilters = category !== "all" || startDate || endDate || search;

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(
      `/api/expenses${queryString ? `?${queryString}` : ""}`,
      { cache: "no-store" },
    );
    if (!response.ok) { setError("Failed to load expenses"); setLoading(false); return; }
    const payload = (await response.json()) as { data: ExpenseItem[] };
    setItems(payload.data);
    setLoading(false);
  }, [queryString]);

  const loadExpensesRef = useRef(loadExpenses);
  useEffect(() => { loadExpensesRef.current = loadExpenses; }, [loadExpenses]);
  useEffect(() => { void loadExpenses(); }, [loadExpenses]);
  useEffect(() => {
    const handler = () => { void loadExpensesRef.current(); };
    window.addEventListener("financepal:expenses-updated", handler);
    return () => window.removeEventListener("financepal:expenses-updated", handler);
  }, []);

  const clearFilters = () => {
    setCategory("all");
    setStartDate("");
    setEndDate("");
    setSearch("");
  };

  const createExpense = async (data: ExpenseCreateInput) => {
    setError(null);
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) { setError("Failed to create expense"); return; }
    setShowAddModal(false);
    await loadExpenses();
    window.dispatchEvent(new Event("financepal:expenses-updated"));
  };

  const updateExpense = async (data: ExpenseCreateInput) => {
    if (!editingItem) return;
    setError(null);
    const res = await fetch(`/api/expenses/${editingItem._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) { setError("Failed to update expense"); return; }
    setEditingItem(null);
    await loadExpenses();
    window.dispatchEvent(new Event("financepal:expenses-updated"));
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setError(null);
    const res = await fetch(`/api/expenses/${deletingId}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) { setError("Failed to delete expense"); return; }
    await loadExpenses();
    window.dispatchEvent(new Event("financepal:expenses-updated"));
  };

  const exportCsv = () => {
    if (!filteredItems.length) return;
    const header = ["date", "description", "category", "amount", "source"];
    const rows = filteredItems.map((i) => [i.date, i.description, i.category, i.amount, i.source]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `financepal-expenses-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    if (!filteredItems.length) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header banner
    doc.setFillColor(12, 74, 110); // sky-900
    doc.rect(0, 0, pageWidth, 38, "F");

    // Logo text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("FinancePal", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Expenses Report", 14, 25);

    // Date range info
    const dateRange = startDate && endDate
      ? `${startDate} → ${endDate}`
      : startDate ? `From ${startDate}` : endDate ? `Until ${endDate}` : "All time";
    doc.text(dateRange, 14, 33);

    // Generated at (right side)
    doc.setFontSize(8);
    const genText = `Generated: ${new Date().toLocaleString()}`;
    doc.text(genText, pageWidth - 14, 33, { align: "right" });

    // Summary row
    const total = filteredItems.reduce((sum, i) => sum + i.amount, 0);
    const totalFormatted = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(total);

    doc.setFillColor(240, 249, 255); // sky-50
    doc.roundedRect(14, 44, pageWidth - 28, 16, 3, 3, "F");
    doc.setTextColor(12, 74, 110);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${totalFormatted}`, 20, 54);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`${filteredItems.length} transactions`, pageWidth - 20, 54, { align: "right" });

    // Category filter label
    if (category !== "all") {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(`Category: ${category}`, 20, 64);
    }

    // Table
    autoTable(doc, {
      startY: category !== "all" ? 68 : 64,
      head: [["Date", "Description", "Category", "Amount", "Source"]],
      body: filteredItems.map((i) => [
        i.date.slice(0, 10),
        i.description,
        i.category.charAt(0).toUpperCase() + i.category.slice(1),
        new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(i.amount),
        i.source === "chatbot" ? "AI Chat" : "Manual",
      ]),
      headStyles: {
        fillColor: [12, 74, 110],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 28 },
        3: { halign: "right" },
        4: { cellWidth: 22, halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `FinancePal · Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" },
      );
    }

    doc.save(`financepal-expenses-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <main className="flex flex-col gap-5 p-6 lg:p-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex h-10 items-center gap-2 rounded-xl bg-sky-900 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-sky-800"
        >
          <Plus className="h-4 w-4" /> Add expense
        </button>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={exportPdf} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Search bar */}
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description or category…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter row */}
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Filters</span>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* Category pills */}
            <div className="space-y-1.5 sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-500">Category</label>
              <div className="flex flex-wrap gap-2">
                {(["all", ...expenseCategories] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat as ExpenseCategory | "all")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all ${
                      category === cat
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500">From date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500">To date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100" />
            </div>
            <div className="flex items-end">
              <button onClick={() => void loadExpenses()}
                className="h-10 w-full rounded-xl bg-slate-900 text-sm font-bold text-white transition-colors hover:bg-slate-800">
                Apply dates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-500">
            <span className="font-bold text-slate-800">{filteredItems.length}</span>
            {" "}expense{filteredItems.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " matching filters" : " total"}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 w-24 animate-pulse rounded-md bg-slate-100" />
                <div className="h-4 flex-1 animate-pulse rounded-md bg-slate-100" />
                <div className="h-4 w-20 animate-pulse rounded-md bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <ExpenseTable items={filteredItems} onEdit={setEditingItem} onDelete={(id) => setDeletingId(id)} />
        )}
      </div>

      {showAddModal && <ExpenseModal mode="create" onSubmit={createExpense} onClose={() => setShowAddModal(false)} />}
      {editingItem && <ExpenseModal mode="edit" initialValue={editingItem} onSubmit={updateExpense} onClose={() => setEditingItem(null)} />}
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
    </main>
  );
}