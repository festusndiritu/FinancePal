"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Circle,
  Bot,
  CircleDollarSign,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign },
  { href: "/reports", label: "Reports", icon: PiggyBank },
  { href: "/chat", label: "Chatbot", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  userName: string;
};

export default function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname();
  const userInitial = userName.charAt(0).toUpperCase() || "U";

  return (
    <aside className="hidden h-full w-72 flex-col border-r border-slate-700 bg-sky-950 px-4 pb-4 pt-6 text-white md:flex">
      <div className="mb-8 rounded-2xl bg-white/10 p-5">
        <p className="text-xs uppercase tracking-wide text-sky-100">
          FinancePal
        </p>
        <p className="mt-1 text-lg font-bold">Welcome, {userName}</p>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-sky-100 transition-colors",
              "hover:bg-white/20 hover:text-white",
              pathname === item.href &&
                "bg-white text-sky-950 shadow-sm hover:bg-white hover:text-sky-950",
            )}
          >
            {pathname === item.href ? (
              <span className="absolute left-0 top-2 h-7 w-1 rounded-r bg-sky-500" />
            ) : null}
            <item.icon className="h-4 w-4" />
            <span className={cn(pathname === item.href && "font-semibold")}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/15 bg-white/10 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-sky-950">
            {userInitial}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{userName}</p>
            <p className="text-xs text-sky-100">v1.0.0</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs text-sky-100">
          <Circle className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" />
          <span>All systems running</span>
        </div>
      </div>
    </aside>
  );
}
