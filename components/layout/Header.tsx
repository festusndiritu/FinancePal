"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import HeaderTitle from "@/components/layout/HeaderTitle";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

type HeaderProps = {
  userName: string;
};

export default function Header({ userName: initialUserName }: HeaderProps) {
  const { data: session } = useSession();
  // Use session name if available (reflects immediate updates from settings)
  const userName = session?.user?.name ?? initialUserName;

  const [open, setOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <HeaderTitle />

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl p-1.5 pr-2.5 transition-colors hover:bg-slate-100"
            aria-expanded={open}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-900 text-sm font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-semibold text-slate-700 md:block">{userName}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">Free plan</p>
              </div>
              <div className="p-1.5">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </Link>
                <button
                  onClick={() => { setOpen(false); setShowSignOutConfirm(true); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {showSignOutConfirm && (
        <ConfirmDialog
          title="Sign out"
          message="Are you sure you want to sign out of FinancePal?"
          confirmLabel="Sign out"
          confirmVariant="danger"
          onConfirm={() => void signOut({ callbackUrl: "/login" })}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </>
  );
}