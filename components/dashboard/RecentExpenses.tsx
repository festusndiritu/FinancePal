"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExpenseItem } from "@/types";

export default function RecentExpenses() {
  const [recentExpenses, setRecentExpenses] = useState<ExpenseItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRecentExpenses = useCallback(async () => {
    setError(null);

    const response = await fetch("/api/expenses", { cache: "no-store" });

    if (!response.ok) {
      setError("Unable to load recent expenses");
      return;
    }

    const payload = (await response.json()) as { data: ExpenseItem[] };
    setRecentExpenses(payload.data.slice(0, 5));
  }, []);

  useEffect(() => {
    void loadRecentExpenses();
  }, [loadRecentExpenses]);

  useEffect(() => {
    const handleRefresh = () => {
      void loadRecentExpenses();
    };

    window.addEventListener("financepal:expenses-updated", handleRefresh);

    return () => {
      window.removeEventListener("financepal:expenses-updated", handleRefresh);
    };
  }, [loadRecentExpenses]);

  return (
    <section className="rounded-2xl bg-slate-50 p-4">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Recent Expenses</h2>
        <p className="text-sm text-slate-600">Your latest 5 transactions</p>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentExpenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-sm text-slate-500">
                No expenses yet. Add one using Quick Add.
              </TableCell>
            </TableRow>
          ) : null}

          {recentExpenses.map((expense) => (
            <TableRow key={expense._id}>
              <TableCell className="font-medium">{expense.description}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell>{expense.date.slice(0, 10)}</TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("en-KE", {
                  style: "currency",
                  currency: "KES",
                  maximumFractionDigits: 0,
                }).format(expense.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
