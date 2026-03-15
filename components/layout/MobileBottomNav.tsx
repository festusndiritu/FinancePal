"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CircleDollarSign,
  LayoutDashboard,
  BarChart2,
  Receipt,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home",     icon: LayoutDashboard },
  { href: "/expenses",  label: "Expenses", icon: Receipt },
  { href: "/budgets",   label: "Budgets",  icon: CircleDollarSign },
  { href: "/reports",   label: "Reports",  icon: BarChart2 },
  { href: "/chat",      label: "Chat",     icon: Bot },
  { href: "/settings",  label: "Settings", icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors",
              isActive ? "text-sky-600" : "text-slate-400 hover:text-slate-600",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-sky-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}