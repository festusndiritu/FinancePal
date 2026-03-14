import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Expense from "@/models/Expense";
import { expenseCategories } from "@/types";

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(2).max(200),
  category: z.enum(expenseCategories),
  date: z.string().datetime().or(z.string().date()),
  source: z.enum(["chatbot", "manual"]).optional(),
});

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  await dbConnect();

  const query: {
    userId: string;
    category?: string;
    date?: { $gte?: Date; $lte?: Date };
  } = { userId: session.user.id };

  if (category && expenseCategories.includes(category as (typeof expenseCategories)[number])) {
    query.category = category;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate);
    }
  }

  const expenses = await Expense.find(query).sort({ date: -1 }).lean();

  return NextResponse.json({
    data: expenses.map((expense) => ({
      ...expense,
      _id: expense._id.toString(),
      userId: expense.userId.toString(),
      date: expense.date.toISOString(),
      createdAt: expense.createdAt?.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createExpenseSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await dbConnect();

  const created = await Expense.create({
    ...parsed.data,
    userId: session.user.id,
    date: new Date(parsed.data.date),
    source: parsed.data.source ?? "manual",
  });

  return NextResponse.json(
    {
      data: {
        _id: created._id.toString(),
        amount: created.amount,
        description: created.description,
        category: created.category,
        date: created.date.toISOString(),
        source: created.source,
      },
    },
    { status: 201 },
  );
}
