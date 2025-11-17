/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { queryOptions } from "@tanstack/react-query";
import { PaginatedServerResponse, ServerPaginationParams } from "@/types/pagination";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/constants/pagination";

// Data Types
export interface RevenueDashboardMetrics {
  totalAccumulatedRevenue: number;
  currentBalance: number;
  totalInvoicedRevenue: number;
  pendingRevenue: number;
}

export interface RevenueTransaction {
  id: string;
  date: string;
  company: string;
  withdrawalId: string;
  amount: string;
  status: "paid" | "pending" | "cancelled" | "overdue";
}

export interface RevenueDashboardData {
  metrics: RevenueDashboardMetrics;
  recentTransactions: RevenueTransaction[];
}

export interface ChartDataPoint {
  month: string;
  invoice: number;
  accumulate: number;
}

export interface RevenueChartData {
  chartData: ChartDataPoint[];
  summary: {
    inflow: number;
    outflow: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export interface WithdrawalRequest {
  invoiceId: string;
  amount: number;
  notes?: string;
}

export interface WithdrawalRequestResponse {
  transactionId: string;
  amount: number;
  status: "pending" | "paid" | "rejected" | "processed";
  processedAt: string;
}

// Query Parameters
export interface RevenueTransactionsParams extends ServerPaginationParams {
  type?: "invoice" | "withdrawal";
  status?: "pending" | "paid" | "cancelled" | "overdue";
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface RevenueChartParams {
  period?: "this-month" | "last-month" | "this-year" | "last-year" | "custom";
  startDate?: string;
  endDate?: string;
  months?: number;
}

export interface HireHistoryItem {
  id: string;
  name: string;
  companyName: string;
  club: string;
  clubAvatar?: string;
  invoiceId: string;
  amount: number;
  dateTime: string;
}

export interface HireHistoryParams extends ServerPaginationParams {
  status?: "completed" | "in-progress" | "cancelled" | "pending";
  search?: string;
  startDate?: string;
  endDate?: string;
  companyId?: string;
}

// API Functions
const fetchRevenueDashboard = async (): Promise<RevenueDashboardData> => {
  const response = await apiAxiosInstance.get<
    ApiSuccessResponse<{ data: RevenueDashboardData }>
  >("/club/revenue/dashboard");

  return response.data.data;
};

const fetchRevenueTransactions = async (
  params: RevenueTransactionsParams
): Promise<PaginatedServerResponse<RevenueTransaction>> => {
  const response = await apiAxiosInstance.get<
    ApiSuccessResponse<{ data: PaginatedServerResponse<RevenueTransaction> }>
  >("/club/revenue/transactions", {
    params,
  });

  return response.data.data;
};

const createWithdrawalRequest = async (
  data: WithdrawalRequest
): Promise<WithdrawalRequestResponse> => {
  const response = await apiAxiosInstance.post<
    ApiSuccessResponse<{ data: WithdrawalRequestResponse }>
  >("/club/revenue/withdrawal-request", data);

  return response.data.data;
};

const fetchRevenueChart = async (
  params: RevenueChartParams
): Promise<RevenueChartData> => {
  const response = await apiAxiosInstance.get<
    ApiSuccessResponse<{ data: RevenueChartData }>
  >("/club/revenue/chart", {
    params,
  });

  return response.data.data;
};

const fetchHireHistory = async (
  params: HireHistoryParams
): Promise<PaginatedServerResponse<HireHistoryItem>> => {
  const response = await apiAxiosInstance.get<
    ApiSuccessResponse<{ data: PaginatedServerResponse<HireHistoryItem> }>
  >("/club/revenue/hire-history", {
    params,
  });

  console.log('response hire history', response.data.data);
  return response.data.data;
};

// Query Factory
export const revenueManagementQueries = {
  all: () => ["club-revenue"] as const,

  dashboard: () => {
    return queryOptions({
      queryKey: [...revenueManagementQueries.all(), "dashboard"] as const,
      queryFn: () => fetchRevenueDashboard(),
    });
  },

  transactions: ({
    page = DEFAULT_PAGE_NUMBER,
    limit = DEFAULT_PAGE_SIZE,
    ...filters
  }: RevenueTransactionsParams = {}) => {
    const params = { page, limit, ...filters };
    return queryOptions({
      queryKey: [...revenueManagementQueries.all(), "transactions", params] as const,
      queryFn: () => fetchRevenueTransactions(params),
    });
  },

  chart: (params: RevenueChartParams = {}) => {
    return queryOptions({
      queryKey: [...revenueManagementQueries.all(), "chart", params] as const,
      queryFn: () => fetchRevenueChart(params),
    });
  },

  hireHistory: ({
    page = DEFAULT_PAGE_NUMBER,
    limit = DEFAULT_PAGE_SIZE,
    ...filters
  }: HireHistoryParams = {}) => {
    const params = { page, limit, ...filters };
    return queryOptions({
      queryKey: [...revenueManagementQueries.all(), "hire-history", params] as const,
      queryFn: () => fetchHireHistory(params),
    });
  },

  withdrawalRequest: (data: WithdrawalRequest) => {
    return createWithdrawalRequest(data);
  },
};
