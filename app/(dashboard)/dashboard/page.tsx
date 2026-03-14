import OverviewCards from "@/components/dashboard/OverviewCards";
import DashboardFab from "@/components/dashboard/DashboardFab";
import QuickAdd from "@/components/dashboard/QuickAdd";
import RecentExpenses from "@/components/dashboard/RecentExpenses";

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <section className="p-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Financial command center
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Live spending, budgets, and quick expense capture in one place.
        </p>
      </section>

      <OverviewCards />

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <RecentExpenses />
        <QuickAdd />
      </section>

      <DashboardFab />
    </main>
  );
}
