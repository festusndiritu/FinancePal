"use client";

import { useEffect } from "react";
import useSWR from "swr";
import type { ReportsResponse } from "@/types";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load report data");
  }
  return response.json() as Promise<ReportsResponse>;
};

export function useReports(url: string) {
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

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
    data,
    error: error instanceof Error ? error.message : null,
    isLoading,
    mutate,
  };
}
