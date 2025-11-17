/** @format */

import {
	DebouncedInputNative,
	DebouncedInputPropsNative,
} from "@/components/common/debounced-input";
import {
	PaginationControls,
	PaginationControlsProps,
} from "@/components/common/pagination-controls";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

interface CardsListBaseProps {
	className?: string;
	children: React.ReactNode;
}

const SearchableUserCardsList: React.FC<CardsListBaseProps> = ({
	children,
	className,
}) => <div className={cn("flex flex-col gap-4", className)}>{children}</div>;

const ListHeader: React.FC<CardsListBaseProps> = ({ children, className }) => (
	<div className={cn("flex flex-wrap items-center gap-6", className)}>
		{children}
	</div>
);

type SearchInputProps = RequireKeys<
	DebouncedInputPropsNative,
	"value" | "onChange"
>;
const SearchInput: React.FC<SearchInputProps> = ({
	placeholder = "Search user's list",
	className,
	...props
}) => (
	<DebouncedInputNative
		{...props}
		placeholder={placeholder}
		className={cn("max-w-[566px] flex-1", className)}
	/>
);

interface FilterControlsContextType {
	isFiltersShown: boolean;
	setIsFiltersShown: React.Dispatch<React.SetStateAction<boolean>>;
	onClearFilters: () => void;
	isFiltered: boolean;
}

const FilterControlsContext =
	React.createContext<FilterControlsContextType | null>(null);

const useFilterControlsContext = () => {
	const context = React.use(FilterControlsContext);
	if (!context) {
		throw new Error(
			"useFilterControlsContext must be used within a FilterControlsContext provider.",
		);
	}
	return context;
};

type FilterControlsProps = CardsListBaseProps &
	Pick<FilterControlsContextType, "onClearFilters" | "isFiltered">;
const FilterControls: React.FC<FilterControlsProps> = ({
	children,
	className,
	onClearFilters,
	isFiltered,
}) => {
	const [isFiltersShown, setIsFiltersShown] = React.useState(false);

	const contextValue: FilterControlsContextType = React.useMemo(
		() => ({
			isFiltersShown,
			setIsFiltersShown,
			onClearFilters,
			isFiltered,
		}),
		[isFiltered, isFiltersShown, onClearFilters],
	);

	return (
		<FilterControlsContext value={contextValue}>
			<div className={cn("flex flex-col gap-8 *:w-fit", className)}>
				{children}
			</div>
		</FilterControlsContext>
	);
};

interface FiltersBlockProps {
	className?: string;
	children?: React.ReactNode;
}
const FiltersBlock: React.FC<FiltersBlockProps> = ({ className, children }) => {
	const { isFiltersShown } = useFilterControlsContext();

	if (!isFiltersShown) {
		return null;
	}

	return (
		<div className={cn("flex flex-wrap gap-6", className)}>{children}</div>
	);
};

interface FiltersResetButtonProps extends SafeOmit<ButtonProps, "children"> {
	className?: string;
	children?: React.ReactNode;
}
const FiltersResetButton: React.FC<FiltersResetButtonProps> = ({
	children,
	variant = "secondary",
	onClick,
	...props
}) => {
	const { isFiltered, onClearFilters } = useFilterControlsContext();

	return (
		isFiltered && (
			<Button
				{...props}
				variant={variant}
				onClick={(e) => {
					onClearFilters();
					onClick?.(e);
				}}>
				{children}
			</Button>
		)
	);
};

interface FiltersVisibilityButtonProps {
	className?: string;
	children: (isFiltersShown: boolean) => React.ReactNode;
}
const FiltersVisibilityButton: React.FC<FiltersVisibilityButtonProps> = ({
	className,
	children,
}) => {
	const { isFiltersShown, setIsFiltersShown } = useFilterControlsContext();

	return (
		<Button
			type="button"
			variant={"secondary"}
			onClick={() => setIsFiltersShown((prev) => !prev)}
			className={cn(className)}>
			{children(isFiltersShown)}
		</Button>
	);
};

interface ListContentState {
	/**
	 * True if the initial data is being fetched.
	 */
	isLoadingList: boolean;

	/**
	 * True if placeholder data is currently being displayed while new data is
	 * being fetched in the background (e.g., from a refetch).
	 *
	 * This is typically derived from `queryResult.isPlaceholderData && queryResult.isFetching`.
	 */
	isRefetchingFreshData: boolean;

	/**
	 * True if there are no items after loading and filtering/searching, and no error occurred.
	 *
	 * This is typically derived from `queryResult.isSuccess && (!queryResult.data || !queryResult.data?.length // if an array
	 * )`.
	 */
	hasNoResults: boolean;

	/**
	 * The actual Error object if an error occurred specifically during the
	 * initial list data fetch, otherwise null.
	 * This would be derived from `!queryResult.isSuccess &&  queryResult.error ? queryResult.error : null `.
	 */
	initialLoadingError: Error | null;
}

const ListContentStateContext = React.createContext<ListContentState | null>(
	null,
);

