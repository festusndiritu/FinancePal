"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, TrendingUp, PiggyBank, HelpCircle, BarChart2 } from "lucide-react";
import { mutate } from "swr";
import { cn } from "@/lib/utils";
import type { ChatMessageItem, ExpenseItem, BudgetItem } from "@/types";

// ── types ─────────────────────────────────────────────────────────────────────

type ChatResponse = {
  reply: string;
  extractedExpenses: ExpenseItem[];
  extractedBudgets?: Array<{
    _id: string;
    category: string;
    limit: number;
    period: "monthly" | "weekly";
    month: number;
    year: number;
  }>;
};

// ── helpers ───────────────────────────────────────────────────────────────────

async function persistExtractedExpenses(expenses: ExpenseItem[]): Promise<number> {
  const results = await Promise.all(
    expenses.map((e) =>
      fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: e.amount,
          category: e.category,
          description: e.description,
          date: e.date,
          source: "chatbot",
        }),
      }),
    ),
  );
  return results.filter((r) => r.ok).length;
}

async function persistExtractedBudgets(
  budgets: NonNullable<ChatResponse["extractedBudgets"]>,
): Promise<number> {
  const budgetsRes = await fetch("/api/budgets", { cache: "no-store" });
  if (!budgetsRes.ok) return 0;

  const existing = (await budgetsRes.json()) as { data: BudgetItem[] };

  const results = await Promise.all(
    budgets.map((budget) => {
      const match = existing.data.find(
        (b) =>
          b.category === budget.category &&
          b.period === budget.period &&
          b.month === budget.month &&
          b.year === budget.year,
      );

      return match
        ? fetch("/api/budgets", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: match._id, ...budget }),
          })
        : fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(budget),
          });
    }),
  );
  return results.filter((r) => r.ok).length;
}

// ── welcome screen suggestion buttons ────────────────────────────────────────

const SUGGESTIONS = [
  { icon: <TrendingUp className="h-3.5 w-3.5" />, label: "Spent 500 on transport" },
  { icon: <PiggyBank className="h-3.5 w-3.5" />,  label: "Log 1200 for groceries" },
  { icon: <HelpCircle className="h-3.5 w-3.5" />, label: "How much did I spend this month?" },
  { icon: <BarChart2 className="h-3.5 w-3.5" />,  label: "What's my biggest expense category?" },
];

// ── component ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages]           = useState<ChatMessageItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoading, setIsLoading]         = useState(false);
  const [statusText, setStatusText]       = useState<string | null>(null);
  const [input, setInput]                 = useState("");

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history on mount
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/chat", { cache: "no-store" });
      if (res.ok) {
        const payload = (await res.json()) as { data: ChatMessageItem[] };
        setMessages(payload.data);
      }
      setIsLoadingHistory(false);
    };
    void load();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-grow textarea up to ~5 lines
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    if (content.length > 4000) {
      setStatusText("Message is too long. Keep it under 4000 characters.");
      return;
    }

    const nextMessages: ChatMessageItem[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setStatusText(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    const requestMessages = nextMessages
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: requestMessages }),
    });

    setIsLoading(false);

    if (!response.ok) {
      setStatusText("Unable to get a reply right now. Please try again.");
      return;
    }

    const payload = (await response.json()) as ChatResponse;
    setMessages((cur) => [...cur, { role: "assistant", content: payload.reply }]);

    const savedExpenses =
      (payload.extractedExpenses?.length ?? 0) > 0
        ? await persistExtractedExpenses(payload.extractedExpenses)
        : 0;

    const savedBudgets =
      (payload.extractedBudgets?.length ?? 0) > 0
        ? await persistExtractedBudgets(payload.extractedBudgets ?? [])
        : 0;

    if (savedExpenses > 0) {
      setStatusText(`✓ Saved ${savedExpenses} expense${savedExpenses > 1 ? "s" : ""} from chat.`);
      window.dispatchEvent(new Event("financepal:expenses-updated"));
    }
    if (savedBudgets > 0) {
      setStatusText((cur) => {
        const msg = `✓ Saved ${savedBudgets} budget${savedBudgets > 1 ? "s" : ""} from chat.`;
        return cur ? `${cur} ${msg}` : msg;
      });
      window.dispatchEvent(new Event("financepal:budgets-updated"));
    }

    if (savedExpenses > 0 || savedBudgets > 0) {
      await Promise.all([
        mutate((key) => typeof key === "string" && key.startsWith("/api/expenses")),
        mutate((key) => typeof key === "string" && key.startsWith("/api/budgets")),
        mutate((key) => typeof key === "string" && key.startsWith("/api/reports")),
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isEmpty = messages.length === 0 && !isLoadingHistory;
  const isError = statusText?.startsWith("Unable") || statusText?.startsWith("Message");

  return (
    // Full height minus the 64px header. The flex column keeps the input bar
    // pinned at the bottom without any fixed positioning tricks.
    <div className="flex h-[calc(100dvh-64px)] flex-col">

      {/* ── Message area (scrollable) ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading dots while fetching history */}
        {isLoadingHistory && (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Welcome / empty state */}
        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 pb-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-900 shadow-xl shadow-sky-900/30">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">FinancePal AI</h2>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">
                Log expenses naturally, ask about your spending, or get budget insights — just type like you&apos;re texting.
              </p>
            </div>
            {/* Full-width stacked buttons — no horizontal scroll on mobile */}
            <div className="flex w-full max-w-sm flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => void handleSend(s.label)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 hover:shadow-md"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    {s.icon}
                  </span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message thread */}
        {!isLoadingHistory && messages.length > 0 && (
          <div className="space-y-4 px-4 py-6 md:px-8">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-end gap-2",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-900 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex max-w-[78%] flex-col gap-1 md:max-w-[60%]",
                      isUser && "items-end",
                    )}
                  >
                    <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {isUser ? "You" : "FinancePal"}
                    </p>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                        isUser
                          ? "rounded-br-sm bg-sky-900 text-white"
                          : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-100",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-900 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* Saved / error status pill */}
            {statusText && (
              <div className="flex justify-center">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm",
                    isError
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isError ? "bg-red-500" : "bg-emerald-500",
                    )}
                  />
                  {statusText}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar (sticks to bottom of flex column) ────────────────── */}
      {/*
        No fixed/sticky positioning needed — the parent is a flex column and
        this div is NOT inside the scrollable area, so it naturally sits at
        the bottom of the viewport.

        pb-20 on mobile gives 80px of breathing room above the bottom nav (h-16
        nav + 4px gap). md:pb-0 removes it on desktop where there's no nav.
      */}
      <div className="border-t border-slate-100 bg-white px-4 py-3 pb-20 md:px-8 md:py-4 md:pb-4">

        {/* Quick-suggest chips — flex-wrap so they stack on mobile */}
        {!isEmpty && (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {[
              "Spent 200 on matatu",
              "Log 800 for lunch",
              "What did I spend today?",
              "Show my budget",
            ].map((s) => (
              <button
                key={s}
                onClick={() => void handleSend(s)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-sm transition-colors focus-within:border-sky-300 focus-within:bg-white">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Try: &quot;Spent 500 on matatu&quot; or &quot;What&apos;s my budget?&quot;"
            rows={1}
            disabled={isLoading || isLoadingHistory}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none"
            style={{ minHeight: "24px" }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isLoading}
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-900 text-white transition-all hover:bg-sky-800 disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-slate-400">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}