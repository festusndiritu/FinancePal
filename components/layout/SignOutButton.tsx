"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function SignOutButton() {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-800 hover:text-rose-400"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign out
      </button>

      {showConfirm && (
        <ConfirmDialog
          title="Sign out"
          message="Are you sure you want to sign out of FinancePal?"
          confirmLabel="Sign out"
          confirmVariant="danger"
          onConfirm={() => void signOut({ callbackUrl: "/login" })}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}