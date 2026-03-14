"use client";

import { useEffect, useRef } from "react";
import type { ChatMessageItem } from "@/types";
import EmptyState from "@/components/shared/EmptyState";
import ChatMessage from "./ChatMessage";

type ChatWindowProps = {
  messages: ChatMessageItem[];
  loading?: boolean;
};

function TypingBubble() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
      <span className="font-semibold text-slate-800">FinancePal</span>
      <div className="flex items-center gap-1">
        <span
          className="h-2 w-2 rounded-full bg-slate-500 animate-pulse"
          style={{ animationDelay: "0s" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-slate-500 animate-pulse"
          style={{ animationDelay: "0.15s" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-slate-500 animate-pulse"
          style={{ animationDelay: "0.3s" }}
        />
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, loading }: ChatWindowProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4"
    >
      {messages.length === 0 ? (
        <EmptyState message="Start by asking for advice or logging an expense in plain language." />
      ) : (
        messages.map((message, index) => (
          <ChatMessage key={`${message.role}-${index}`} message={message} />
        ))
      )}

      {loading ? (
        <div className="flex justify-start">
          <TypingBubble />
        </div>
      ) : null}
    </div>
  );
}
