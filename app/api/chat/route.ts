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
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format, addMonths } from "date-fns";

// ── helpers ───────────────────────────────────────────────────────────────────

// Normalise period: extract "monthly" or "weekly" from whatever the model sends
function normalisePeriod(raw: unknown): "monthly" | "weekly" {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("week")) return "weekly";
  return "monthly"; // default
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const messageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const payloadSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

// Use z.coerce where the model might send strings instead of numbers
const modelResponseSchema = z.object({
  intent: z.enum([
    "log_expense", "edit_expense",
    "log_budget",  "edit_budget",
    "log_savings", "edit_savings",
    "query",
  ]),
  reply: z.string().min(1),

  expense: z.object({
    amount:      z.coerce.number().positive(),
    category:    z.enum(expenseCategories),
    description: z.string().min(1).max(200),
    date:        z.string().optional(),
  }).nullable().default(null),

  expenseEdit: z.object({
    matchDescription: z.string(),
    amount:           z.coerce.number().positive().optional(),
    category:         z.enum(expenseCategories).optional(),
    description:      z.string().optional(),
  }).nullable().default(null),

  budget: z.object({
    category: z.enum(expenseCategories),
    // coerce covers "3000" → 3000
    limit:    z.coerce.number().positive(),
    // accept any string, normalise below
    period:   z.string().default("monthly"),
    month:    z.coerce.number().int().min(1).max(12).optional(),
    year:     z.coerce.number().int().min(2000).max(2100).optional(),
  }).nullable().default(null),

  budgetEdit: z.object({
    category: z.enum(expenseCategories),
    limit:    z.coerce.number().positive(),
  }).nullable().default(null),

  savingsGoal: z.object({
    name:          z.string().min(1).max(100),
    targetAmount:  z.coerce.number().positive(),
    currentAmount: z.coerce.number().min(0).default(0),
    // null/missing deadline → default to 6 months from now server-side
    deadline:      z.string().nullable().optional(),
  }).nullable().default(null),

  savingsEdit: z.object({
    matchName:      z.string(),
    depositAmount:  z.coerce.number().optional(),
    withdrawAmount: z.coerce.number().optional(),
    targetAmount:   z.coerce.number().positive().optional(),
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
        return `  ${b.category}: KES ${spent.toLocaleString()} / KES ${b.limit.toLocaleString()} limit — KES ${(b.limit - spent).toLocaleString()} left`;
      }).join("\n")
    : "  (none)";

  const savingsLines = savingsGoals.length > 0
    ? savingsGoals.map((g) => {
        const pct = g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(0) : "0";
        return `  [${g._id}] ${g.name}: KES ${g.currentAmount.toLocaleString()} / KES ${g.targetAmount.toLocaleString()} (${pct}%) — deadline: ${format(new Date(g.deadline), "MMM d, yyyy")}`;
      }).join("\n")
    : "  (none)";

  const recentLines = monthlyExpenses.slice(0, 12)
    .map((e) => `  [${e._id}] ${format(new Date(e.date), "MMM d")} | ${e.category} | KES ${e.amount} | ${e.description}`)
    .join("\n") || "  (none)";

  const systemPrompt = `You are FinancePal, a friendly personal finance assistant for a Kenyan user.
Currency: KES. Today: ${format(now, "EEEE, MMMM d, yyyy")}.
Categories: ${expenseCategories.join(", ")}.

Respond ONLY with a valid JSON object:
{
  "intent": "log_expense"|"edit_expense"|"log_budget"|"edit_budget"|"log_savings"|"edit_savings"|"query",
  "reply": "1-2 complete sentences",
  "expense":     { "amount": number, "category": string, "description": string, "date"?: "YYYY-MM-DD" } | null,
  "expenseEdit": { "matchDescription": string, "amount"?: number, "category"?: string, "description"?: string } | null,
  "budget":      { "category": string, "limit": number, "period": "monthly"|"weekly" } | null,
  "budgetEdit":  { "category": string, "limit": number } | null,
  "savingsGoal": { "name": string, "targetAmount": number, "currentAmount": number, "deadline": "YYYY-MM-DD" } | null,
  "savingsEdit": { "matchName": string, "depositAmount"?: number, "withdrawAmount"?: number, "targetAmount"?: number } | null
}

INTENT GUIDE — one intent, fill only the matching field, all others must be null:

log_expense   → new expense → fill "expense"
edit_expense  → change existing expense → fill "expenseEdit" (matchDescription: keyword from description)
log_budget    → set/create a budget → fill "budget" with limit as a NUMBER (e.g. 3000 not "3000")
edit_budget   → change a budget limit → fill "budgetEdit"
log_savings   → create a savings goal → fill "savingsGoal" (deadline MUST be "YYYY-MM-DD" string, never null)
edit_savings  → deposit/withdraw from a goal → fill "savingsEdit"
query         → question about data → ALL fields null, answer from context only

SAVINGS AMOUNTS (always positive numbers):
- Adding money → depositAmount
- Taking money out → withdrawAmount
- "reduce by", "take out", "withdraw", "pull from" all mean withdrawAmount

COMBINED: If user withdraws from savings AND makes a purchase in the same message,
set intent to "edit_savings", fill "savingsEdit" AND also fill "expense".

IMPORTANT:
- limit in budget MUST be a number, never a string
- period MUST be exactly "monthly" or "weekly", nothing else
- deadline in savingsGoal MUST be a YYYY-MM-DD string, never null or omitted
- reply must be complete — never truncate
- never put JSON or arrays in reply

══════════════════════════════
CONTEXT (read-only)
══════════════════════════════
Month: ${format(now, "MMMM yyyy")} | Total: KES ${totalMonth.toLocaleString()} | Today: KES ${totalToday.toLocaleString()}

By category:
${categoryLines}

Budgets:
${budgetLines}

Savings:
${savingsLines}

Recent expenses (READ ONLY — never re-log):
${recentLines}
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

  // ── Build payloads ────────────────────────────────────────────────────────

  let extractedExpense: object | null = null;
  if (mr.expense && (mr.intent === "log_expense" || mr.intent === "edit_savings")) {
    extractedExpense = {
      amount:      mr.expense.amount,
      category:    mr.expense.category,
      description: mr.expense.description,
      date:        mr.expense.date ? new Date(mr.expense.date).toISOString() : new Date().toISOString(),
    };
  }

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

  let extractedBudget: object | null = null;
  if (mr.intent === "log_budget" || mr.intent === "edit_budget") {
    const category = mr.budget?.category ?? mr.budgetEdit?.category;
    const limit    = mr.budget?.limit    ?? mr.budgetEdit?.limit;
    if (category && limit) {
      extractedBudget = {
        category,
        limit,
        // Normalise period — handles "monthly budget", "weekly", etc.
        period: normalisePeriod(mr.budget?.period ?? "monthly"),
        month:  mr.budget?.month  ?? now.getMonth() + 1,
        year:   mr.budget?.year   ?? now.getFullYear(),
      };
    }
  }

  let extractedSavings: object | null = null;
  if (mr.intent === "log_savings" && mr.savingsGoal) {
    // Default deadline to 6 months from now if model sent null/empty
    const deadlineStr = mr.savingsGoal.deadline;
    const deadline    = deadlineStr
      ? new Date(deadlineStr)
      : addMonths(now, 6);

    extractedSavings = {
      action:        "create",
      name:          mr.savingsGoal.name,
      targetAmount:  mr.savingsGoal.targetAmount,
      currentAmount: mr.savingsGoal.currentAmount,
      deadline:      deadline.toISOString(),
      color:         "#0369a1",
    };
  }

  if (mr.intent === "edit_savings" && mr.savingsEdit) {
    const keyword = mr.savingsEdit.matchName.toLowerCase();
    const match   = savingsGoals.find((g) => g.name.toLowerCase().includes(keyword));
    if (match) {
      let newCurrentAmount: number | undefined;
      if (mr.savingsEdit.depositAmount !== undefined) {
        newCurrentAmount = match.currentAmount + Math.abs(mr.savingsEdit.depositAmount);
      } else if (mr.savingsEdit.withdrawAmount !== undefined) {
        newCurrentAmount = Math.max(0, match.currentAmount - Math.abs(mr.savingsEdit.withdrawAmount));
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