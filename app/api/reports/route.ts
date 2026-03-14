import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Budget from "@/models/Budget";
import Expense from "@/models/Expense";
import SavingsGoal from "@/models/SavingsGoal";
import { type ExpenseCategory, type ReportsResponse } from "@/types";

const querySchema = z.object({
  type: z.enum([
    "monthly",
    "categories",
    "budget-vs-actual",
    "trends",
    "heatmap",
    "savings",
  ]),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  period: z.enum(["week", "month", "year"]).optional(),
  days: z.coerce.number().int().min(7).max(365).optional(),
});

function asObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

function percentage(total: number, value: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid report query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const query = parsed.data;
  const now = new Date();
  const month = query.month ?? now.getMonth() + 1;
  const year = query.year ?? now.getFullYear();

  await dbConnect();

  const userObjectId = asObjectId(session.user.id);

  if (query.type === "monthly") {
    const thisMonthStart = startOfMonth(new Date(year, month - 1, 1));
    const thisMonthEnd = endOfMonth(new Date(year, month - 1, 1));
    const lastMonthDate = subMonths(thisMonthStart, 1);
    const lastMonthStart = startOfMonth(lastMonthDate);
    const lastMonthEnd = endOfMonth(lastMonthDate);

    const [thisMonthSum] = await Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const [lastMonthSum] = await Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const topCategories = await Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 3 },
    ]);

    const thisMonthTotal = Number(thisMonthSum?.total ?? 0);
    const lastMonthTotal = Number(lastMonthSum?.total ?? 0);
    const changePercent =
      lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    const response: ReportsResponse = {
      type: "monthly",
      data: {
        thisMonthTotal,
        lastMonthTotal,
        changePercent,
        topCategories: topCategories.map((item) => ({
          category: item._id as ExpenseCategory,
          total: Number(item.total),
        })),
      },
    };

    return NextResponse.json(response);
  }

  if (query.type === "categories") {
    let startDate = startOfMonth(now);
    let endDate = endOfMonth(now);

    if (query.period === "week") {
      startDate = startOfDay(subDays(now, 6));
      endDate = endOfDay(now);
    } else if (query.period === "year") {
      startDate = startOfMonth(new Date(now.getFullYear(), 0, 1));
      endDate = endOfMonth(new Date(now.getFullYear(), 11, 1));
    }

    const grouped = await Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);

    const overallTotal = grouped.reduce((sum, item) => sum + Number(item.total), 0);

    const response: ReportsResponse = {
      type: "categories",
      data: grouped.map((item) => ({
        category: item._id as ExpenseCategory,
        total: Number(item.total),
        percent: percentage(overallTotal, Number(item.total)),
      })),
    };

    return NextResponse.json(response);
  }

  if (query.type === "budget-vs-actual") {
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const budgets = await Budget.find({
      userId: session.user.id,
      period: "monthly",
      month: currentMonth,
      year: currentYear,
    }).lean();

    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    const actuals = await Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);

    const totalsMap = new Map<string, number>(
      actuals.map((item) => [item._id as string, Number(item.total)]),
    );

    const response: ReportsResponse = {
      type: "budget-vs-actual",
      data: budgets.map((budget) => {
        const actual = totalsMap.get(budget.category) ?? 0;
        return {
          category: budget.category as ExpenseCategory,
          limit: budget.limit,
          actual,
          status: actual <= budget.limit ? "under" : "over",
        };
      }),
    };

    return NextResponse.json(response);
  }

  if (query.type === "trends") {
    const days = query.days ?? 30;
    const startDate = startOfDay(subDays(now, days - 1));

    const grouped = await Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startDate, $lte: endOfDay(now) } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const groupedMap = new Map<string, number>(
      grouped.map((item) => {
        const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(
          item._id.day,
        ).padStart(2, "0")}`;
        return [key, Number(item.total)];
      }),
    );

    const data = Array.from({ length: days }).map((_, index) => {
      const date = startOfDay(subDays(now, days - 1 - index));
      const key = date.toISOString().slice(0, 10);
      return { date: key, total: groupedMap.get(key) ?? 0 };
    });

    const response: ReportsResponse = {
      type: "trends",
      data,
    };

    return NextResponse.json(response);
  }

  if (query.type === "heatmap") {
    const yearValue = query.year ?? now.getFullYear();
    const startDate = new Date(yearValue, 0, 1);
    const endDate = new Date(yearValue, 11, 31, 23, 59, 59, 999);

    const grouped = await Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const maxTotal = grouped.reduce((max, item) => Math.max(max, Number(item.total)), 0);

    const response: ReportsResponse = {
      type: "heatmap",
      data: grouped.map((item) => {
        const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(
          item._id.day,
        ).padStart(2, "0")}`;
        const total = Number(item.total);
        return {
          date: key,
          total,
          intensity: maxTotal > 0 ? total / maxTotal : 0,
        };
      }),
    };

    return NextResponse.json(response);
  }

  const goals = await SavingsGoal.find({ userId: session.user.id }).lean();

  const response: ReportsResponse = {
    type: "savings",
    data: goals.map((goal) => {
      const progressPercent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const monthlyPace = goal.currentAmount > 0 ? goal.currentAmount / 3 : 0;
      const projectedMonthsToGoal = monthlyPace > 0 ? Math.ceil(remaining / monthlyPace) : null;

      return {
        _id: goal._id.toString(),
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progressPercent,
        deadline: goal.deadline.toISOString(),
        projectedMonthsToGoal,
        color: goal.color,
      };
    }),
  };

  return NextResponse.json(response);
}
