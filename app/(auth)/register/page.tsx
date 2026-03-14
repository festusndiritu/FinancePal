"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BarChart3, CircleDollarSign, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Unable to create account");
      return;
    }

    router.push("/login");
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <section className="flex items-center justify-center bg-white px-4 py-12 sm:px-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Register</h2>
            <p className="text-base text-slate-600">Create an account to start tracking your money.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-slate-700" htmlFor="name">
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700" htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <Button
              className="h-11 w-full bg-sky-900 text-white hover:bg-sky-800"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link className="font-semibold text-sky-700 hover:text-sky-900" href="/login">
              Log in
            </Link>
          </p>
        </div>
      </section>

      <section className="relative hidden lg:flex items-center justify-center overflow-hidden bg-slate-900">
        <img
          src="/auth-bg-register.svg"
          alt="Abstract finance background"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

        <div className="relative max-w-md p-10 text-white">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Build Better Money Habits Fast
          </h1>
          <p className="mt-4 text-base text-white/80 sm:text-lg">
            FinancePal turns transactions into insights with clean reports, clear category trends, and practical budget signals.
          </p>
        </div>
      </section>
    </main>
  );
}
