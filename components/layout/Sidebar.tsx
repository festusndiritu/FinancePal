"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bot, CircleDollarSign, LayoutDashboard,
  BarChart2, Receipt, Settings, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SignOutButton from "@/components/layout/SignOutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses",  label: "Expenses",  icon: Receipt },
  { href: "/budgets",   label: "Budgets",   icon: CircleDollarSign },
  { href: "/reports",   label: "Reports",   icon: BarChart2 },
  { href: "/chat",      label: "Chatbot",   icon: Bot },
  { href: "/settings",  label: "Settings",  icon: Settings },
];

type SidebarProps = {
  userName: string; // fallback from server session
};

export default function Sidebar({ userName: fallbackName }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Prefer live session name so it updates immediately on settings save
  const userName = session?.user?.name ?? fallbackName;
  const userInitial = userName.charAt(0).toUpperCase() || "U";

  return (
    <aside
      style={{ width: "256px", minWidth: "256px" }}
      className="hidden h-full flex-col bg-slate-900 px-4 pb-5 pt-6 md:flex"
    >
      {/* Brand */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500 shadow-md shadow-sky-500/40">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-sky-400">FinancePal</p>
            <p className="truncate text-base font-bold text-slate-100">{userName}</p>
          </div>
        </div>
      </div>

      <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-slate-600">Menu</p>

      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive ? "bg-slate-700/80 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sky-400" : "text-slate-500")} />
              <span className="truncate">{item.label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-1">
        <SignOutButton />
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sm font-bold text-sky-400 ring-1 ring-sky-500/30">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-200">{userName}</p>
              <p className="text-xs text-slate-500">Free plan · v1.1.0</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}