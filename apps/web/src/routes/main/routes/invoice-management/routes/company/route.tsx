/** @format */

import { FC, useState } from "react";
import { exportInvoicesData } from "../../query-factory";
import { HireInvoicesTable } from "../../components/hire-invoices/data-table";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Download, ChevronDown } from "lucide-react";
import { exportToCSV, exportToExcel } from "../../utils/export-utils";
import { toast } from "sonner";
import { parseAsString, useQueryState } from "nuqs";

const CompanyInvoicesRoute: FC = () => {
	const [isExporting, setIsExporting] = useState(false);
	const [search] = useQueryState("search", parseAsString.withDefault(""));
	const [status] = useQueryState("status", parseAsString.withDefault("all"));

	const handleExport = async (format: "csv" | "excel") => {
		setIsExporting(true);
		try {
			// Fetch ALL data for export (no pagination)
			const allData = await exportInvoicesData({
				tab: "company",
				search: search || undefined,
				status: status !== "all" ? status : undefined,
				format,
			});

			// Define header mappings for better column names
			const headers = {
				id: "ID",
				name: "Player Name",
				companyName: "Company Name",
				club: "Club Name",
				clubAvatar: "Club Avatar",
				invoiceId: "Invoice ID",
				amount: "Amount (30% of total)",
				dateTime: "Invoice Date",
			};

			const filename = `company-invoices-${new Date().toISOString().split("T")[0]}`;
			const dataToExport = allData.map(item => ({ ...item })) as Record<string, unknown>[];

			if (format === "csv") {
				exportToCSV(dataToExport, `${filename}.csv`, headers);
			} else {
				exportToExcel(dataToExport, `${filename}.xlsx`, headers);
			}

			toast.success("Export Successful", {
				description: `${allData.length} invoices exported as ${format.toUpperCase()}`,
			});
		} catch (error: unknown) {
			console.error("Export failed:", error);
			toast.error("Export Failed", {
				description: "Failed to export invoices. Please try again.",
			});
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="space-y-4 md:space-y-6 w-full">
			{/* Header with Title and Export */}
			<div className="bg-white rounded-lg p-4 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<h2 className="text-lg md:text-xl font-semibold text-gray-900">
					Hire Invoice
				</h2>

				<div className="flex items-center gap-2 sm:gap-3">
					{/* Export Dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								disabled={isExporting}
								className="bg-white border-gray-200 hover:bg-gray-50 flex-1 sm:flex-none">
								<Download className="mr-2 h-4 w-4" />
								{isExporting ? "Exporting..." : "Export"}
								<ChevronDown className="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[180px]">
							<DropdownMenuLabel>Export Format</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => void handleExport("csv")}
								disabled={isExporting}
								className="cursor-pointer">
								<Download className="mr-2 h-4 w-4" />
								Export as CSV
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => void handleExport("excel")}
								disabled={isExporting}
								className="cursor-pointer">
								<Download className="mr-2 h-4 w-4" />
								Export as Excel
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<HireInvoicesTable />
		</div>
	);
};

export default CompanyInvoicesRoute;
