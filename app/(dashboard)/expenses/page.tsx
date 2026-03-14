"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpenseTable from "@/components/expenses/ExpenseTable";
import ErrorState from "@/components/shared/ErrorState";
import LoadingState from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  expenseCategories,
  type ExpenseCategory,
  type ExpenseCreateInput,
  type ExpenseItem,
} from "@/types";

const today = new Date().toISOString().slice(0, 10);

export default function ExpensesPage() {
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ExpenseCategory | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(today);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (category !== "all") {
      params.set("category", category);
    }
    if (startDate) {
      params.set("startDate", startDate);
    }
    if (endDate) {
      params.set("endDate", endDate);
    }
    return params.toString();
  }, [category, startDate, endDate]);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetch(
      `/api/expenses${queryString ? `?${queryString}` : ""}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      setError("Failed to load expenses");
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as { data: ExpenseItem[] };
    setItems(payload.data);
    setLoading(false);
  }, [queryString]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const createExpense = async (data: ExpenseCreateInput) => {
    setError(null);
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      setError("Failed to create expense");
      return;
    }

    await loadExpenses();
    window.dispatchEvent(new Event("financepal:expenses-updated"));
  };

  const updateExpense = async (data: ExpenseCreateInput) => {
    if (!editingItem) {
      return;
    }

    setError(null);
    const response = await fetch(`/api/expenses/${editingItem._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      setError("Failed to update expense");
      return;
    }

    setEditingItem(null);
    await loadExpenses();
    window.dispatchEvent(new Event("financepal:expenses-updated"));
  };

  const deleteExpense = async (expenseId: string) => {
    setError(null);
    const response = await fetch(`/api/expenses/${expenseId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Failed to delete expense");
      return;
    }

    await loadExpenses();
    window.dispatchEvent(new Event("financepal:expenses-updated"));
  };

  const exportCsv = () => {
    if (!items.length) {
      setError("No expenses to export");
      return;
    }

    const escapeCell = (value: string | number) => {
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    };

    const header = ["date", "description", "category", "amount", "source"];
    const rows = items.map((item) => [
      item.date,
      item.description,
      item.category,
      item.amount,
      item.source,
    ]);

    const csv = [
      header.join(","),
      ...rows.map((row) => row.map((cell) => escapeCell(cell)).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financepal-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    if (!items.length) {
      setError("No expenses to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("FinancePal - Expenses Report", 14, 16);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

    autoTable(doc, {
      startY: 28,
      head: [["Date", "Description", "Category", "Amount", "Source"]],
      body: items.map((item) => [
        item.date.slice(0, 10),
        item.description,
        item.category,
        `KES ${item.amount.toLocaleString()}`,
        item.source,
      ]),
      styles: { fontSize: 9 },
    });

    doc.save(`financepal-expenses-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h1>
        <p className="text-sm text-muted-foreground">
          Add, edit, filter, and manage your daily spending records.
        </p>
      </section>

      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Add new expense</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm mode="create" onSubmit={createExpense} />
        </CardContent>
      </Card>

      {editingItem ? (
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">Edit expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm
              mode="edit"
              initialValue={editingItem}
              onSubmit={updateExpense}
              onCancel={() => setEditingItem(null)}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Filter and export</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-6">
        <div className="grid gap-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as ExpenseCategory | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {expenseCategories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="start-date">Start date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="end-date">End date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={() => void loadExpenses()}>
            Apply filters
          </Button>
        </div>

        <div className="flex items-end">
          <Button type="button" className="bg-sky-900 text-white hover:bg-sky-800" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>

        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={exportPdf}>
            Export PDF
          </Button>
        </div>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} onRetry={() => void loadExpenses()} /> : null}

      {loading ? (
        <LoadingState message="Loading expenses..." />
      ) : (
        <ExpenseTable
          items={items}
          onEdit={setEditingItem}
          onDelete={deleteExpense}
        />
      )}
    </main>
  );
}
