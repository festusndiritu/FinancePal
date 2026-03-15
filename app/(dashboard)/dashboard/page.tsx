import OverviewCards from "@/components/dashboard/OverviewCards";
import QuickAdd from "@/components/dashboard/QuickAdd";
import RecentExpenses from "@/components/dashboard/RecentExpenses";

export default function DashboardPage() {
  return (
    <main className="flex flex-col gap-6 p-6 lg:p-8">
      <OverviewCards />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start">
        <RecentExpenses />
        <QuickAdd />
      </div>
    </main>
  );
}