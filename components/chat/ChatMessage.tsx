import { cn } from "@/lib/utils";
import type { ChatMessageItem } from "@/types";

type ChatMessageProps = {
  message: ChatMessageItem;
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-teal-900 text-white"
            : "bg-slate-100 text-slate-900",
        )}
      >
        <p className="mb-1 text-[11px] uppercase tracking-wide opacity-75">
          {isUser ? "You" : "FinancePal"}
        </p>
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
