"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard",  subtitle: "Welcome back" },
  "/expenses":  { title: "Expenses",   subtitle: "Track your spending" },
  "/budgets":   { title: "Budgets",    subtitle: "Set limits & monitor usage" },
  "/savings":   { title: "Savings",    subtitle: "Track your goals" },
  "/reports":   { title: "Reports",    subtitle: "Analyze trends and performance" },
  "/chat":      { title: "Chatbot",    subtitle: "Log entries and ask questions" },
  "/settings":  { title: "Settings",   subtitle: "Manage your account" },
};

export default function HeaderTitle() {
  const pathname = usePathname();
  const base     = "/" + (pathname.split("/")[1] ?? "");
  const meta     = TITLES[base] ?? { title: "FinancePal", subtitle: "" };

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
        {meta.subtitle}
      </p>
      <h1 className="text-lg font-black leading-tight text-slate-900">{meta.title}</h1>
    </div>
  );
}