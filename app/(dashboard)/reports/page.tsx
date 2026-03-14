"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import BudgetBarChart from "@/components/charts/BudgetBarChart";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import MonthlySummary from "@/components/charts/MonthlySummary";
import SavingsTracker from "@/components/charts/SavingsTracker";
import SpendingHeatmap from "@/components/charts/SpendingHeatmap";
import SpendingTrendLine from "@/components/charts/SpendingTrendLine";
import ErrorState from "@/components/shared/ErrorState";
import LoadingState from "@/components/shared/LoadingState";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useReports } from "@/hooks/useReports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type ReportTab =
  | "monthly"
  | "categories"
  | "budget-vs-actual"
  | "trends"
  | "heatmap"
  | "savings";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("monthly");
  const [days, setDays] = useState("30");
  const [period, setPeriod] = useState("month");

  const query = useMemo(() => {
    if (activeTab === "trends") {
      return `/api/reports?type=trends&days=${days}`;
    }
    if (activeTab === "categories") {
      return `/api/reports?type=categories&period=${period}`;
    }
    if (activeTab === "heatmap") {
      return `/api/reports?type=heatmap&year=${new Date().getFullYear()}`;
    }
    return `/api/reports?type=${activeTab}`;
  }, [activeTab, days, period]);

  const { data, isLoading, error } = useReports(query);

  const exportReportPdf = () => {
    if (!data) {
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`FinancePal - ${activeTab} report`, 14, 16);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

    if (data.type === "monthly") {
      autoTable(doc, {
        startY: 30,
        head: [["Metric", "Value"]],
        body: [
          ["This month", `KES ${data.data.thisMonthTotal.toLocaleString()}`],
          ["Last month", `KES ${data.data.lastMonthTotal.toLocaleString()}`],
          ["Change", `${data.data.changePercent.toFixed(1)}%`],
          ...data.data.topCategories.map((item) => [
            `Top category: ${item.category}`,
            `KES ${item.total.toLocaleString()}`,
          ]),
        ],
      });
    } else if (data.type === "categories") {
      autoTable(doc, {
        startY: 30,
        head: [["Category", "Total", "Percent"]],
        body: data.data.map((item) => [
          item.category,
          `KES ${item.total.toLocaleString()}`,
          `${item.percent.toFixed(1)}%`,
        ]),
      });
    } else if (data.type === "budget-vs-actual") {
      autoTable(doc, {
        startY: 30,
        head: [["Category", "Limit", "Actual", "Status"]],
        body: data.data.map((item) => [
          item.category,
          `KES ${item.limit.toLocaleString()}`,
          `KES ${item.actual.toLocaleString()}`,
          item.status,
        ]),
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
        body: data.data.map((item) => [
          item.date,
          `KES ${item.total.toLocaleString()}`,
          item.intensity.toFixed(2),
        ]),
      });
    } else {
      autoTable(doc, {
        startY: 30,
        head: [["Goal", "Current", "Target", "Progress", "Projected months"]],
        body: data.data.map((item) => [
          item.name,
          `KES ${item.currentAmount.toLocaleString()}`,
          `KES ${item.targetAmount.toLocaleString()}`,
          `${item.progressPercent.toFixed(1)}%`,
          item.projectedMonthsToGoal === null
            ? "N/A"
            : String(item.projectedMonthsToGoal),
        ]),
      });
    }

    doc.save(`financepal-${activeTab}-report.pdf`);
  };

  return (
    <main className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Explore six report views across spending, budgets, trends, and savings.
        </p>
      </section>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportTab)}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1 lg:grid-cols-6">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="budget-vs-actual">Budget vs Actual</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex flex-wrap gap-3">
          {activeTab === "trends" ? (
            <Select value={days} onValueChange={(value) => setDays(value ?? "30")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 180 days</SelectItem>
              </SelectContent>
            </Select>
          ) : null}

          {activeTab === "categories" ? (
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value ?? "month")}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          ) : null}

          <Button type="button" variant="outline" onClick={exportReportPdf}>
            Export PDF
          </Button>
        </div>

        {error ? <ErrorState message={error} /> : null}
        {isLoading ? (
          <div className="mt-4">
            <LoadingState message="Loading report..." />
          </div>
        ) : null}

        <TabsContent value="monthly" className="mt-4">
          {!isLoading && data?.type === "monthly" ? <MonthlySummary data={data.data} /> : null}
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          {!isLoading && data?.type === "categories" ? <CategoryPieChart data={data.data} /> : null}
        </TabsContent>

        <TabsContent value="budget-vs-actual" className="mt-4">
          {!isLoading && data?.type === "budget-vs-actual" ? <BudgetBarChart data={data.data} /> : null}
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          {!isLoading && data?.type === "trends" ? <SpendingTrendLine data={data.data} /> : null}
        </TabsContent>

        <TabsContent value="heatmap" className="mt-4">
          {!isLoading && data?.type === "heatmap" ? <SpendingHeatmap data={data.data} /> : null}
        </TabsContent>

        <TabsContent value="savings" className="mt-4">
          {!isLoading && data?.type === "savings" ? <SavingsTracker data={data.data} /> : null}
        </TabsContent>
      </Tabs>
    </main>
  );
}
