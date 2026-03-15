"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Save, User, Sliders, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

type SettingsState = {
  name: string;
  email: string;
  currency: string;
  monthlyIncome: string;
  preferences: {
    emailNotifications: boolean;
    weeklySummary: boolean;
    compactDashboard: boolean;
  };
};

export default function SettingsPage() {
  const { update: updateSession } = useSession();
  const [state, setState] = useState<SettingsState>({
    name: "", email: "", currency: "KES", monthlyIncome: "0",
    preferences: { emailNotifications: true, weeklySummary: true, compactDashboard: false },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) { setError("Failed to load settings"); setIsLoading(false); return; }
      const payload = (await response.json()) as {
        data: { name: string; email: string; currency: string; monthlyIncome: number; preferences: SettingsState["preferences"] };
      };
      setState({
        name: payload.data.name,
        email: payload.data.email,
        currency: payload.data.currency,
        monthlyIncome: String(payload.data.monthlyIncome ?? 0),
        preferences: payload.data.preferences,
      });
      setIsLoading(false);
    };
    void load();
  }, []);

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: state.name,
        currency: state.currency,
        monthlyIncome: Number(state.monthlyIncome || 0),
        preferences: state.preferences,
      }),
    });

    setIsSaving(false);
    if (!response.ok) { setError("Failed to save settings"); return; }

    // Update the session token so name reflects immediately in header/sidebar
    await updateSession({ name: state.name });

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const toggle = (key: keyof SettingsState["preferences"]) => {
    setState((cur) => ({
      ...cur,
      preferences: { ...cur.preferences, [key]: !cur.preferences[key] },
    }));
  };

  if (isLoading) {
    return (
      <main className="flex flex-col gap-6 p-6 lg:p-8">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 p-6 lg:p-8">
      <form className="space-y-5" onSubmit={saveSettings}>
        {/* Profile */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50">
              <User className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Profile</h2>
              <p className="text-xs text-slate-500">Your personal details</p>
            </div>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-name" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Full name
              </Label>
              <Input
                id="s-name"
                value={state.name}
                onChange={(e) => setState((c) => ({ ...c, name: e.target.value }))}
                required
                className="h-11 border-slate-200 bg-slate-50 text-sm focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-email" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Email
              </Label>
              <Input id="s-email" value={state.email} disabled
                className="h-11 border-slate-200 bg-slate-100 text-sm text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Currency
              </Label>
              <Select value={state.currency} onValueChange={(v) => setState((c) => ({ ...c, currency: v ?? "KES" }))}>
                <SelectTrigger className="h-11 border-slate-200 bg-slate-50 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["KES", "USD", "EUR", "GBP"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-income" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Monthly income
              </Label>
              <Input id="s-income" type="number" min="0" step="0.01"
                value={state.monthlyIncome}
                onChange={(e) => setState((c) => ({ ...c, monthlyIncome: e.target.value }))}
                className="h-11 border-slate-200 bg-slate-50 text-sm focus:bg-white" />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
              <Sliders className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Preferences</h2>
              <p className="text-xs text-slate-500">Notifications and display options</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50 px-6">
            {[
              { key: "emailNotifications" as const, label: "Email notifications", desc: "Receive spending alerts by email" },
              { key: "weeklySummary" as const, label: "Weekly spending summary", desc: "Get a weekly digest of your spending" },
              { key: "compactDashboard" as const, label: "Compact dashboard cards", desc: "Smaller cards for more information density" },
            ].map((pref) => (
              <label key={pref.key} className="flex cursor-pointer items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{pref.label}</p>
                  <p className="text-xs text-slate-500">{pref.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={state.preferences[pref.key]}
                  onClick={() => toggle(pref.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${state.preferences[pref.key] ? "bg-sky-600" : "bg-slate-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${state.preferences[pref.key] ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            ✓ Settings saved — your name has been updated everywhere.
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="flex h-11 items-center gap-2 rounded-xl bg-sky-900 px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-sky-800 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </form>

      {/* Mobile sign out */}
      <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm md:hidden">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Sign out</h2>
            <p className="mt-0.5 text-sm text-slate-500">You&apos;ll be returned to the login screen.</p>
          </div>
        </div>
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="mt-4 flex h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 text-sm font-bold text-red-600 transition-all hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

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
    </main>
  );
}