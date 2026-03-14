"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import ChatInput from "@/components/chat/ChatInput";
import ChatWindow from "@/components/chat/ChatWindow";
import ErrorState from "@/components/shared/ErrorState";
import type { BudgetItem, ChatMessageItem, ExpenseItem } from "@/types";

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

async function persistExtractedExpenses(extractedExpenses: ExpenseItem[]) {
  const results = await Promise.all(
    extractedExpenses.map((expense) =>
      fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          source: "chatbot",
        }),
      }),
    ),
  );

  return results.filter((response) => response.ok).length;
}

async function persistExtractedBudgets(
  extractedBudgets: NonNullable<ChatResponse["extractedBudgets"]>,
) {
  const budgetsResponse = await fetch("/api/budgets", { cache: "no-store" });

  if (!budgetsResponse.ok) {
    return 0;
  }

  const budgetsPayload = (await budgetsResponse.json()) as { data: BudgetItem[] };

  const results = await Promise.all(
    extractedBudgets.map((budget) => {
      const existingBudget = budgetsPayload.data.find(
        (item) =>
          item.category === budget.category &&
          item.period === budget.period &&
          item.month === budget.month &&
          item.year === budget.year,
      );

      if (existingBudget) {
        return fetch("/api/budgets", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: existingBudget._id,
            category: budget.category,
            limit: budget.limit,
            period: budget.period,
            month: budget.month,
            year: budget.year,
          }),
        });
      }

      return fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: budget.category,
          limit: budget.limit,
          period: budget.period,
          month: budget.month,
          year: budget.year,
        }),
      });
    }),
  );

  return results.filter((response) => response.ok).length;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      const response = await fetch("/api/chat", { cache: "no-store" });

      if (!response.ok) {
        setStatusText("Unable to load previous chat history.");
        setIsLoadingHistory(false);
        return;
      }

      const payload = (await response.json()) as { data: ChatMessageItem[] };
      setMessages(payload.data);
      setIsLoadingHistory(false);
    };

    void loadHistory();
  }, []);

  const handleSend = async (content: string) => {
    setStatusText(null);

    if (content.length > 4000) {
      setStatusText("Message is too long. Please keep it under 4000 characters.");
      return;
    }

    const nextMessages: ChatMessageItem[] = [
      ...messages,
      { role: "user", content },
    ];

    const requestMessages = nextMessages
      .slice(-20)
      .map((message) => ({ role: message.role, content: message.content }));

    setMessages(nextMessages);
    setIsLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: requestMessages }),
    });

    setIsLoading(false);

    if (!response.ok) {
      setStatusText("Unable to get a reply right now. Please try again.");
      return;
    }

    const payload = (await response.json()) as ChatResponse;

    setMessages((current) => [
      ...current,
      { role: "assistant", content: payload.reply },
    ]);

    const savedExpenses =
      payload.extractedExpenses.length > 0
        ? await persistExtractedExpenses(payload.extractedExpenses)
        : 0;

    const savedBudgets =
      (payload.extractedBudgets?.length ?? 0) > 0
        ? await persistExtractedBudgets(payload.extractedBudgets ?? [])
        : 0;

    if (savedExpenses > 0) {
      setStatusText(
        `Saved ${savedExpenses} expense${
          savedExpenses > 1 ? "s" : ""
        } from chat.`,
      );
      window.dispatchEvent(new Event("financepal:expenses-updated"));
    }

    if (savedBudgets > 0) {
      setStatusText((current) => {
        const budgetMessage = `Saved ${savedBudgets} budget${savedBudgets > 1 ? "s" : ""} from chat.`;
        return current ? `${current} ${budgetMessage}` : budgetMessage;
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

  return (
    <main className="flex h-full min-h-0 flex-col gap-4">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finance Chatbot</h1>
        <p className="text-sm text-muted-foreground">
          Ask questions, log expenses naturally, and get spending insights.
        </p>
      </section>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatWindow messages={messages} loading={isLoading || isLoadingHistory} />

        <div className="sticky bottom-0 mt-4 rounded-xl border border-slate-200 bg-slate-50/95 px-4 py-4">
          {statusText?.startsWith("Unable") ? (
            <ErrorState message={statusText} />
          ) : statusText ? (
            <p className="text-sm text-emerald-700">{statusText}</p>
          ) : null}

          <ChatInput disabled={isLoading} onSend={handleSend} />
        </div>
      </div>
    </main>
  );
}
