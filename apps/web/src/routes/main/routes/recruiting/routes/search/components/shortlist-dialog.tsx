/** @format */

import { CheckboxStyled } from "@/components/common/checkbox-styled";
import LoadingIndicator from "@/components/common/loading-indicator";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { useCallback, useState } from "react";
import { ServerCandidateResponse } from "../query-factory";
import { useInfiniteJobs } from "../use-infinite-posted-jobs";
import { useShortlistCandidate } from "../use-shortlist-candidate";
import { LoadMore } from "./load-more-button";

interface ShortlistDialogProps {
	candidate: ServerCandidateResponse;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ShortlistDialog({
	candidate,
	open,
	onOpenChange,
}: ShortlistDialogProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [commandOpen, setCommandOpen] = useState(false);
	const [selectedJobIds, setSelectedJobIds] = useState<string[]>(
		candidate.shortlistedJobs || [],
	);

	// Use your custom infinite jobs hook
	const { data, isLoading, isFetching, hasMore, loadMore } = useInfiniteJobs({
		search: searchQuery,
	});

	const jobs = data?.data ?? [];

	const { mutate: shortlistCandidate, isPending } = useShortlistCandidate();

	const handleToggleJob = useCallback((jobId: string) => {
		setSelectedJobIds((prev) =>
			prev.includes(jobId)
				? prev.filter((id) => id !== jobId)
				: [...prev, jobId],
		);
	}, []);

	const handleSubmit = useCallback(() => {
		if (selectedJobIds.length === 0) return;

		shortlistCandidate(
			{
				candidate,
				jobIds: selectedJobIds,
			},
			{
				onSuccess: () => {
					onOpenChange(false);
					setSelectedJobIds([]);
				},
			},
		);
	}, [candidate, onOpenChange, selectedJobIds, shortlistCandidate]);

	const handleCancel = useCallback(() => {
		onOpenChange(false);
		setSelectedJobIds([]);
	}, [onOpenChange]);

	// Reset state when dialog closes
	const handleOpenChange = useCallback(
		(newOpen: boolean) => {
			if (!newOpen) {
				setSelectedJobIds([]);
				setSearchQuery("");
			}
			onOpenChange(newOpen);
		},
		[onOpenChange],
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						Shortlist candidate - {candidate.name}
					</DialogTitle>
					<DialogDescription className="sr-only">
						Dialog to shortlist the selected candidate to posted
						jobs
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Popover
						open={commandOpen}
						onOpenChange={setCommandOpen}
						modal={commandOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={commandOpen}
								className="w-full justify-between">
								{selectedJobIds.length > 0
									? `${selectedJobIds.length} job${
											selectedJobIds.length > 1 ? "s" : ""
										} selected`
									: "Search or select from current posted jobs"}
								<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[400px] p-0">
							<Command>
								<CommandInput
									placeholder="Search posting job list"
									value={searchQuery}
									onValueChange={setSearchQuery}
								/>
								{isLoading && jobs.length === 0 ? (
									<div className="flex items-center justify-center py-6">
										<LoadingIndicator />
									</div>
								) : (
									<>
										<CommandEmpty>
											No jobs found.
										</CommandEmpty>
										<CommandGroup>
											<CommandList className="max-h-[300px] overflow-auto">
												{jobs.map((job) => {
													const isSelected =
														selectedJobIds.includes(
															job.id,
														);
													return (
														<CommandItem
															key={job.id}
															onSelect={() =>
																handleToggleJob(
																	job.id,
																)
															}
															className="flex items-center gap-2 px-2 py-1.5">
															<CheckboxStyled
																checked={
																	isSelected
																}
															/>
															<span>
																{job.title}
															</span>
														</CommandItem>
													);
												})}
												<LoadMore
													isLoading={isFetching}
													hasMorePages={hasMore}
													onLoadMore={loadMore}
												/>
											</CommandList>
										</CommandGroup>
									</>
								)}
							</Command>
						</PopoverContent>
					</Popover>

					<div className="relative my-2 w-full">
						{selectedJobIds.length === 0 && (
							<p className="absolute left-0 top-0 text-sm text-red-500">
								Please select at least one job.
							</p>
						)}
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						type="button"
						variant="outline"
						onClick={handleCancel}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isPending || selectedJobIds.length === 0}
						className="button">
						{isPending && <LoadingIndicator />}
						Add
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
