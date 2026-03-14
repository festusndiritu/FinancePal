"use client";

import { useEffect } from "react";
import useSWR from "swr";
import type { BudgetItem } from "@/types";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load budgets");
  }
  return response.json() as Promise<{ data: BudgetItem[] }>;
};

export function useBudgets() {
  const { data, error, isLoading, mutate } = useSWR("/api/budgets", fetcher);

  useEffect(() => {
    const handleRefresh = () => {
      void mutate();
    };

    window.addEventListener("financepal:budgets-updated", handleRefresh);
    window.addEventListener("financepal:expenses-updated", handleRefresh);

    return () => {
      window.removeEventListener("financepal:budgets-updated", handleRefresh);
      window.removeEventListener("financepal:expenses-updated", handleRefresh);
    };
  }, [mutate]);

  return {
    budgets: data?.data ?? [],
    error: error instanceof Error ? error.message : null,
    isLoading,
    mutate,
  };
}