const useListContentState = () => {
	const context = React.use(ListContentStateContext);
	if (!context) {
		throw new Error(
			"useListContentState must be used within a ListContentStateContext provider.",
		);
	}
	return context;
};

interface ListContentProps extends CardsListBaseProps {
	contentState: ListContentState;
}

const ListContent_: React.FC<ListContentProps> = ({
	children,
	className,
	contentState,
}) => {
	return (
		<ListContentStateContext value={contentState}>
			<div
				className={cn(
					"relative h-[calc(100dvh-300px)] w-full overflow-auto tw-scrollbar",
					className,
				)}>
				{children}
			</div>
		</ListContentStateContext>
	);
};
const ListContent = React.memo(ListContent_) as typeof ListContent_;

/** Should display a visual cue (like a spinner or skeleton) when the list is initially being fetched. */
const ListLoadingIndicator: React.FC<CardsListBaseProps> = ({
	className,
	children,
}) => {
	const { isLoadingList } = useListContentState();

	if (!isLoadingList) {
		return null;
	}

	return (
		<div className={cn("flex items-center justify-center p-4", className)}>
			{children}
		</div>
	);
};

interface ListLoadingErrorMessageProps {
	className?: string;
	children: (error: Error) => React.ReactNode;
}
const ListLoadingErrorMessage: React.FC<ListLoadingErrorMessageProps> = ({
	className,
	children,
}) => {
	const { initialLoadingError } = useListContentState();
	if (!initialLoadingError) {
		return null;
	}

	return (
		<div
			className={cn(
				"col-span-full flex items-center justify-center p-8 text-center text-red-500",
				className,
			)}>
			{children(initialLoadingError)}
		</div>
	);
};

const ListCardsGrid: React.FC<CardsListBaseProps> = ({
	className,
	children,
}) => {
	const { isRefetchingFreshData } = useListContentState();

	return (
		<div
			className={cn(
				"grid w-full grid-cols-1 place-items-center justify-evenly gap-4 px-2 sm:grid-cols-2 xl:grid-cols-3",
				isRefetchingFreshData && "animate-pulse",
				className,
			)}>
			{children}
		</div>
	);
};

interface NoResultsMessageProps {
	title?: React.ReactNode;
	description?: React.ReactNode;
	className?: string;
}

const ListNoResultsMessage: React.FC<NoResultsMessageProps> = ({
	title = "No results found",
	description = "Try adjusting your filters or search terms to see more results.",
	className,
}) => {
	const { hasNoResults } = useListContentState();

	if (!hasNoResults) {
		return null;
	}

	return (
		<div
			className={cn(
				"col-span-full flex items-center justify-center p-8 text-center",
				className,
			)}>
			<div className="max-w-md">
				<h3 className="mb-2 text-lg font-medium">{title}</h3>
				<p className="text-muted-foreground">{description}</p>
			</div>
		</div>
	);
};

const ListCard: React.FC<CardsListBaseProps> = ({ className, children }) => {
	const { isLoadingList, initialLoadingError } = useListContentState();

	if (isLoadingList || initialLoadingError) {
		return null;
	}

	return (
		<div
			className={cn(
				"w-full max-w-96 space-y-4 rounded-xl bg-slate-100 p-2 pb-4",
				className,
			)}>
			{children}
		</div>
	);
};

const ListProfileCard: React.FC<CardsListBaseProps> = ({
	children,
	className,
}) => <div className={cn(className)}>{children}</div>;

const ListCardActions: React.FC<CardsListBaseProps> = ({
	children,
	className,
}) => (
	<div
		className={cn(
			"flex w-full items-center justify-evenly gap-6",
			className,
		)}>
		{children}
	</div>
);

type ListPaginationProps = SafeOmit<PaginationControlsProps, "isFetching">;
const ListPagination: React.FC<ListPaginationProps> = (props) => {
	return <PaginationControls {...props} />;
};

export {
	// Main List Component
	SearchableUserCardsList,

	// Header Components
	ListHeader,
	/**@deprecated Use the {@link ListHeader} export instead. */
	ListHeader as Header,
	SearchInput,
	FilterControls,
	FiltersBlock,
	FiltersVisibilityButton,
	FiltersResetButton,
	useFilterControlsContext,

	// Content Components
	ListContent,
	ListLoadingIndicator,
	ListCardsGrid,
	ListNoResultsMessage,
	ListLoadingErrorMessage,
	useListContentState,

	// Card Components
	ListCard,
	ListProfileCard,
	ListCardActions,

	// Pagination Component
	ListPagination,
};

export type {
	CardsListBaseProps,
	SearchInputProps,
	FilterControlsContextType,
	FilterControlsProps,
	FiltersBlockProps,
	FiltersVisibilityButtonProps,
	FiltersResetButtonProps,
	ListContentState,
	/**@deprecated Use the {@link ListContentState} export instead. */
	ListContentState as ListContentStateContextType,
	ListContentProps,
	NoResultsMessageProps,
	ListPaginationProps,
	ListLoadingErrorMessageProps,
};
