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
  limit:    z.number().positive(),
  period:   z.enum(["monthly", "weekly"]),
  month:    z.number().int().min(1).max(12),
  year:     z.number().int().min(2000).max(2100),
});

const updateSchema = budgetInputSchema.partial().extend({
  id: z.string().min(1),
});

function getRange(period: "monthly" | "weekly", month: number, year: number) {
  if (period === "monthly") {
    const base = new Date(year, month - 1, 1);
    return { startDate: startOfMonth(base), endDate: endOfMonth(base) };
  }
  const base = new Date(year, month - 1, 1);
  return {
    startDate: startOfWeek(base, { weekStartsOn: 1 }),
    endDate:   endOfWeek(base,   { weekStartsOn: 1 }),
  };
}

function getAlertLevel(pct: number): "ok" | "warning" | "danger" {
  if (pct >= 100) return "danger";
  if (pct >= 80)  return "warning";
  return "ok";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const budgets = await Budget.find({ userId: session.user.id })
    .sort({ year: -1, month: -1, createdAt: -1 }).lean();

  const enriched = await Promise.all(
    budgets.map(async (b) => {
      const { startDate, endDate } = getRange(b.period as "monthly" | "weekly", b.month, b.year);
      const [sum] = await Expense.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(session.user.id), category: b.category, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const spent      = Number(sum?.total ?? 0);
      const usagePercent = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      return {
        _id: b._id.toString(), category: b.category, limit: b.limit,
        period: b.period, month: b.month, year: b.year,
        spent, usagePercent, alertLevel: getAlertLevel(usagePercent),
      };
    }),
  );

  return NextResponse.json({ data: enriched });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json();
  const parsed  = budgetInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();

  // Upsert: if a budget for this category+period+month+year already exists, update the limit.
  // This prevents duplicates when the chat logs a budget that was already set.
  const doc = await Budget.findOneAndUpdate(
    {
      userId:   session.user.id,
      category: parsed.data.category,
      period:   parsed.data.period,
      month:    parsed.data.month,
      year:     parsed.data.year,
    },
    { $set: { limit: parsed.data.limit } },
    { new: true, upsert: true },
  ).lean();

  return NextResponse.json({
    data: {
      _id:      doc._id.toString(),
      category: doc.category,
      limit:    doc.limit,
      period:   doc.period,
      month:    doc.month,
      year:     doc.year,
    },
  }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json();
  const parsed  = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
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

  if (!updated) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

  return NextResponse.json({
    data: {
      _id:      updated._id.toString(),
      category: updated.category,
      limit:    updated.limit,
      period:   updated.period,
      month:    updated.month,
      year:     updated.year,
    },
  });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid budget id" }, { status: 400 });
  }

  await dbConnect();

  const deleted = await Budget.findOneAndDelete({ _id: id, userId: session.user.id }).lean();
  if (!deleted) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}