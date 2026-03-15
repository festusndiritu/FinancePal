"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { TrendingUp, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const perks = [
  "Track expenses across 10 categories",
  "AI-powered chat to log spending naturally",
  "Budget alerts at 80% and 100% usage",
  "6 report views with PDF export",
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Unable to create account. Please try again.");
      return;
    }

    router.push("/login");
  };

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left — form */}
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
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Create your account</h2>
              <p className="mt-2 text-sm text-slate-500">Free forever. No credit card required.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>

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
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    minLength={8}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create free account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                By signing up you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-sky-700 hover:text-sky-900">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right — decorative, desktop only */}
      <section className="relative hidden lg:flex flex-col overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-sky-950" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />

        {/* Content — fully centered */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-16 text-center">
          {/* Logo — centered at top of content block */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 shadow-lg shadow-sky-500/30">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">FinancePal</span>
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
            Pesa Yako,<br />Mipango Yako,<br />
            <span className="text-emerald-400">Maisha Yako.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-slate-400">
            Everything you need to understand and control your personal finances — all in one place.
          </p>

          {/* Perks */}
          <div className="mt-10 space-y-3 text-left">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-300">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative pb-8 text-center text-xs text-slate-600">
          © 2025 FinancePal. All rights reserved.
        </p>
      </section>
    </main>
  );
}