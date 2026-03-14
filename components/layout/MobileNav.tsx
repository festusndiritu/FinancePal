"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bot,
  CircleDollarSign,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Receipt,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign },
  { href: "/reports", label: "Reports", icon: PiggyBank },
  { href: "/chat", label: "Chatbot", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

type MobileNavProps = {
  userName: string;
};

export default function MobileNav({ userName }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Signed in as {userName}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Menu className="mr-2 h-4 w-4" />
          Menu
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="ml-auto w-full max-w-xs rounded-2xl border bg-background p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Navigation</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
