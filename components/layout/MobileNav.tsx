"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu, X, LayoutDashboard, Receipt, TrendingUp,
  PiggyBank, BarChart2, MessageCircle, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/expenses",  label: "Expenses",   icon: Receipt         },
  { href: "/budgets",   label: "Budgets",    icon: TrendingUp      },
  { href: "/savings",   label: "Savings",    icon: PiggyBank       },
  { href: "/reports",   label: "Reports",    icon: BarChart2       },
  { href: "/chat",      label: "Chatbot",    icon: MessageCircle   },
  { href: "/settings",  label: "Settings",   icon: Settings        },
];

export default function MobileNav() {
  const pathname              = usePathname();
  const { data: session }     = useSession();
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  // Close on route change — no overflow manipulation needed
  useEffect(() => { setOpen(false); }, [pathname]);

  const name = session?.user?.name ?? "User";

  const drawerContent = mounted ? createPortal(
    // We use pointer-events + opacity for the backdrop instead of overflow:hidden
    // to avoid freezing the scroll context on iOS/Android
    <div className={cn("md:hidden", open ? "block" : "hidden")}>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-700/60 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-sky-400">FinancePal</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">Menu</p>
          <ul className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
                      active
                        ? "bg-sky-500/20 text-sky-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + sign out */}
        <div className="shrink-0 border-t border-slate-700/60 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-black text-white">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-200">{name}</p>
              <p className="text-[10px] text-slate-500">Free plan · v1.1.0</p>
            </div>
          </div>
          <button
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {drawerContent}
    </>
  );
}