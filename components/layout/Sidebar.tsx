"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Receipt, PiggyBank, BarChart2, MessageCircle, Settings, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SignOutButton from "@/components/layout/SignOutButton";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/expenses",   label: "Expenses",   icon: Receipt         },
  { href: "/budgets",    label: "Budgets",    icon: TrendingUp      },
  { href: "/savings",    label: "Savings",    icon: PiggyBank       },
  { href: "/reports",    label: "Reports",    icon: BarChart2       },
  { href: "/chat",       label: "Chatbot",    icon: MessageCircle   },
  { href: "/settings",   label: "Settings",   icon: Settings        },
];

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name ?? userName;

  return (
    <aside
      className="hidden flex-col bg-slate-900 text-white md:flex"
      style={{ width: "256px", minWidth: "256px" }}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-700/60 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
          <BarChart2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-sky-400">FinancePal</p>
          <p className="text-[10px] text-slate-400 leading-none">{name}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">Menu</p>
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
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

      {/* Footer */}
      <div className="border-t border-slate-700/60 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-black text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-200">{name}</p>
            <p className="text-[10px] text-slate-500">Free plan · v1.1.0</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}