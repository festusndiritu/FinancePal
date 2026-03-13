export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-start justify-center gap-8 px-6 py-16 sm:px-10">
      <div className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600">
        Next.js 15 + Bun + Tailwind CSS
      </div>

      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          FinancePal
        </h1>
        <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
          A clean starter for building personal finance insights, budgeting,
          and analytics workflows with modern TypeScript tooling.
        </p>
      </section>

      <section className="grid w-full gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">App Router</h2>
          <p className="mt-1 text-sm text-slate-600">
            Organized around app/, components/, hooks/, lib/, models/, and
            types/.
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Data Ready</h2>
          <p className="mt-1 text-sm text-slate-600">
            Includes auth, MongoDB, charts, schema validation, and caching.
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Production</h2>
          <p className="mt-1 text-sm text-slate-600">
            Bun-based scripts for fast local development and builds.
          </p>
        </article>
      </section>
    </main>
  );
}
