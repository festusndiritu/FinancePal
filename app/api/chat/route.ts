import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { groq, groqModel } from "@/lib/groq";
import ChatMessage from "@/models/ChatMessage";
import Expense from "@/models/Expense";
import Budget from "@/models/Budget";
import { expenseCategories } from "@/types";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from "date-fns";

// ── Zod schemas ────────────────────────────────────────────────────────────────

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const payloadSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

// Schema for the full JSON response we require from the model
const modelResponseSchema = z.object({
  intent: z.enum(["log", "query"]),
  reply: z.string().min(1),
  expenses: z
    .array(
      z.object({
        amount: z.number().positive(),
        category: z.enum(expenseCategories),
        description: z.string().min(1).max(200),
        date: z.string().optional(),
      }),
    )
    .default([]),
  budgets: z
    .array(
      z.object({
        category: z.enum(expenseCategories),
        limit: z.number().positive(),
        period: z.enum(["monthly", "weekly"]).default("monthly"),
        month: z.number().int().min(1).max(12).optional(),
        year: z.number().int().min(2000).max(2100).optional(),
      }),
    )
    .default([]),
});

// ── Budget helpers (unchanged) ────────────────────────────────────────────────

function normalizeBudget(
  budget: z.infer<typeof modelResponseSchema>["budgets"][number],
) {
  const now = new Date();
  return {
    category: budget.category,
    limit:    budget.limit,
    period:   budget.period,
    month:    budget.month ?? now.getMonth() + 1,
    year:     budget.year  ?? now.getFullYear(),
  };
}

