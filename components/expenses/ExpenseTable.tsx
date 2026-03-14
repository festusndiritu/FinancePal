"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExpenseItem } from "@/types";
import CategoryBadge from "./CategoryBadge";

type ExpenseTableProps = {
  items: ExpenseItem[];
  onEdit: (expense: ExpenseItem) => void;
  onDelete: (expenseId: string) => Promise<void>;
};

export default function ExpenseTable({
  items,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  if (!items.length) {
    return (
      <div className="rounded-xl bg-slate-50 p-6 text-sm text-muted-foreground">
        No expenses found for the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-slate-50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((expense) => (
            <TableRow key={expense._id}>
              <TableCell>{format(new Date(expense.date), "dd MMM yyyy")}</TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>
                <CategoryBadge category={expense.category} />
              </TableCell>
              <TableCell className="text-right font-medium">
                KES {expense.amount.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(expense)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void onDelete(expense._id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
