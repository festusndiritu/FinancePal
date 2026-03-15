import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Budget from "@/models/Budget";
import Expense from "@/models/Expense";
import { expenseCategories } from "@/types";

const budgetInputSchema = z.object({
  category: z.enum(expenseCategories),
  limit: z.number().positive(),
  period: z.enum(["monthly", "weekly"]),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

const updateSchema = budgetInputSchema.partial().extend({
  id: z.string().min(1),
});

function getRange(period: "monthly" | "weekly", month: number, year: number) {
  if (period === "monthly") {
    const baseDate = new Date(year, month - 1, 1);
    return {
      startDate: startOfMonth(baseDate),
      endDate: endOfMonth(baseDate),
    };
  }

  const baseDate = new Date(year, month - 1, 1);
  return {
    startDate: startOfWeek(baseDate, { weekStartsOn: 1 }),
    endDate: endOfWeek(baseDate, { weekStartsOn: 1 }),
  };
}

function getAlertLevel(usagePercent: number): "ok" | "warning" | "danger" {
  if (usagePercent >= 100) return "danger";
  if (usagePercent >= 80)  return "warning";
  return "ok";
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const budgets = await Budget.find({ userId: session.user.id })
    .sort({ year: -1, month: -1, createdAt: -1 })
    .lean();

  const enrichedBudgets = await Promise.all(
    budgets.map(async (budget) => {
      const { startDate, endDate } = getRange(
        budget.period as "monthly" | "weekly",
        budget.month,
        budget.year,
      );

      const [sumResult] = await Expense.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(session.user.id),
            category: budget.category,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      const spent = Number(sumResult?.total ?? 0);
      const usagePercent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

      return {
        _id: budget._id.toString(),
        category: budget.category,
        limit: budget.limit,
        period: budget.period,
        month: budget.month,
        year: budget.year,
        spent,
        usagePercent,
        alertLevel: getAlertLevel(usagePercent),
      };
    }),
  );

  return NextResponse.json({ data: enrichedBudgets });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = budgetInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await dbConnect();

  const created = await Budget.create({
    ...parsed.data,
    userId: session.user.id,
  });

  return NextResponse.json(
    {
      data: {
        _id: created._id.toString(),
        category: created.category,
        limit: created.limit,
        period: created.period,
        month: created.month,
        year: created.year,
      },
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!mongoose.Types.ObjectId.isValid(parsed.data.id)) {
    return NextResponse.json({ error: "Invalid budget id" }, { status: 400 });
  }

  await dbConnect();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.category) updateData.category = parsed.data.category;
  if (parsed.data.limit)    updateData.limit    = parsed.data.limit;
  if (parsed.data.period)   updateData.period   = parsed.data.period;
  if (parsed.data.month)    updateData.month    = parsed.data.month;
  if (parsed.data.year)     updateData.year     = parsed.data.year;

  const updated = await Budget.findOneAndUpdate(
    { _id: parsed.data.id, userId: session.user.id },
    updateData,
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      _id: updated._id.toString(),
      category: updated.category,
      limit: updated.limit,
      period: updated.period,
      month: updated.month,
      year: updated.year,
    },
  });
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid budget id" }, { status: 400 });
  }

  await dbConnect();

  const deleted = await Budget.findOneAndDelete({
    _id: id,
    userId: session.user.id,
  }).lean();

  if (!deleted) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}