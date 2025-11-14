/** @format */

import {
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";

import { DataTableSimple } from "@/components/common/data-table/data-table.tsx";
import { FC, useState } from "react";
import { href } from "react-router";
import { FooterButton } from "../../components/footer-button.tsx";
import { ExportButton } from "../export-button.tsx";
import { columns, NewClub } from "./columns.tsx";

interface DataTableProps {
	data: NewClub[];
}

export const NewClubsTable: FC<DataTableProps> = ({ data }) => {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onGlobalFilterChange: setGlobalFilter,
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: "includesString",
		state: {
			sorting,
			globalFilter,
		},
	});

	return (
		<div className="space-y-4 flex flex-col not-first:text-red-500">
			<ExportButton className="block ml-auto" />

			<DataTableSimple table={table} />

			<FooterButton
				className="block ml-auto"
				to={href("/company-management")}>
				See all
			</FooterButton>
		</div>
	);
};
