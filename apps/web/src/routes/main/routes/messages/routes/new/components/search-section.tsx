/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { useDebounceCallback } from "@/hooks/use-debounce";
import { useInfiniteScrollTrigger } from "@/hooks/use-inifinite-trigger";
import { cn, getScrollFetchThresholdIndex } from "@/lib/utils";
import { CommandLoading } from "cmdk";
import { User } from "lucide-react";
import React from "react";
import { ChatRecipient } from "../../chat/types";
import { useRecipientsQuery } from "../hooks/use-recipients-query";

const OptimisticCommandInput: React.FC<
	React.ComponentProps<typeof CommandInput>
> = ({
	value: externalValue,
	onValueChange: externalOnValueChange,
	...props
}) => {
	// Local state for immediate UI feedback
	const [inputValue, setInputValue] = React.useState(externalValue);

	React.useEffect(() => {
		setInputValue(externalValue);
	}, [externalValue]);

	// Debounced version of the external update function
	const debouncedUpdate = useDebounceCallback(
		externalOnValueChange ?? (() => {}),
	);

	const handleInputChange = (value: string) => {
		setInputValue(value); // Immediately update the local input state for a responsive UI
		debouncedUpdate?.(value); // Call the debounced function with the new value
	};

	return (
		<CommandInput
			{...props}
			value={inputValue}
			onValueChange={handleInputChange}
		/>
	);
};

export interface SearchSectionProps {
	onSelectRecipient: (recipient: ChatRecipient) => void;
	className?: string;
}
export const SearchSection: React.FC<SearchSectionProps> = ({
	className,
	onSelectRecipient,
}) => {
	const { search, setSearch, recipients, queryResult } = useRecipientsQuery();

	const {
		hasNextPage,
		fetchNextPage,
		isLoading,
		isFetchingNextPage,
		isFetching,
		isPlaceholderData,
	} = queryResult;

	const isFetchingNewFilters = isFetching && isPlaceholderData;

	const thresholdIndex = getScrollFetchThresholdIndex(
		recipients?.length ?? 0,
	);
	const thresholdRef = useInfiniteScrollTrigger(
		hasNextPage,
		isFetching,
		() => void fetchNextPage(),
	);

	return (
		<Card className={cn("size-full", className)}>
			<CardHeader className="sr-only">
				<CardTitle>Search recipient to message</CardTitle>
				<CardDescription>
					Use the search input to search and select a recipient to
					start a conversation with.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Command
					className="rounded-none border-0"
					shouldFilter={
						false // server-side filtering
					}>
					<div className="my-4 rounded-xl border [&>div]:border-b-0">
						<OptimisticCommandInput
							autoFocus
							placeholder="Search by name"
							className="h-12 text-base"
							value={search}
							onValueChange={(value) => void setSearch(value)}
						/>
					</div>

					<CommandList
						className={cn(
							"tw-scrollbar",
							isFetchingNewFilters && "animate-pulse",
						)}>
						{isLoading ? (
							<CommandLoading className="flex flex-col items-center justify-center gap-1">
								<span>Fetching recipients</span>
								<LoadingIndicator />
							</CommandLoading>
						) : (
							<CommandEmpty>No recipients found.</CommandEmpty>
						)}
						<CommandGroup>
							{recipients?.map((company, index) => {
								return (
									<CommandItem
										key={company.id}
										ref={
											index === thresholdIndex
												? thresholdRef
												: undefined
										}
										value={company.name}
										aria-label={`Select company ${company.name}`}
										onSelect={() =>
											onSelectRecipient(company)
										}
										className="flex cursor-pointer items-center gap-3 p-3">
										<Avatar className="h-10 w-10">
											{company.avatar && (
												<AvatarImage
													src={company.avatar}
													alt={company.name}
												/>
											)}

											<AvatarFallback>
												<User />
											</AvatarFallback>
										</Avatar>

										<div className="min-w-0 flex-1">
											<p className="text-balance text-sm font-medium text-slate-800">
												{company.name}
											</p>
											<p className="text-balance text-xs font-medium text-slate-500">
												{company.location}
											</p>
										</div>
									</CommandItem>
								);
							})}

							{isFetchingNextPage && (
								<CommandLoading className="my-1">
									<LoadingIndicator />
								</CommandLoading>
							)}
						</CommandGroup>
					</CommandList>
				</Command>
			</CardContent>
		</Card>
	);
};
