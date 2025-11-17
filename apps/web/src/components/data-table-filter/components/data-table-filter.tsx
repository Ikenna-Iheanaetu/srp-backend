/** @format */

import { useIsMobile } from "@/hooks/use-mobile";
import type {
	Column,
	DataTableFilterActions,
	FilterStrategy,
	FiltersState,
} from "../core/types";
import { ActiveFilters, ActiveFiltersMobileContainer } from "./active-filters";
import { FilterActions } from "./filter-actions";
import { FilterSelector } from "./filter-selector";

export interface DataTableFilterProps<TData> {
	columns: Column<TData>[];
	filters: FiltersState;
	actions: DataTableFilterActions;
	strategy: FilterStrategy;
}

export function DataTableFilter<TData>({
	columns,
	filters,
	actions,
	strategy,
}: DataTableFilterProps<TData>) {
	const isMobile = useIsMobile();

	return (
		<div className="flex flex-wrap w-full items-start gap-2">
			<div className="flex gap-1">
				<FilterSelector
					columns={columns}
					filters={filters}
					actions={actions}
					strategy={strategy}
				/>
				<FilterActions
					hasFilters={filters.length > 0}
					actions={actions}
				/>
			</div>
			{(() => {
				const activeFilters = (
					<ActiveFilters
						columns={columns}
						filters={filters}
						actions={actions}
						strategy={strategy}
					/>
				);

				if (isMobile) {
					return (
						<div className="grid grid-cols-1">
							<ActiveFiltersMobileContainer>
								{activeFilters}
							</ActiveFiltersMobileContainer>
						</div>
					);
				}

				return activeFilters;
			})()}
		</div>
	);
}
