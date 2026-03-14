"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
  type BudgetCreateInput,
  type BudgetItem,
  type BudgetPeriod,
  type ExpenseCategory,
} from "@/types";

type BudgetFormProps = {
  editingBudget: BudgetItem | null;
  onSubmit: (payload: BudgetCreateInput, id?: string) => Promise<void>;
  onCancelEdit: () => void;
};

export default function BudgetForm({
  editingBudget,
  onSubmit,
  onCancelEdit,
}: BudgetFormProps) {
  const now = useMemo(() => new Date(), []);
  const [category, setCategory] = useState<ExpenseCategory>(
    editingBudget?.category ?? "food",
  );
  const [limit, setLimit] = useState(String(editingBudget?.limit ?? ""));
  const [period, setPeriod] = useState<BudgetPeriod>(
    editingBudget?.period ?? "monthly",
  );
  const [month, setMonth] = useState(String(editingBudget?.month ?? now.getMonth() + 1));
  const [year, setYear] = useState(String(editingBudget?.year ?? now.getFullYear()));
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(editingBudget);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    await onSubmit(
      {
        category,
        limit: Number(limit),
        period,
        month: Number(month),
        year: Number(year),
      },
      editingBudget?._id,
    );

    setSaving(false);

    if (!isEditing) {
      setLimit("");
      setPeriod("monthly");
      setCategory("food");
      setMonth(String(now.getMonth() + 1));
      setYear(String(now.getFullYear()));
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="grid gap-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as ExpenseCategory)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="budget-limit">Limit (KES)</Label>
          <Input
            id="budget-limit"
            type="number"
            min="1"
            step="0.01"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label>Period</Label>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as BudgetPeriod)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="budget-month">Month</Label>
          <Input
            id="budget-month"
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="budget-year">Year</Label>
          <Input
            id="budget-year"
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={saving} className="bg-sky-900 text-white hover:bg-sky-800">
          {saving
            ? "Saving..."
            : isEditing
              ? "Update budget"
              : "Create budget"}
        </Button>
        {isEditing ? (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
