/** @format */

import { cn } from "@/lib/utils";
import React from "react";

interface TableSectionPartProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * The root container for a table section.
 * Use as the parent for TableSectionTitle, TableSectionDescription, and TableSectionContent.
 * @example
 * ```tsx
 * import { PostedJobsTable } from './data-table';
 *
 * export default function PostedJobsRoute() {
 * return (
 * <TableSectionRoot>
 * <TableSectionTitle>Posted Jobs</TableSectionTitle>
 * <TableSectionDescription>
 * This table holds data for jobs posted by your company, whether
 * active or in drafts.
 * </TableSectionDescription>
 *
 * <TableSectionContent>
 * <PostedJobsTable />
 * </TableSectionContent>
 * </TableSectionRoot>
 * );
 * }
 * ```
 */
const TableSection: React.FC<TableSectionPartProps> = ({
	children,
	className,
}) => {
	return <div className={cn("space-y-4", className)}>{children}</div>;
};

const TableSectionTitle: React.FC<TableSectionPartProps> = ({
	children,
	className,
}) => {
	return (
		<h2 className={cn("text-xl font-semibold", className)}>{children}</h2>
	);
};

const TableSectionDescription: React.FC<TableSectionPartProps> = ({
	children,
	className,
}) => {
	return <p className={cn(className)}>{children}</p>;
};

const TableSectionContent: React.FC<TableSectionPartProps> = ({
	children,
	className,
}) => {
	return <div className={cn(className)}>{children}</div>;
};

export {
	/**@deprecated Use {@link TableSection} export instead. */
	TableSection as TableSectionRoot,
	TableSection,
	TableSectionTitle,
	TableSectionDescription,
	TableSectionContent,
};

export type { TableSectionPartProps };
