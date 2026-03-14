import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { groq, groqModel } from "@/lib/groq";
import ChatMessage from "@/models/ChatMessage";
import Expense from "@/models/Expense";
import { expenseCategories } from "@/types";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const payloadSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

const extractedExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(expenseCategories),
  description: z.string().min(1).max(200),
  date: z.string().datetime().or(z.string().date()).optional(),
});

const extractedBudgetSchema = z.object({
  category: z.enum(expenseCategories),
  limit: z.number().positive(),
  period: z.enum(["monthly", "weekly"]).optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
});

function extractBlocks<T>(
  input: string,
  tag: string,
  schema: z.ZodType<T>,
): { items: T[]; cleanReply: string } {
  const blockRegex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi");
  const items: T[] = [];
  let match: RegExpExecArray | null = blockRegex.exec(input);

  while (match) {
    const rawJson = match[1].trim();
    try {
      const parsedJson = JSON.parse(rawJson);
      const parsedItem = schema.safeParse(parsedJson);
      if (parsedItem.success) {
        items.push(parsedItem.data);
      }
    } catch {
      // Ignore malformed blocks and keep natural-language response.
    }
    match = blockRegex.exec(input);
  }

  const cleanReply = input.replace(blockRegex, "").trim();

  return {
    items,
    cleanReply: cleanReply || input,
  };
}

function extractFinancialBlocks(input: string) {
  const expensesResult = extractBlocks(input, "expense", extractedExpenseSchema);
  const budgetsResult = extractBlocks(
    expensesResult.cleanReply,
    "budget",
    extractedBudgetSchema,
  );

  return {
    expenses: expensesResult.items,
    budgets: budgetsResult.items,
    cleanReply: budgetsResult.cleanReply,
  };
}

function getBudgetPeriodDate(period: "monthly" | "weekly") {
  const now = new Date();
  return {
    period,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

function normalizeBudgetPayload(budget: z.infer<typeof extractedBudgetSchema>) {
  const basePeriod = budget.period ?? "monthly";
  const baseDate = getBudgetPeriodDate(basePeriod);

  return {
    category: budget.category,
    limit: budget.limit,
    period: basePeriod,
    month: budget.month ?? baseDate.month,
    year: budget.year ?? baseDate.year,
  };
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const messages = await ChatMessage.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const ordered = messages.reverse();

  return NextResponse.json({
    data: ordered.map((message) => ({
      _id: message._id.toString(),
      role: message.role,
      content: message.content,
      createdAt: message.createdAt?.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await dbConnect();

  const recentExpenses = await Expense.find({ userId: session.user.id })
    .sort({ date: -1 })
    .limit(10)
    .lean();

  const expenseContext = recentExpenses
    .map(
      (expense) =>
        `- ${expense.date.toISOString().slice(0, 10)} | ${expense.category} | KES ${expense.amount} | ${expense.description}`,
    )
    .join("\n");

  const systemPrompt = [
    "You are FinancePal, an intelligent personal finance assistant.",
    "You help users log expenses, query spending, set budgets, and give practical financial advice.",
    "When a user logs an expense, include an <expense>...</expense> JSON block before your confirmation.",
    "When a user creates or updates a budget, include a <budget>...</budget> JSON block before your confirmation.",
    `Allowed categories: ${expenseCategories.join(", ")}.`,
    "Currency is KES by default unless user specifies otherwise.",
    "For <budget> JSON, use: category, limit, period ('monthly' or 'weekly'), optional month and year.",
    "Keep responses concise, warm, and practical.",
    "Here are the most recent expenses for context:",
    expenseContext || "- No expenses yet.",
  ].join("\n");

  const completion = await groq.chat.completions.create({
    model: groqModel,
    temperature: 0.4,
    max_tokens: 1024,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...parsed.data.messages,
    ],
  });

  const assistantRawReply = completion.choices[0]?.message?.content?.trim();

  if (!assistantRawReply) {
    return NextResponse.json(
      { error: "No response generated by model" },
      { status: 502 },
    );
  }

  const { expenses, budgets, cleanReply } = extractFinancialBlocks(assistantRawReply);

  const lastUserMessage = parsed.data.messages[parsed.data.messages.length - 1];

  if (lastUserMessage?.role === "user") {
    await ChatMessage.create({
      userId: session.user.id,
      role: "user",
      content: lastUserMessage.content,
    });
  }

  await ChatMessage.create({
    userId: session.user.id,
    role: "assistant",
    content: cleanReply,
  });

  const normalizedBudgets = budgets.map((budget) => normalizeBudgetPayload(budget));

  return NextResponse.json({
    reply: cleanReply,
    extractedExpenses: expenses.map((expense, index) => ({
      _id: `extracted-expense-${index}`,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString(),
    })),
    extractedBudgets: normalizedBudgets.map((budget, index) => ({
      _id: `extracted-budget-${index}`,
      category: budget.category,
      limit: budget.limit,
      period: budget.period,
      month: budget.month,
      year: budget.year,
    })),
  });
}