// ── GET ────────────────────────────────────────────────────────────────────────

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

  return NextResponse.json({
    data: messages.reverse().map((m) => ({
      _id:       m._id.toString(),
      role:      m.role,
      content:   m.content,
      createdAt: m.createdAt?.toISOString(),
    })),
  });
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json   = await request.json();
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await dbConnect();

  // ── Fetch context ────────────────────────────────────────────────────────
  const now        = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);
  const dayStart   = startOfDay(now);
  const dayEnd     = endOfDay(now);

  const [monthlyExpenses, budgets] = await Promise.all([
    Expense.find({
      userId: session.user.id,
      date: { $gte: monthStart, $lte: monthEnd },
    })
      .sort({ date: -1 })
      .lean(),
    Budget.find({
      userId: session.user.id,
      month: now.getMonth() + 1,
      year:  now.getFullYear(),
    }).lean(),
  ]);

  // Pre-compute totals — model must use these, never recalculate
  const totalMonth = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const totalToday = monthlyExpenses
    .filter((e) => e.date >= dayStart && e.date <= dayEnd)
    .reduce((s, e) => s + e.amount, 0);

  const byCategory = monthlyExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const todayByCategory = monthlyExpenses
    .filter((e) => e.date >= dayStart && e.date <= dayEnd)
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {});

  const categoryTotalsMonth = Object.entries(byCategory)
    .map(([cat, amt]) => `  ${cat}: KES ${amt.toLocaleString()}`)
    .join("\n") || "  (none)";

  const categoryTotalsToday = Object.entries(todayByCategory)
    .map(([cat, amt]) => `  ${cat}: KES ${amt.toLocaleString()}`)
    .join("\n") || "  (none)";

  const budgetLines =
    budgets.length > 0
      ? budgets
          .map((b) => {
            const spent = byCategory[b.category] ?? 0;
            const left  = b.limit - spent;
            return `  ${b.category}: KES ${spent.toLocaleString()} spent / KES ${b.limit.toLocaleString()} limit (KES ${left.toLocaleString()} left)`;
          })
          .join("\n")
      : "  (none)";

  const recentLines = monthlyExpenses
    .slice(0, 10)
    .map(
      (e) =>
        `  ${format(new Date(e.date), "MMM d")} | ${e.category} | KES ${e.amount} | ${e.description}`,
    )
    .join("\n") || "  (none)";

  // ── System prompt (JSON mode) ─────────────────────────────────────────────
  const systemPrompt = `You are FinancePal, a friendly personal finance assistant for a Kenyan user.
Currency is KES. Today is ${format(now, "EEEE, MMMM d, yyyy")}.
Allowed expense categories: ${expenseCategories.join(", ")}.

You MUST respond with a single JSON object — no prose outside it. Schema:
{
  "intent": "log" | "query",
  "reply": "your friendly natural-language response here",
  "expenses": [ { "amount": number, "category": string, "description": string, "date": "YYYY-MM-DD" } ],
  "budgets":  [ { "category": string, "limit": number, "period": "monthly"|"weekly" } ]
}

INTENT RULES — choose carefully:

"log" → user is telling you about something NEW they just spent or a budget they want to set/change.
  Examples: "spent 200 on fare", "just bought lunch for 450 at Java", "set food budget to 5000"
  → Populate the expenses or budgets array accordingly.
  → "reply" must confirm exactly what was logged.

"query" → user is asking a question about existing data.
  Examples: "how much on food?", "what's my budget?", "show expenses"
  → expenses and budgets arrays MUST be empty [].
  → "reply" must use ONLY the pre-computed figures below. Do NOT recalculate.

When in doubt, default to "query" with empty arrays.

IMPORTANT: The "reply" field is shown directly to the user. Write clean natural prose — no JSON, no arrays, no raw numbers except as part of a sentence.

═══════════════════════════════════════
FINANCIAL CONTEXT — USE THESE EXACT FIGURES, DO NOT RECALCULATE
═══════════════════════════════════════
This month (${format(now, "MMMM yyyy")}):
  Total: KES ${totalMonth.toLocaleString()}
  By category:
${categoryTotalsMonth}

Today (${format(now, "MMMM d")}):
  Total: KES ${totalToday.toLocaleString()}
  By category:
${categoryTotalsToday}

Budgets this month:
${budgetLines}

Recent expenses (last 10 — READ ONLY, do NOT put these in expenses array):
${recentLines}
`;

  // ── Call Groq with JSON mode ───────────────────────────────────────────────
  const completion = await groq.chat.completions.create({
    model:           groqModel,
    temperature:     0.2,
    max_tokens:      1024,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      ...parsed.data.messages,
    ],
  });

  const rawContent = completion.choices[0]?.message?.content?.trim() ?? "{}";

  // Parse and validate model response
  let modelResponse: z.infer<typeof modelResponseSchema>;
  try {
    const rawParsed = JSON.parse(rawContent) as unknown;
    const validated = modelResponseSchema.safeParse(rawParsed);
    if (validated.success) {
      modelResponse = validated.data;
    } else {
      // Fallback: pull reply text if present, empty arrays
      const fallback = rawParsed as Record<string, unknown>;
      modelResponse = {
        intent:   "query",
        reply:    typeof fallback.reply === "string" ? fallback.reply : "Sorry, I couldn't process that. Please try again.",
        expenses: [],
        budgets:  [],
      };
    }
  } catch {
    modelResponse = {
      intent:   "query",
      reply:    "Sorry, something went wrong. Please try again.",
      expenses: [],
      budgets:  [],
    };
  }

  // Double-safety: if intent is query, discard any arrays the model returned anyway
  const finalExpenses = modelResponse.intent === "log" ? modelResponse.expenses : [];
  const finalBudgets  = modelResponse.intent === "log" ? modelResponse.budgets  : [];
  const cleanReply    = modelResponse.reply;

  // Persist conversation
  const lastUserMessage = parsed.data.messages[parsed.data.messages.length - 1];
  if (lastUserMessage?.role === "user") {
    await ChatMessage.create({
      userId:  session.user.id,
      role:    "user",
      content: lastUserMessage.content,
    });
  }
  await ChatMessage.create({
    userId:  session.user.id,
    role:    "assistant",
    content: cleanReply,
  });

  const normalizedBudgets = finalBudgets.map(normalizeBudget);

  return NextResponse.json({
    reply: cleanReply,
    extractedExpenses: finalExpenses.map((e, i) => ({
      _id:         `extracted-expense-${i}`,
      amount:      e.amount,
      category:    e.category,
      description: e.description,
      date:        e.date ? new Date(e.date).toISOString() : new Date().toISOString(),
    })),
    extractedBudgets: normalizedBudgets.map((b, i) => ({
      _id:      `extracted-budget-${i}`,
      category: b.category,
      limit:    b.limit,
      period:   b.period,
      month:    b.month,
      year:     b.year,
    })),
  });
}