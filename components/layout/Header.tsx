"use client";

import { useSession } from "next-auth/react";
import { ChevronDown, Settings, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import HeaderTitle from "@/components/layout/HeaderTitle";
import MobileNav from "@/components/layout/MobileNav";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

type Props = { userName: string };

export default function Header({ userName }: Props) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? userName;

  const [dropdownOpen, setDropdownOpen]         = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-3">
          <MobileNav />
          <HeaderTitle />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 transition-colors hover:bg-slate-50"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-black text-white">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-semibold text-slate-700 sm:inline">{name}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <Link href="/settings" onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                <Settings className="h-4 w-4 text-slate-400" /> Settings
              </Link>
              <div className="border-t border-slate-100" />
              <button
                onClick={() => { setDropdownOpen(false); setShowSignOutConfirm(true); }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {showSignOutConfirm && (
        <ConfirmDialog
          title="Sign out?"
          message="You'll need to sign back in to access your account."
          confirmLabel="Sign out"
          confirmVariant="danger"
          onConfirm={() => void signOut({ callbackUrl: "/login" })}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </>
  );
}