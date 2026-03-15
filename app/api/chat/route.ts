import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { groq, groqModel } from "@/lib/groq";
import ChatMessage from "@/models/ChatMessage";
import Expense from "@/models/Expense";
import Budget from "@/models/Budget";
import SavingsGoal from "@/models/SavingsGoal";
import { expenseCategories } from "@/types";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from "date-fns";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const messageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const payloadSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

const modelResponseSchema = z.object({
  intent: z.enum([
    "log_expense", "edit_expense",
    "log_budget",  "edit_budget",
    "log_savings", "edit_savings",
    "query",
  ]),
  reply: z.string().min(1),

  expense: z.object({
    amount:      z.number().positive(),
    category:    z.enum(expenseCategories),
    description: z.string().min(1).max(200),
    date:        z.string().optional(),
  }).nullable().default(null),

  expenseEdit: z.object({
    matchDescription: z.string(),
    amount:           z.number().positive().optional(),
    category:         z.enum(expenseCategories).optional(),
    description:      z.string().optional(),
  }).nullable().default(null),

  budget: z.object({
    category: z.enum(expenseCategories),
    limit:    z.number().positive(),
    period:   z.enum(["monthly", "weekly"]).default("monthly"),
    month:    z.number().int().min(1).max(12).optional(),
    year:     z.number().int().min(2000).max(2100).optional(),
  }).nullable().default(null),

  budgetEdit: z.object({
    category: z.enum(expenseCategories),
    limit:    z.number().positive(),
  }).nullable().default(null),

  savingsGoal: z.object({
    name:          z.string().min(1).max(100),
    targetAmount:  z.number().positive(),
    currentAmount: z.number().min(0).default(0),
    deadline:      z.string(),
  }).nullable().default(null),

  savingsEdit: z.object({
    matchName:      z.string(),
    // positive = deposit, negative = withdrawal
    // Use depositAmount for adding money, withdrawAmount for taking money out
    depositAmount:  z.number().positive().optional(),
    withdrawAmount: z.number().positive().optional(),
    targetAmount:   z.number().positive().optional(),
    deadline:       z.string().optional(),
  }).nullable().default(null),
});

