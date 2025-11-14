/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import { PaginatedServerResponse } from "@/types/pagination";
import { queryOptions } from "@tanstack/react-query";

export interface HireInvoice {
	id: string;
	name: string;
	companyName: string;
	club: string;
	clubAvatar?: string;
	invoiceId: string;
	amount: number;
	dateTime: string;
}

export interface WithdrawalInvoice {
	id: string;
	invoiceId: string;
	club: string;
	clubAvatar?: string;
	amount: number;
	status: "Paid" | "Pending" | "Overdue" | "Cancelled" | "Rejected" | "Processed";
}

export interface InvoiceQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
}

export interface InvoiceStats {
	paidCount: number;
	pendingCount: number;
	totalCount: number;
}

export interface ExportInvoicesParams {
	search?: string;
	invoiceDate?: string;
	status?: string;
	tab: "company" | "club";
	format?: "csv" | "excel";
}

// Helper function to format status
const formatStatus = (status: string): "Paid" | "Pending" | "Overdue" | "Cancelled" | "Rejected" | "Processed" => {
	switch (status.toUpperCase()) {
		case "PAID":
			return "Paid";
		case "PENDING":
			return "Pending";
		case "OVERDUE":
			return "Overdue";
		case "CANCELLED":
			return "Cancelled";
		case "REJECTED":
			return "Rejected";
		case "PROCESSED":
			return "Processed";
		default:
			return "Pending";
	}
};

// Backend response types
interface HireInvoiceResponse {
	id: string;
	playerName: string;
	playerEmail: string;
	companyName: string;
	companyId: string;
	clubName: string;
	clubId: string;
	clubAvatar: string;
	invoiceCode: string;
	invoiceId: string;
	amount: number;
	invoiceDate: string;
	status: string;
}

interface InvoiceStatsResponse {
	paidCount: number;
	pendingCount: number;
	totalCount: number;
}


const fetchCompanyInvoices = async (
	params: InvoiceQueryParams
): Promise<PaginatedServerResponse<HireInvoice>> => {
	try {
		const response = await apiAxiosInstance.get<
			ApiSuccessResponse<{
				hasData: true;
				data: {
					data: HireInvoiceResponse[];
					meta: {
						total: number;
						totalPages: number;
						page: number;
						limit: number;
					};
				};
			}>
		>("/admin/invoices", {
			params: {
				page: params.page,
				limit: params.limit,
				search: params.search,
				status: params.status && params.status !== "all" ? params.status : undefined,
				tab: "company",
			},
		});

		const invoicesData = response.data.data.data;
		const meta = response.data.data.meta;

		return {
			data: invoicesData.map((item) => ({
				id: item.id,
				name: item.playerName,
				companyName: item.companyName,
				club: item.clubName,
				invoiceId: item.invoiceCode,
				amount: item.amount,
				dateTime: item.invoiceDate,
			})),
			meta,
		};
	} catch (error) {
		console.error("Error fetching company invoices:", error);
		throw error;
	}
};

const fetchClubInvoices = async (
	params: InvoiceQueryParams
): Promise<PaginatedServerResponse<WithdrawalInvoice>> => {
	try {
		const response = await apiAxiosInstance.get<
			ApiSuccessResponse<{
				hasData: true;
				data: {
					data: HireInvoiceResponse[];
					meta: {
						total: number;
						totalPages: number;
						page: number;
						limit: number;
					};
				};
			}>
		>("/admin/invoices", {
			params: {
				page: params.page,
				limit: params.limit,
				search: params.search,
				status: params.status && params.status !== "all" ? params.status : undefined,
				tab: "club",
			},
		});

		const invoicesData = response.data.data.data;
		const meta = response.data.data.meta;

		return {
			data: invoicesData.map((item) => ({
				id: item.id,
				invoiceId: item.invoiceCode,
				club: item.clubName,
				clubAvatar: item.clubAvatar,
				amount: item.amount,
				status: formatStatus(item.status),
			})),
			meta,
		};
	} catch (error) {
		console.error("Error fetching club invoices:", error);
		throw error;
	}
};

const fetchInvoiceStats = async (
	tab: "company" | "club"
): Promise<InvoiceStats> => {
	try {
		const response = await apiAxiosInstance.get<
			ApiSuccessResponse<{
				hasData: true;
				data: InvoiceStatsResponse;
			}>
		>("/admin/invoices/stats", {
			params: { tab },
		});

		return response.data.data;
	} catch (error) {
		console.error("Error fetching invoice stats:", error);
		// Fallback to dummy data
		return {
			paidCount: 50,
			pendingCount: 12,
			totalCount: 62,
		};
	}
};

const exportInvoices = async (
	params: ExportInvoicesParams
): Promise<HireInvoice[]> => {
	try {
		const response = await apiAxiosInstance.get<
			ApiSuccessResponse<{
				hasData: true;
				data: HireInvoiceResponse[];
			}>
		>("/admin/invoices/export", {
			params,
		});

		const invoicesData = response.data.data;

		return invoicesData.map((item) => ({
			id: item.id,
			name: item.playerName,
			companyName: item.companyName,
			club: item.clubName,
			clubAvatar: item.clubAvatar,
			invoiceId: item.invoiceCode,
			amount: item.amount,
			dateTime: item.invoiceDate,
		}));
	} catch (error) {
		console.error("Error exporting invoices:", error);
		throw error;
	}
};

const updateWithdrawalStatus = async (
	invoiceId: string,
	status: string
): Promise<void> => {
	try {
		await apiAxiosInstance.patch(
			`/admin/invoices/${invoiceId}/status`,
			{ status }
		);
	} catch (error) {
		console.error("Error updating withdrawal status:", error);
		throw error;
	}
};

export const invoiceManagementQueries = {
	all: () => ["invoice-management"] as const,
	
	company: (params: InvoiceQueryParams) =>
		queryOptions({
			queryKey: [...invoiceManagementQueries.all(), "company", params] as const,
			queryFn: () => fetchCompanyInvoices(params),
		}),
	
	club: (params: InvoiceQueryParams) =>
		queryOptions({
			queryKey: [...invoiceManagementQueries.all(), "club", params] as const,
			queryFn: () => fetchClubInvoices(params),
		}),
	
	stats: (tab: "company" | "club") =>
		queryOptions({
			queryKey: [...invoiceManagementQueries.all(), "stats", tab] as const,
			queryFn: () => fetchInvoiceStats(tab),
		}),
};

// Export functions (not queries since they're one-time actions)
export const exportInvoicesData = exportInvoices;
export const updateWithdrawalStatusData = updateWithdrawalStatus;

