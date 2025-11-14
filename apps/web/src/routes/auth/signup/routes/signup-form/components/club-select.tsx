/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CommandLoading } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import React from "react";
import {
	AllClubsQueryParams,
	useAllClubsQuery,
} from "../hooks/use-all-clubs-query";
import { useSignupSearchParams } from "../hooks/use-signup-search-params";

interface ClubSelectProps {
	className?: string;
}

export const ClubSelect: React.FC<ClubSelectProps> = ({ className }) => {
	const [open, setOpen] = React.useState(false);
	const [search, setSearch] = React.useState("");

	const queryParams = React.useMemo(
		() => ({ search }) satisfies AllClubsQueryParams,
		[search],
	);

	const {
		data,
		hasNextPage,
		fetchNextPage,
		isLoading,
		isFetchingNextPage,
		isFetching,
	} = useAllClubsQuery({ params: queryParams });

	const fetchedClubs = data?.pages.flatMap((page) => page.data);

	const THRESHOLD_FROM_END = 5;
	const thresholdIndex = fetchedClubs
		? Math.max(0, fetchedClubs.length - THRESHOLD_FROM_END)
		: 0;
	const thresholdRef = (node: HTMLDivElement) => {
		const thresholdObserver = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry?.isIntersecting && hasNextPage && !isFetching) {
					void fetchNextPage();
				}
			},
			{ threshold: 0.1 },
		);

		thresholdObserver.observe(node);

		return () => {
			thresholdObserver.disconnect();
		};
	};

	const [{ refCode }, setSearchParams] = useSignupSearchParams();

	const selectedClub = React.useMemo(() => {
		return fetchedClubs?.find((club) => club.refCode === refCode);
	}, [fetchedClubs, refCode]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					type="button"
					aria-expanded={open}
					className={cn("w-[200px] justify-between", className)}>
					{selectedClub?.name ?? "Select club..."}
					<ChevronsUpDown />
				</Button>
			</PopoverTrigger>

			<PopoverContent className="w-[200px] p-0">
				<Command
					shouldFilter={
						false // server-side filtering
					}>
					<CommandInput
						placeholder="Search club..."
						className="h-9"
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList className="tw-scrollbar">
						{isLoading ? (
							<CommandLoading className="flex flex-col items-center justify-center gap-1">
								<span>Fetching clubs</span>
								<LoadingIndicator />
							</CommandLoading>
						) : (
							<CommandEmpty>No club found.</CommandEmpty>
						)}

						<CommandGroup className="tw-scrollbar">
							{fetchedClubs?.map((club, index) => {
								const isSelected = club.id === selectedClub?.id;

								return (
									<CommandItem
										key={club.id}
										ref={
											index === thresholdIndex
												? thresholdRef
												: undefined
										}
										value={club.name}
										onSelect={() => {
											void setSearchParams((prev) => ({
												...prev,
												refCode: isSelected
													? null
													: club.refCode,
											}));
											setOpen(false);
										}}>
										{club.name}
										<Check
											className={cn(
												"ml-auto",
												isSelected
													? "opacity-100"
													: "opacity-0",
											)}
										/>
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
			</PopoverContent>
		</Popover>
	);
};
