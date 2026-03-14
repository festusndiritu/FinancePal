"use client";

import { FormEvent, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { ExpenseCategory } from "@/types";

const categories = [
  "food",
  "transport",
  "utilities",
  "rent",
  "education",
  "entertainment",
  "health",
  "shopping",
  "savings",
  "other",
];

export default function QuickAdd() {
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setStatus("Enter a valid amount greater than zero.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description,
        amount: parsedAmount,
        category,
        date: new Date().toISOString(),
        source: "manual",
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setStatus("Failed to save expense. Try again.");
      return;
    }

    setStatus("Expense saved.");
    setDescription("");
    setAmount("");
    window.dispatchEvent(new Event("financepal:expenses-updated"));
  };

  return (
    <Card className="bg-slate-50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Quick Add Expense</CardTitle>
        <p className="text-sm text-slate-600">Fast entry from the dashboard.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="quick-description">Description</Label>
            <Input
              id="quick-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Lunch"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-amount">Amount (KES)</Label>
            <Input
              id="quick-amount"
              type="number"
              min="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 350"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as ExpenseCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem key={item} value={item} className="capitalize">
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="h-11 w-full bg-sky-900 text-white hover:bg-sky-800"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Add Expense"}
          </Button>
        </form>

        {status ? (
          <p className="mt-3 text-xs text-slate-600">{status}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