type ModelResponse = z.infer<typeof modelResponseSchema>;

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const messages = await ChatMessage.find({ userId: session.user.id })
    .sort({ createdAt: -1 }).limit(50).lean();

  return NextResponse.json({
    data: messages.reverse().map((m) => ({
      _id:       m._id.toString(),
      role:      m.role,
      content:   m.content,
      createdAt: m.createdAt?.toISOString(),
    })),
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json   = await request.json();
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await dbConnect();

  const now        = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);
  const dayStart   = startOfDay(now);
  const dayEnd     = endOfDay(now);

  const [monthlyExpenses, budgets, savingsGoals] = await Promise.all([
    Expense.find({ userId: session.user.id, date: { $gte: monthStart, $lte: monthEnd } })
      .sort({ date: -1 }).lean(),
    Budget.find({ userId: session.user.id, month: now.getMonth() + 1, year: now.getFullYear() }).lean(),
    SavingsGoal.find({ userId: session.user.id }).sort({ deadline: 1 }).lean(),
  ]);

  const totalMonth = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const totalToday = monthlyExpenses
    .filter((e) => e.date >= dayStart && e.date <= dayEnd)
    .reduce((s, e) => s + e.amount, 0);

  const byCategory = monthlyExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const categoryLines = Object.entries(byCategory)
    .map(([cat, amt]) => `  ${cat}: KES ${amt.toLocaleString()}`)
    .join("\n") || "  (none)";

  const budgetLines = budgets.length > 0
    ? budgets.map((b) => {
        const spent = byCategory[b.category] ?? 0;
        const left  = b.limit - spent;
        return `  [${b._id}] ${b.category}: KES ${spent.toLocaleString()} spent / KES ${b.limit.toLocaleString()} limit — KES ${left.toLocaleString()} left`;
      }).join("\n")
    : "  (none)";

  const savingsLines = savingsGoals.length > 0
    ? savingsGoals.map((g) => {
        const pct = g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(0) : "0";
        return `  [${g._id}] ${g.name}: KES ${g.currentAmount.toLocaleString()} / KES ${g.targetAmount.toLocaleString()} (${pct}%) — deadline: ${format(new Date(g.deadline), "MMM d, yyyy")}`;
      }).join("\n")
    : "  (none)";

  const recentExpenseLines = monthlyExpenses.slice(0, 12)
    .map((e) => `  [${e._id}] ${format(new Date(e.date), "MMM d")} | ${e.category} | KES ${e.amount} | ${e.description}`)
    .join("\n") || "  (none)";

  const systemPrompt = `You are FinancePal, a friendly personal finance assistant for a Kenyan user.
Currency: KES. Today: ${format(now, "EEEE, MMMM d, yyyy")}.
Categories: ${expenseCategories.join(", ")}.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "intent": one of: log_expense | edit_expense | log_budget | edit_budget | log_savings | edit_savings | query,
  "reply": "1-2 sentence natural language confirmation or answer",
  "expense": { amount, category, description, date } or null,
  "expenseEdit": { matchDescription, amount?, category?, description? } or null,
  "budget": { category, limit, period, month?, year? } or null,
  "budgetEdit": { category, limit } or null,
  "savingsGoal": { name, targetAmount, currentAmount, deadline } or null,
  "savingsEdit": { matchName, depositAmount?, withdrawAmount?, targetAmount?, deadline? } or null
}

INTENT GUIDE — pick the single best intent, fill the matching field, all others null:

log_expense   → new expense → fill "expense"
edit_expense  → change an existing expense → fill "expenseEdit"
log_budget    → create a budget → fill "budget"
edit_budget   → change a budget limit → fill "budgetEdit"
log_savings   → create a savings goal → fill "savingsGoal"
edit_savings  → deposit TO or withdraw FROM a goal, or update goal details → fill "savingsEdit"
query         → question about data → all action fields null

SAVINGS EDIT RULES (very important):
- "deposit / add / save / put in" → use depositAmount (positive)
- "withdraw / take out / take from / reduce by / use from / pull from" → use withdrawAmount (positive number representing the amount taken out)
- Never use negative numbers. depositAmount and withdrawAmount are always positive.
- matchName: keyword from the goal name (e.g. "emergency" for "emergency fund")

COMBINED ACTIONS: If the user says "take 300 from emergency fund for supper", that is TWO actions:
  1. edit_savings with withdrawAmount: 300 from emergency fund
  2. log_expense with amount: 300, description: "supper", category: "food"
  In this case, pick the PRIMARY intent as "edit_savings" and also fill in "expense" (the secondary action).
  Both fields can be non-null simultaneously only in this combined scenario.

RULES:
- reply MUST be complete (1-2 sentences). Never truncate.
- Never put JSON or "breakdown:" in reply.
- For edit_budget: only fill "budgetEdit", system handles finding the existing budget.
- Default to query if unsure.

══════════════════════════════
CONTEXT (read-only)
══════════════════════════════
This month (${format(now, "MMMM yyyy")}): KES ${totalMonth.toLocaleString()} total
Today: KES ${totalToday.toLocaleString()}
By category:
${categoryLines}

Budgets:
${budgetLines}

Savings goals:
${savingsLines}

Recent expenses (READ ONLY — never re-log):
${recentExpenseLines}
`;

  const completion = await groq.chat.completions.create({
    model:           groqModel,
    temperature:     0.1,
    max_tokens:      2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      ...parsed.data.messages,
    ],
  });

  const rawContent = completion.choices[0]?.message?.content?.trim() ?? "{}";

  let mr: ModelResponse;
  try {
    const v = modelResponseSchema.safeParse(JSON.parse(rawContent));
    if (v.success) {
      mr = v.data;
    } else {
      console.error("Model response validation failed:", v.error.flatten());
      mr = {
        intent: "query", reply: "Sorry, I had trouble with that. Please try again.",
        expense: null, expenseEdit: null, budget: null, budgetEdit: null,
        savingsGoal: null, savingsEdit: null,
      };
    }
  } catch {
    mr = {
      intent: "query", reply: "Sorry, something went wrong.",
      expense: null, expenseEdit: null, budget: null, budgetEdit: null,
      savingsGoal: null, savingsEdit: null,
    };
  }

  // ── Build extracted payloads ──────────────────────────────────────────────

  // Expense — can come from log_expense OR as secondary in a combined savings withdrawal
  let extractedExpense: object | null = null;
  if (mr.expense && (mr.intent === "log_expense" || mr.intent === "edit_savings")) {
    extractedExpense = {
      amount:      mr.expense.amount,
      category:    mr.expense.category,
      description: mr.expense.description,
      date:        mr.expense.date ? new Date(mr.expense.date).toISOString() : new Date().toISOString(),
    };
  }

  // Expense edit
  let extractedEdit: object | null = null;
  if (mr.intent === "edit_expense" && mr.expenseEdit) {
    const keyword = mr.expenseEdit.matchDescription.toLowerCase();
    const match   = monthlyExpenses.find((e) => e.description.toLowerCase().includes(keyword));
    if (match) {
      extractedEdit = {
        expenseId:   match._id.toString(),
        amount:      mr.expenseEdit.amount,
        category:    mr.expenseEdit.category,
        description: mr.expenseEdit.description,
      };
    }
  }

  // Budget (create or edit)
  let extractedBudget: object | null = null;
  if (mr.intent === "log_budget" || mr.intent === "edit_budget") {
    const category = mr.budget?.category ?? mr.budgetEdit?.category;
    const limit    = mr.budget?.limit    ?? mr.budgetEdit?.limit;
    if (category && limit) {
      extractedBudget = {
        category,
        limit,
        period: mr.budget?.period ?? "monthly",
        month:  mr.budget?.month  ?? now.getMonth() + 1,
        year:   mr.budget?.year   ?? now.getFullYear(),
      };
    }
  }

  // Savings
  let extractedSavings: object | null = null;
  if (mr.intent === "log_savings" && mr.savingsGoal) {
    extractedSavings = {
      action:        "create",
      name:          mr.savingsGoal.name,
      targetAmount:  mr.savingsGoal.targetAmount,
      currentAmount: mr.savingsGoal.currentAmount,
      deadline:      new Date(mr.savingsGoal.deadline).toISOString(),
      color:         "#0369a1",
    };
  }

  if (mr.intent === "edit_savings" && mr.savingsEdit) {
    const keyword = mr.savingsEdit.matchName.toLowerCase();
    const match   = savingsGoals.find((g) => g.name.toLowerCase().includes(keyword));
    if (match) {
      // Compute new currentAmount based on deposit or withdrawal
      let newCurrentAmount: number | undefined;
      if (mr.savingsEdit.depositAmount !== undefined) {
        newCurrentAmount = match.currentAmount + mr.savingsEdit.depositAmount;
      } else if (mr.savingsEdit.withdrawAmount !== undefined) {
        // Clamp at 0 — can't withdraw more than what's saved
        newCurrentAmount = Math.max(0, match.currentAmount - mr.savingsEdit.withdrawAmount);
      }

      extractedSavings = {
        action:        "update",
        goalId:        match._id.toString(),
        currentAmount: newCurrentAmount,
        targetAmount:  mr.savingsEdit.targetAmount,
        deadline:      mr.savingsEdit.deadline
          ? new Date(mr.savingsEdit.deadline).toISOString()
          : undefined,
      };
    }
  }

  // Persist conversation
  const lastUser = parsed.data.messages[parsed.data.messages.length - 1];
  if (lastUser?.role === "user") {
    await ChatMessage.create({ userId: session.user.id, role: "user", content: lastUser.content });
  }
  await ChatMessage.create({ userId: session.user.id, role: "assistant", content: mr.reply });

  return NextResponse.json({
    reply: mr.reply,
    extractedExpense,
    extractedEdit,
    extractedBudget,
    extractedSavings,
  });
}