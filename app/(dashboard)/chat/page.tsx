"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, TrendingUp, PiggyBank, HelpCircle, BarChart2 } from "lucide-react";
import { mutate } from "swr";
import { cn } from "@/lib/utils";
import type { ChatMessageItem } from "@/types";

// ── types ─────────────────────────────────────────────────────────────────────

type ExtractedExpense = { amount: number; category: string; description: string; date: string };
type ExtractedEdit    = { expenseId: string; amount?: number; category?: string; description?: string };
type ExtractedBudget  = { category: string; limit: number; period: string; month: number; year: number };
type ExtractedSavings =
  | { action: "create"; name: string; targetAmount: number; currentAmount: number; deadline: string; color: string }
  | { action: "update"; goalId: string; depositAmount?: number; targetAmount?: number; deadline?: string; currentAmount?: number };

type ChatResponse = {
  reply:            string;
  extractedExpense: ExtractedExpense | null;
  extractedEdit:    ExtractedEdit    | null;
  extractedBudget:  ExtractedBudget  | null;
  extractedSavings: ExtractedSavings | null;
};

// ── persistence ───────────────────────────────────────────────────────────────

async function persistExpense(e: ExtractedExpense) {
  return (await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...e, source: "chatbot" }) })).ok;
}
async function persistEdit(e: ExtractedEdit) {
  const body: Record<string, unknown> = {};
  if (e.amount      !== undefined) body.amount      = e.amount;
  if (e.category    !== undefined) body.category    = e.category;
  if (e.description !== undefined) body.description = e.description;
  return (await fetch(`/api/expenses/${e.expenseId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).ok;
}
async function persistBudget(b: ExtractedBudget) {
  return (await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })).ok;
}
async function persistSavings(s: ExtractedSavings) {
  if (s.action === "create") {
    return (await fetch("/api/savings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: s.name, targetAmount: s.targetAmount, currentAmount: s.currentAmount, deadline: s.deadline, color: s.color }) })).ok;
  } else {
    const body: Record<string, unknown> = { id: s.goalId };
    if (s.currentAmount !== undefined) body.currentAmount = s.currentAmount;
    if (s.targetAmount  !== undefined) body.targetAmount  = s.targetAmount;
    if (s.deadline      !== undefined) body.deadline      = s.deadline;
    return (await fetch("/api/savings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).ok;
  }
}

// ── suggestions ───────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: <TrendingUp className="h-3.5 w-3.5" />, label: "Spent 500 on transport" },
  { icon: <PiggyBank  className="h-3.5 w-3.5" />, label: "Set food budget to 8000" },
  { icon: <HelpCircle className="h-3.5 w-3.5" />, label: "How much did I spend this month?" },
  { icon: <BarChart2  className="h-3.5 w-3.5" />, label: "Create savings goal: emergency fund 50k" },
];

// ── component ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages]             = useState<ChatMessageItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoading, setIsLoading]           = useState(false);
  const [statusText, setStatusText]         = useState<string | null>(null);
  const [input, setInput]                   = useState("");

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/chat", { cache: "no-store" });
      if (res.ok) setMessages(((await res.json()) as { data: ChatMessageItem[] }).data);
      setIsLoadingHistory(false);
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;
    if (content.length > 4000) { setStatusText("Message too long."); return; }

    const nextMessages: ChatMessageItem[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setStatusText(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages.slice(-20).map((m) => ({ role: m.role, content: m.content })) }),
    });

    setIsLoading(false);
    if (!response.ok) { setStatusText("Unable to get a reply right now. Please try again."); return; }

    const payload = (await response.json()) as ChatResponse;
    setMessages((cur) => [...cur, { role: "assistant", content: payload.reply }]);

    const [okExpense, okEdit, okBudget, okSavings] = await Promise.all([
      payload.extractedExpense ? persistExpense(payload.extractedExpense) : Promise.resolve(false),
      payload.extractedEdit    ? persistEdit(payload.extractedEdit)       : Promise.resolve(false),
      payload.extractedBudget  ? persistBudget(payload.extractedBudget)   : Promise.resolve(false),
      payload.extractedSavings ? persistSavings(payload.extractedSavings) : Promise.resolve(false),
    ]);

    const parts: string[] = [];
    if (okExpense) parts.push("✓ Expense saved");
    if (okEdit)    parts.push("✓ Expense updated");
    if (okBudget)  parts.push("✓ Budget saved");
    if (okSavings) parts.push(payload.extractedSavings!.action === "create" ? "✓ Goal created" : "✓ Goal updated");
    if (parts.length) setStatusText(parts.join(" · "));

    if (okExpense || okEdit) window.dispatchEvent(new Event("financepal:expenses-updated"));
    if (okBudget)            window.dispatchEvent(new Event("financepal:budgets-updated"));

    const prefixes = new Set<string>();
    if (okExpense || okEdit) { prefixes.add("/api/expenses"); prefixes.add("/api/reports"); }
    if (okBudget)              prefixes.add("/api/budgets");
    if (okSavings)             prefixes.add("/api/savings");
    await Promise.all([...prefixes].map((p) => mutate((k) => typeof k === "string" && k.startsWith(p))));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  };

  const isEmpty = messages.length === 0 && !isLoadingHistory;
  const isError = statusText?.startsWith("Unable") || statusText?.startsWith("Message");

  return (
    /*
     * Key layout fix:
     * - `h-[calc(100dvh-64px)]` = full remaining viewport minus the header
     * - `overflow-hidden` on the outer div prevents ANY scroll escaping to the page
     * - Only the middle `flex-1 min-h-0 overflow-y-auto` div can scroll
     * - The input bar is a plain flex child that never scrolls
     */
    <div className="flex h-[calc(100dvh-64px)] flex-col overflow-hidden">

      {/* ── Scrollable message area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {isLoadingHistory && (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-1.5">
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}

        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 pb-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-900 shadow-xl shadow-sky-900/30">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">FinancePal AI</h2>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">
                Log expenses, manage budgets, track savings goals — just type naturally.
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s.label} onClick={() => void handleSend(s.label)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 hover:shadow-md">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isLoadingHistory && messages.length > 0 && (
          <div className="space-y-4 px-4 py-6 md:px-8">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-900 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div className={cn("flex max-w-[78%] flex-col gap-1 md:max-w-[60%]", isUser && "items-end")}>
                    <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {isUser ? "You" : "FinancePal"}
                    </p>
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                      isUser ? "rounded-br-sm bg-sky-900 text-white" : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-100",
                    )}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-900 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {statusText && (
              <div className="flex justify-center">
                <div className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm",
                  isError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", isError ? "bg-red-500" : "bg-emerald-500")} />
                  {statusText}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Fixed input bar — never scrolls ── */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 md:px-8 md:py-4">
        {!isEmpty && (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {["Spent 200 on matatu", "Set rent budget to 15000", "Deposit 500 to emergency fund", "How much left in my budget?"].map((s) => (
              <button key={s} onClick={() => void handleSend(s)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-sm transition-colors focus-within:border-sky-300 focus-within:bg-white">
          <textarea ref={textareaRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
            placeholder='Try: "Spent 500 on matatu" or "Set food budget to 8000"'
            rows={1} disabled={isLoading || isLoadingHistory}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none"
            style={{ minHeight: "24px" }} />
          <button onClick={() => void handleSend()} disabled={!input.trim() || isLoading}
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-900 text-white transition-all hover:bg-sky-800 disabled:opacity-30">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}