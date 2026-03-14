"use client";

import { usePathname } from "next/navigation";

const routeTitleMap: Array<{ prefix: string; title: string; subtitle: string }> = [
  {
    prefix: "/dashboard",
    title: "Dashboard Overview",
    subtitle: "Personal finance assistant",
  },
  {
    prefix: "/expenses",
    title: "Expenses",
    subtitle: "Track and manage spending",
  },
  {
    prefix: "/budgets",
    title: "Budgets",
    subtitle: "Set limits and monitor usage",
  },
  {
    prefix: "/reports",
    title: "Reports",
    subtitle: "Analyze trends and performance",
  },
  {
    prefix: "/chat",
    title: "Finance Chatbot",
    subtitle: "Log entries and ask finance questions",
  },
  {
    prefix: "/settings",
    title: "Settings",
    subtitle: "Profile and app preferences",
  },
];

export default function HeaderTitle() {
  const pathname = usePathname();

  const matched =
    routeTitleMap.find((item) => pathname.startsWith(item.prefix)) ??
    routeTitleMap[0];

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
        {matched.subtitle}
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{matched.title}</h1>
    </div>
  );
}