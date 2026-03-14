"use client";

import { useState } from "react";
import BudgetForm from "@/components/budgets/BudgetForm";
import BudgetList from "@/components/budgets/BudgetList";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import LoadingState from "@/components/shared/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudgets } from "@/hooks/useBudgets";
import type { BudgetCreateInput, BudgetItem } from "@/types";

export default function BudgetsPage() {
  const { budgets, isLoading, error, mutate } = useBudgets();
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSubmit = async (payload: BudgetCreateInput, id?: string) => {
    setActionError(null);

    const response = await fetch("/api/budgets", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { ...payload, id } : payload),
    });

    if (!response.ok) {
      setActionError(id ? "Failed to update budget" : "Failed to create budget");
      return;
    }

    setEditingBudget(null);
    await mutate();
    window.dispatchEvent(new Event("financepal:budgets-updated"));
  };

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Set category spending limits and monitor alerts at 80% and 100% usage.
        </p>
      </section>

      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">
            {editingBudget ? "Edit budget" : "Create budget"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetForm
            editingBudget={editingBudget}
            onSubmit={handleSubmit}
            onCancelEdit={() => setEditingBudget(null)}
          />
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} onRetry={() => void mutate()} /> : null}
      {actionError ? <ErrorState message={actionError} /> : null}

      {isLoading ? (
        <LoadingState message="Loading budgets..." />
      ) : budgets.length === 0 ? (
        <EmptyState message="No budgets yet. Add your first category limit above." />
      ) : (
        <BudgetList budgets={budgets} onEdit={setEditingBudget} />
      )}
    </main>
  );
}
