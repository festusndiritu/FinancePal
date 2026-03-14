"use client";

import { useEffect, useState } from "react";
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
  type ExpenseCategory,
  type ExpenseCreateInput,
  type ExpenseItem,
} from "@/types";

type ExpenseFormProps = {
  mode: "create" | "edit";
  initialValue?: ExpenseItem | null;
  onSubmit: (data: ExpenseCreateInput) => Promise<void>;
  onCancel?: () => void;
};

export default function ExpenseForm({
  mode,
  initialValue,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(initialValue?.amount.toString() ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(
    initialValue?.category ?? "other",
  );
  const [date, setDate] = useState(
    initialValue?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!initialValue) {
      return;
    }

    setAmount(initialValue.amount.toString());
    setDescription(initialValue.description);
    setCategory(initialValue.category);
    setDate(initialValue.date.slice(0, 10));
  }, [initialValue]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    await onSubmit({
      amount: Number(amount),
      description,
      category,
      date,
      source: "manual",
    });

    setIsSubmitting(false);

    if (mode === "create") {
      setAmount("");
      setDescription("");
      setCategory("other");
      setDate(new Date().toISOString().slice(0, 10));
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor={`${mode}-description`}>Description</Label>
        <Input
          id={`${mode}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. Lunch at campus"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={`${mode}-amount`}>Amount (KES)</Label>
          <Input
            id={`${mode}-amount`}
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </div>

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
          <Label htmlFor={`${mode}-date`}>Date</Label>
          <Input
            id={`${mode}-date`}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting} className="bg-sky-900 text-white hover:bg-sky-800">
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Add expense"
              : "Save changes"}
        </Button>
        {mode === "edit" && onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
