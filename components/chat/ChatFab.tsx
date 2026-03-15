"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { mutate } from "swr";
import type { ChatMessageItem } from "@/types";

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
  }
  const body: Record<string, unknown> = { id: s.goalId };
  if (s.currentAmount !== undefined) body.currentAmount = s.currentAmount;
  if (s.targetAmount  !== undefined) body.targetAmount  = s.targetAmount;
  if (s.deadline      !== undefined) body.deadline      = s.deadline;
  return (await fetch("/api/savings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).ok;
}

export default function ChatFab() {
  const pathname = usePathname();

  const [open,       setOpen]       = useState(false);
  const [messages,   setMessages]   = useState<ChatMessageItem[]>([]);
  const [input,      setInput]      = useState("");
  const [isLoading,  setIsLoading]  = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);
  useEffect(() => { if (pathname === "/chat") setOpen(false); }, [pathname]);

  // All hooks above — early return after
  if (pathname === "/chat") return null;

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    const nextMessages: ChatMessageItem[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setStatusText(null);
    setIsLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages.slice(-20).map((m) => ({ role: m.role, content: m.content })) }),
    });

    setIsLoading(false);
    if (!response.ok) {
      setMessages((cur) => [...cur, { role: "assistant", content: "Something went wrong. Please try again." }]);
      return;
    }

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

  return (
    <>
      {/* FAB — desktop only */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:block">
        <button onClick={() => setOpen((v) => !v)} aria-label={open ? "Close chat" : "Open AI chat"}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-900 text-white shadow-xl shadow-sky-900/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-800 hover:shadow-2xl">
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>

      {/* Panel — desktop only */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-40 hidden w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 transition-all duration-300 md:flex",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
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
              <p className="text-[10px] text-sky-200">Expenses, budgets &amp; savings</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/20 hover:text-white">
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 pb-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
                <MessageCircle className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Ask FinancePal</p>
                <p className="mt-0.5 text-xs text-slate-500">Log expenses, set budgets, or manage savings</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {["Spent 200 on transport", "Set food budget 5000", "What's my budget?"].map((s) => (
                  <button key={s} onClick={() => setInput(s)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                msg.role === "user" ? "rounded-br-sm bg-sky-900 text-white" : "rounded-bl-sm bg-slate-100 text-slate-800",
              )}>
                {msg.role === "assistant" && (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">FinancePal</p>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}

          {statusText && (
            <p className="text-center text-xs font-semibold text-emerald-600">{statusText}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors focus-within:border-sky-300 focus-within:bg-white">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
              placeholder='Try: "Spent 500 on matatu"'
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
              disabled={isLoading} />
            <button onClick={() => void handleSend()} disabled={!input.trim() || isLoading}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-900 text-white transition-all hover:bg-sky-800 disabled:opacity-40">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}