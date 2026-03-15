"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardFab() {
  const [pulse, setPulse] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const key = "financepal:fab-seen";
    if (!window.sessionStorage.getItem(key)) {
      setPulse(true);
      window.sessionStorage.setItem(key, "1");
      const t = setTimeout(() => setPulse(false), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div
      className="fixed bottom-6 right-6 z-40 hidden md:block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      <div
        className={cn(
          "absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-xl transition-all duration-200",
          showTooltip ? "pointer-events-none translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
        )}
      >
        Ask FinancePal AI
        <span className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 rounded-sm bg-slate-900" />
      </div>

      {/* Button */}
      <Link
        href="/chat"
        aria-label="Open AI chatbot"
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-900 text-white shadow-xl shadow-sky-900/40 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-800 hover:shadow-2xl hover:shadow-sky-900/50",
          pulse && "animate-bounce",
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Link>
    </div>
  );
}