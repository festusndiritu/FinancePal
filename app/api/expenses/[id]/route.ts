import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Expense from "@/models/Expense";
import { expenseCategories } from "@/types";

const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().min(2).max(200).optional(),
  category: z.enum(expenseCategories).optional(),
  date: z.string().datetime().or(z.string().date()).optional(),
  source: z.enum(["chatbot", "manual"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
  }

  const payload = await request.json();
  const parsed = updateExpenseSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.date) {
    update.date = new Date(parsed.data.date);
  }

  await dbConnect();

  const expense = await Expense.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    update,
    { new: true },
  ).lean();

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...expense,
      _id: expense._id.toString(),
      userId: expense.userId.toString(),
      date: expense.date.toISOString(),
      createdAt: expense.createdAt?.toISOString(),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
  }

  await dbConnect();

  const deleted = await Expense.findOneAndDelete({
    _id: id,
    userId: session.user.id,
  }).lean();

  if (!deleted) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
