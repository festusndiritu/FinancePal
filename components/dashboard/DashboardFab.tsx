"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardFab() {
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    const key = "financepal:dashboard-fab-seen";
    const seen = window.sessionStorage.getItem(key);

    if (!seen) {
      setHighlight(true);
      const timer = window.setTimeout(() => setHighlight(false), 2000);
      window.sessionStorage.setItem(key, "1");
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, []);

  return (
    <Link
      href="/chat"
      aria-label="Open chatbot"
      className={cn(
        buttonVariants({ size: "icon" }),
        "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-teal-900 text-white shadow-lg hover:bg-teal-800",
        highlight && "animate-bounce",
      )}
    >
      <Bot className="h-6 w-6" />
    </Link>
  );
}