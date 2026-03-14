export const expenseCategories = [
  "food",
  "transport",
  "utilities",
  "rent",
  "education",
  "entertainment",
  "health",
  "shopping",
  "savings",
  "other",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export type ExpenseSource = "chatbot" | "manual";

export type ExpenseItem = {
  _id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string;
  source: ExpenseSource;
  createdAt?: string;
};

export type ExpenseCreateInput = {
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string;
  source?: ExpenseSource;
};

export type ChatRole = "user" | "assistant";

export type ChatMessageItem = {
  _id?: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
};

export type BudgetPeriod = "monthly" | "weekly";

export type BudgetItem = {
  _id: string;
  category: ExpenseCategory;
  limit: number;
  period: BudgetPeriod;
  month: number;
  year: number;
  spent: number;
  usagePercent: number;
  alertLevel: "ok" | "warning" | "danger";
};

export type BudgetCreateInput = {
  category: ExpenseCategory;
  limit: number;
  period: BudgetPeriod;
  month: number;
  year: number;
};

export type MonthlySummaryReport = {
  thisMonthTotal: number;
  lastMonthTotal: number;
  changePercent: number;
  topCategories: Array<{ category: ExpenseCategory; total: number }>;
};

export type CategoryBreakdownReport = Array<{
  category: ExpenseCategory;
  total: number;
  percent: number;
}>;

export type BudgetVsActualReport = Array<{
  category: ExpenseCategory;
  limit: number;
  actual: number;
  status: "under" | "over";
}>;

export type SpendingTrendReport = Array<{
  date: string;
  total: number;
}>;

export type SpendingHeatmapReport = Array<{
  date: string;
  total: number;
  intensity: number;
}>;

export type SavingsReport = Array<{
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  deadline: string;
  projectedMonthsToGoal: number | null;
  color: string;
}>;

export type ReportsResponse =
  | { type: "monthly"; data: MonthlySummaryReport }
  | { type: "categories"; data: CategoryBreakdownReport }
  | { type: "budget-vs-actual"; data: BudgetVsActualReport }
  | { type: "trends"; data: SpendingTrendReport }
  | { type: "heatmap"; data: SpendingHeatmapReport }
  | { type: "savings"; data: SavingsReport };
