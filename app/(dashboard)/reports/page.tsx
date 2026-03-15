"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart3, PieChart, TrendingUp,
  Grid3X3, PiggyBank, Download, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BudgetBarChart    from "@/components/charts/BudgetBarChart";
import CategoryPieChart  from "@/components/charts/CategoryPieChart";
import MonthlySummary    from "@/components/charts/MonthlySummary";
import SavingsTracker    from "@/components/charts/SavingsTracker";
import SpendingHeatmap   from "@/components/charts/SpendingHeatmap";
import SpendingTrendLine from "@/components/charts/SpendingTrendLine";
import { useReports } from "@/hooks/useReports";

type ReportTab =
  | "monthly"
  | "categories"
  | "budget-vs-actual"
  | "trends"
  | "heatmap"
  | "savings";

const TABS: { id: ReportTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: "monthly",          label: "Monthly",          shortLabel: "Monthly",    icon: <BarChart3  className="h-3.5 w-3.5" /> },
  { id: "categories",       label: "Categories",       shortLabel: "Categories", icon: <PieChart   className="h-3.5 w-3.5" /> },
  { id: "budget-vs-actual", label: "Budget vs Actual", shortLabel: "Budget",     icon: <BarChart3  className="h-3.5 w-3.5" /> },
  { id: "trends",           label: "Trends",           shortLabel: "Trends",     icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { id: "heatmap",          label: "Heatmap",          shortLabel: "Heatmap",    icon: <Grid3X3    className="h-3.5 w-3.5" /> },
  { id: "savings",          label: "Savings",          shortLabel: "Savings",    icon: <PiggyBank  className="h-3.5 w-3.5" /> },
];

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-1/3 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("monthly");
  const [days,   setDays]   = useState("30");
  const [period, setPeriod] = useState("month");

  const query = useMemo(() => {
    if (activeTab === "trends")     return `/api/reports?type=trends&days=${days}`;
    if (activeTab === "categories") return `/api/reports?type=categories&period=${period}`;
    if (activeTab === "heatmap")    return `/api/reports?type=heatmap&year=${new Date().getFullYear()}`;
    return `/api/reports?type=${activeTab}`;
  }, [activeTab, days, period]);

  const { data, isLoading, error } = useReports(query);

  const exportReportPdf = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`FinancePal — ${activeTab} report`, 14, 16);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

    if (data.type === "monthly") {
      autoTable(doc, {
        startY: 30,
        head: [["Metric", "Value"]],
        body: [
          ["This month",  `KES ${data.data.thisMonthTotal.toLocaleString()}`],
          ["Last month",  `KES ${data.data.lastMonthTotal.toLocaleString()}`],
          ["Change",      `${data.data.changePercent.toFixed(1)}%`],
          ...data.data.topCategories.map((item) => [`Top: ${item.category}`, `KES ${item.total.toLocaleString()}`]),
        ],
      });
    } else if (data.type === "categories") {
      autoTable(doc, {
        startY: 30,
        head: [["Category", "Total", "Percent"]],
        body: data.data.map((item) => [item.category, `KES ${item.total.toLocaleString()}`, `${item.percent.toFixed(1)}%`]),
      });
    } else if (data.type === "budget-vs-actual") {
      autoTable(doc, {
        startY: 30,
        head: [["Category", "Limit", "Actual", "Status"]],
        body: data.data.map((item) => [item.category, `KES ${item.limit.toLocaleString()}`, `KES ${item.actual.toLocaleString()}`, item.status]),
      });
    } else if (data.type === "trends") {
      autoTable(doc, {
        startY: 30,
        head: [["Date", "Total"]],
        body: data.data.map((item) => [item.date, `KES ${item.total.toLocaleString()}`]),
      });
    } else if (data.type === "heatmap") {
      autoTable(doc, {
        startY: 30,
        head: [["Date", "Total", "Intensity"]],
        body: data.data.map((item) => [item.date, `KES ${item.total.toLocaleString()}`, item.intensity.toFixed(2)]),
      });
    } else {
      autoTable(doc, {
        startY: 30,
        head: [["Goal", "Current", "Target", "Progress", "Months left"]],
        body: data.data.map((item) => [
          item.name,
          `KES ${item.currentAmount.toLocaleString()}`,
          `KES ${item.targetAmount.toLocaleString()}`,
          `${item.progressPercent.toFixed(1)}%`,
          item.projectedMonthsToGoal === null ? "N/A" : String(item.projectedMonthsToGoal),
        ]),
      });
    }
    doc.save(`financepal-${activeTab}-report.pdf`);
  };

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="px-4 py-6 pb-24 md:px-8 md:pb-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tab pills */}
        <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                activeTab === tab.id
                  ? "bg-white text-sky-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Filters + export */}
        <div className="flex shrink-0 items-center gap-2">
          {activeTab === "trends" && (
            <div className="relative">
              <select value={days} onChange={(e) => setDays(e.target.value)}
                className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-sky-400">
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 180 days</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}
          {activeTab === "categories" && (
            <div className="relative">
              <select value={period} onChange={(e) => setPeriod(e.target.value)}
                className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-sky-400">
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}
          <button onClick={exportReportPdf} disabled={!data || isLoading}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-40">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Chart card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            {activeTabMeta.icon}
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">{activeTabMeta.label}</h2>
            <p className="text-xs text-slate-400">
              {activeTab === "monthly"          && "Month-over-month spending comparison"}
              {activeTab === "categories"       && "Breakdown of spending by category"}
              {activeTab === "budget-vs-actual" && "How your spending compares to your budgets"}
              {activeTab === "trends"           && `Daily spending over the last ${days} days`}
              {activeTab === "heatmap"          && `Spending intensity throughout ${new Date().getFullYear()}`}
              {activeTab === "savings"          && "Progress toward your savings goals"}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {isLoading && !error && <ChartSkeleton />}

        {!isLoading && !error && data && (
          <>
            {data.type === "monthly"          && <MonthlySummary    data={data.data} />}
            {data.type === "categories"       && <CategoryPieChart  data={data.data} />}
            {data.type === "budget-vs-actual" && <BudgetBarChart    data={data.data} />}
            {data.type === "trends"           && <SpendingTrendLine data={data.data} />}
            {data.type === "heatmap"          && <SpendingHeatmap   data={data.data} />}
            {data.type === "savings"          && <SavingsTracker    data={data.data} />}
          </>
        )}

        {!isLoading && !error && !data && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-semibold text-slate-500">No data yet</p>
            <p className="text-xs text-slate-400">Add some expenses to see your {activeTabMeta.label.toLowerCase()} report.</p>
          </div>
        )}
      </div>
    </div>
  );
}