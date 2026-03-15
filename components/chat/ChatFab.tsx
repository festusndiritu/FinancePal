"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { mutate } from "swr";
import type { ChatMessageItem, ExpenseItem } from "@/types";

type ChatResponse = {
  reply: string;
  extractedExpenses: ExpenseItem[];
};

async function persistExpenses(expenses: ExpenseItem[]): Promise<number> {
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

export default function ChatFab() {
  const pathname = usePathname();

  // ── All hooks must run unconditionally — never put a return before these ──
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<ChatMessageItem[]>([]);
  const [input, setInput]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Close panel when navigating to /chat
  useEffect(() => {
    if (pathname === "/chat") setOpen(false);
  }, [pathname]);

  // ── Early return AFTER all hooks ──────────────────────────────────────────
  // Don't render on the chat page — user is already there
  if (pathname === "/chat") return null;

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    const nextMessages: ChatMessageItem[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setSavedCount(null);

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
      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
      return;
    }

    const payload = (await response.json()) as ChatResponse;
    setMessages((cur) => [...cur, { role: "assistant", content: payload.reply }]);

    if (payload.extractedExpenses?.length > 0) {
      const saved = await persistExpenses(payload.extractedExpenses);
      if (saved > 0) {
        setSavedCount(saved);
        window.dispatchEvent(new Event("financepal:expenses-updated"));
        await Promise.all([
          mutate((key) => typeof key === "string" && key.startsWith("/api/expenses")),
          mutate((key) => typeof key === "string" && key.startsWith("/api/reports")),
          mutate((key) => typeof key === "string" && key.startsWith("/api/budgets")),
        ]);
      }
    }
  };

  return (
    <>
      {/* FAB button — desktop only */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:block">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Open AI chat"}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-900 text-white shadow-xl shadow-sky-900/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-800 hover:shadow-2xl"
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>

      {/* Floating panel — desktop only */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-40 hidden w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 transition-all duration-300 md:flex",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
        style={{ height: "500px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-sky-900 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">FinancePal AI</p>
              <p className="text-[10px] text-sky-200">Log expenses in plain language</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 pb-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
                <MessageCircle className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Ask FinancePal</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Try: &quot;Spent 500 on lunch&quot; or &quot;How much did I spend this week?&quot;
                </p>
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {["Spent 200 on transport", "What's my budget?", "Log 1500 for rent"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                  msg.role === "user"
                    ? "rounded-br-sm bg-sky-900 text-white"
                    : "rounded-bl-sm bg-slate-100 text-slate-800",
                )}
              >
                {msg.role === "assistant" && (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    FinancePal
                  </p>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {savedCount !== null && savedCount > 0 && (
            <p className="text-center text-xs font-semibold text-emerald-600">
              ✓ {savedCount} expense{savedCount > 1 ? "s" : ""} saved automatically
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-sky-300 focus-within:bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder='Try: "Spent 500 on matatu"'
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
              disabled={isLoading}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-900 text-white transition-all hover:bg-sky-800 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}