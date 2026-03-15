"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { TrendingUp, ArrowRight, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        const normalized = result.error.toLowerCase();
        if (normalized.includes("configured")) {
          setError("Auth is not configured. Set MONGODB_URI and NEXTAUTH_SECRET.");
        } else {
          setError("Invalid email or password. Please try again.");
        }
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left — decorative, desktop only */}
      <section className="relative hidden lg:flex flex-col overflow-hidden bg-slate-900">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900 via-slate-900 to-slate-950" />
        {/* Blobs */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />

        {/* Content — centered vertically and horizontally */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-16 text-center">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 shadow-lg shadow-sky-500/30">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">FinancePal</span>
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
            Know Where Your<br />Money Goes,<br />
            <span className="text-sky-400">Every Shilling.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-slate-400">
            Plan budgets, track categories, and understand your spending with a dashboard built for daily decisions.
          </p>

          {/* Stats */}
          <div className="mt-10 flex items-center gap-10">
            {[
              { value: "6", label: "Report views" },
              { value: "AI", label: "Powered chat" },
              { value: "∞", label: "Expenses tracked" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative pb-8 text-center text-xs text-slate-600">
          © 2025 FinancePal. All rights reserved.
        </p>
      </section>

      {/* Right — form */}
      <section className="flex min-h-screen flex-col bg-white lg:min-h-0">
        {/* Mobile header */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-900">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">FinancePal</span>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500">Sign in to your FinancePal account</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                  <button type="button" className="text-xs font-semibold text-sky-700 hover:text-sky-900">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-900 text-sm font-bold text-white shadow-sm transition-all hover:bg-sky-800 active:scale-[0.99] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-sky-700 hover:text-sky-900">
                Create one free →
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}