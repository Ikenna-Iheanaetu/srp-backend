/** @format */

// hooks/use-table-navigation.ts
import {
	DataTableAdvancedProps,
	DataTableRow,
} from "@/components/common/data-table/data-table";
import React from "react";
import { useNavigate } from "react-router";
import { ColumnDef, Row } from "@tanstack/react-table";

type ColumnsDefWithNavigation<TData> = (
	onView: (row: Row<TData>) => void
) => ColumnDef<TData>[];

/**Callback that returns the navigation path for the {@link UseTableNavigation}
 * hook.
 */
type GetPathHandler<TData> = (row: Row<TData>) => string;

interface UseTableNavigationProps<TData> {
	/**
	 * **NOTE**: Ensure this function is a stable reference to avoid heavy
	 * rerenders.
	 *
	 * Returns the complete navigation path for a row's details.
	 * This path is used for both the row double-click and the onView column
	 * cell navigation actions.
	 * The caller handles path construction (e.g., using the `href` util).
	 */
	getPath: GetPathHandler<TData>;
	/**
	 * A factory function that accepts an `onView` handler (for the cell
	 * navigation action) and returns the table's column definitions.
	 */
	columnsDef: ColumnsDefWithNavigation<TData>;
}

/**
 * Provides `renderRow` for table-wide double-click navigation and
 * `tableColumnsDef` with an integrated `onView` handler for column navigation.
 * Both mechanisms navigate to the same target path for a given row.
 *
 * Only use this when you have a table that has both a row double-click and
 * cell on-click same path navigations.
 */
const useTableNavigation = <TData,>({
	getPath,
	columnsDef,
}: UseTableNavigationProps<TData>) => {
	const navigate = useNavigate();

	const handleOnNavigate = React.useCallback(
		(row: Row<TData>) => {
			const path = getPath(row);
			void navigate(path);
		},
		[getPath, navigate]
	);

	const renderRow: NonNullable<DataTableAdvancedProps<TData>["renderRow"]> =
		React.useCallback(
			(row: Row<TData>) => (
				<DataTableRow
					row={row}
					onDoubleClick={() => handleOnNavigate(row)}
				/>
			),
			[handleOnNavigate]
		);

	const tableColumnsDef = React.useMemo(
		() => columnsDef(handleOnNavigate),
		[columnsDef, handleOnNavigate]
	);

	return React.useMemo(
		() => ({ renderRow, tableColumnsDef }),
		[renderRow, tableColumnsDef]
	);
};

export { useTableNavigation };

export type {
	UseTableNavigationProps,
	ColumnsDefWithNavigation,
	GetPathHandler,
};
