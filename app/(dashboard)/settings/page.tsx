"use client";

import { useEffect, useState } from "react";
import ErrorState from "@/components/shared/ErrorState";
import LoadingState from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const initialState: SettingsState = {
  name: "",
  email: "",
  currency: "KES",
  monthlyIncome: "0",
  preferences: {
    emailNotifications: true,
    weeklySummary: true,
    compactDashboard: false,
  },
};

export default function SettingsPage() {
  const [state, setState] = useState<SettingsState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/settings", { cache: "no-store" });

      if (!response.ok) {
        setError("Failed to load settings");
        setIsLoading(false);
        return;
      }

      const payload = (await response.json()) as {
        data: {
          name: string;
          email: string;
          currency: string;
          monthlyIncome: number;
          preferences: SettingsState["preferences"];
        };
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
    setSuccess(null);
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

    if (!response.ok) {
      setError("Failed to save settings");
      return;
    }

    setSuccess("Settings saved");
  };

  if (isLoading) {
    return <LoadingState message="Loading settings..." />;
  }

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage profile details, currency, and personal preferences.
        </p>
      </section>

      <form className="space-y-4" onSubmit={saveSettings}>
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="settings-name">Name</Label>
            <Input
              id="settings-name"
              value={state.name}
              onChange={(event) =>
                setState((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" value={state.email} disabled />
          </div>

          <div className="grid gap-2">
            <Label>Currency</Label>
            <Select
              value={state.currency}
              onValueChange={(value) =>
                setState((current) => ({ ...current, currency: value ?? "KES" }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KES">KES</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="settings-income">Monthly income</Label>
            <Input
              id="settings-income"
              type="number"
              min="0"
              step="0.01"
              value={state.monthlyIncome}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  monthlyIncome: event.target.value,
                }))
              }
            />
          </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                checked={state.preferences.emailNotifications}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    preferences: {
                      ...current.preferences,
                      emailNotifications: event.target.checked,
                    },
                  }))
                }
              />
              Email notifications
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                checked={state.preferences.weeklySummary}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    preferences: {
                      ...current.preferences,
                      weeklySummary: event.target.checked,
                    },
                  }))
                }
              />
              Weekly spending summary
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                checked={state.preferences.compactDashboard}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    preferences: {
                      ...current.preferences,
                      compactDashboard: event.target.checked,
                    },
                  }))
                }
              />
              Compact dashboard cards
            </label>
          </CardContent>
        </Card>

        {error ? <ErrorState message={error} /> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

        <Button type="submit" disabled={isSaving} className="bg-sky-900 text-white hover:bg-sky-800">
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </main>
  );
}
