/** @format */

import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import {
	StatusCell,
	StatusStylesString,
} from "@/components/common/data-table/application-status-cell";
import { TableDateCell } from "@/components/common/data-table/date-cell";
import { TruncatedNumberCell } from "@/components/common/data-table/truncated-number-cell";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { createColumnConfigHelper } from "@/components/data-table-filter/core/filters";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOptimisticMutation } from "@/hooks/use-optimistic-mutation";
import apiAxiosInstance from "@/lib/axios-instance";
import { getPathDominantItem } from "@/lib/helper-functions/generic-string-helpers";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { BazzaQueryFilters, FilterColumnConfig } from "@/types/tanstack-table";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarArrowUpIcon, Info, MoreHorizontal } from "lucide-react";
import React, { FC } from "react";
import { toast } from "sonner";
import { PostedJob } from "../job-posted/columns";
import { useDraftedJobsTableConfig } from "./data-table";
import { EditJobForm } from "./edit-job-form";

export interface DraftedJob extends SafeOmit<PostedJob, "status"> {
	draftOrigin: "never_posted" | "from_posted";
	draftedAt: string;
}

const useDeleteJob = () => {
	const { queryOptions } = useDraftedJobsTableConfig();
	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (job: DraftedJob) => {
			await apiAxiosInstance.delete(`/jobs/${job.id}`);
		},
		updater: (old, job) => {
			if (!old) return old;

			return {
				...old,
				data: old.data.filter((prevJob) => prevJob.id !== job.id),
			};
		},
		onSuccess: (_, job) => {
			toast.success(`Successfully deleted job, ${job.title}.`);
		},
		onError: (error, job) => {
			toast.error(`Failed to delete job, ${job.title}.`, {
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

const usePostDraftedJob = () => {
	const { queryOptions } = useDraftedJobsTableConfig();
	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (job: DraftedJob) => {
			await apiAxiosInstance.patch(`/jobs/${job.id}`, {
				status: "ACTIVE",
			});
		},
		updater: (old, job) => {
			if (!old) return old;
			return {
				...old,
				data: old.data.filter((prevJob) => prevJob.id !== job.id),
			};
		},
		onSuccess: (_, job) => {
			toast.success(`Successfully posted job, ${job.title}.`);
		},
		onError: (error, job) => {
			toast.error(`Error occurred posting job, ${job.title}.`, {
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface RowActionsProps {
	job: DraftedJob;
}

const RowActions: FC<RowActionsProps> = ({ job }) => {
	const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
	const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

	const { mutate: deleteJob, isPending: isDeletePending } = useDeleteJob();
	const { mutate: postJob, isPending: isPostingJob } = usePostDraftedJob();

	return (
		<>
			{/* The main dropdown menu and edit dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DialogTrigger asChild>
							<DropdownMenuItem>Edit</DropdownMenuItem>
						</DialogTrigger>
						<DropdownMenuItem
							onClick={() => setIsConfirmingDelete(true)}
							disabled={isDeletePending}>
							Delete
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => postJob(job)}
							disabled={isPostingJob}>
							Post
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<DialogContent className="mt-2 max-w-4xl">
					<ScrollArea className="max-h-[60dvh] pr-4 h-xs:max-h-[80dvh]">
						<DialogHeader className="sticky mb-4">
							<DialogTitle>Edit job, {job.title}.</DialogTitle>
							<DialogDescription className="sr-only">
								Edit job dialog
							</DialogDescription>
						</DialogHeader>

						<EditJobForm
							job={job}
							onFinishEditting={() => setIsEditDialogOpen(false)}
						/>
					</ScrollArea>
				</DialogContent>
			</Dialog>

			{/* The separate critical action confirmation dialog for deletion */}
			<CriticalActionConfirmationDialog
				open={isConfirmingDelete}
				onOpenChange={setIsConfirmingDelete}
				title="Delete Job"
				description={`Are you sure you want to permanently delete the job "${job.title}"? This action cannot be undone.`}
				confirmText="delete"
				confirmButtonText="Delete"
				onConfirm={() => deleteJob(job)}
			/>
		</>
	);
};

interface DraftedJobOriginProps {
	draftOrigin: DraftedJob["draftOrigin"];
}
const DraftedJobOrigin: React.FC<DraftedJobOriginProps> = ({ draftOrigin }) => {
	const statusStylesMap = {
		from_posted: "status-blue",
		never_posted: "status-gray",
	} satisfies Record<typeof draftOrigin, StatusStylesString>;

	return (
		<StatusCell
			status={draftOrigin}
			getStatusStyles={(status) => statusStylesMap[status]}
		/>
	);
};

export const columns: ColumnDef<DraftedJob>[] = [
	{
		accessorKey: "title",
		header: "Job Title",
		cell: ({ row }) => <TruncatedTextCell value={row.original.title} />,
	},
	{
		accessorKey: "role",
		header: "Role",
		cell: ({ row }) => (
			<TruncatedTextCell value={getPathDominantItem(row.original.role)} />
		),
	},
	{
		accessorKey: "applicants",
		header: "Applications",
		cell: ({ row }) => (
			<TruncatedNumberCell value={row.original.applicants} />
		),
	},
	{
		accessorKey: "draftOrigin",
		header: "Draft Origin",
		cell: ({ row }) => (
			<DraftedJobOrigin draftOrigin={row.original.draftOrigin} />
		),
	},
	{
		accessorKey: "createdAt",
		header: "Date Created",
		cell: ({ row }) => <TableDateCell date={row.original.createdAt} />,
	},
	{
		accessorKey: "draftedAt",
		header: "Date Drafted",
		cell: ({ row }) => <TableDateCell date={row.original.draftedAt} />,
	},
	{
		id: "actions",
		cell: ({ row }) => <RowActions job={row.original} />,
	},
];

const dtf = createColumnConfigHelper<DraftedJob>();

export const filters = [
	dtf
		.option()
		.id("draftOrigin")
		.accessor((row) => row.draftOrigin)
		.displayName("Draft origin")
		.options(
			(
				[
					"from_posted",
					"never_posted",
				] satisfies DraftedJob["draftOrigin"][]
			).map((value) => ({
				value,
				label: "", // the icon already has the label
				icon: <DraftedJobOrigin draftOrigin={value} />,
			})),
		)
		.icon(Info)
		.build(),
	dtf
		.date()
		.id("draftedAt")
		.accessor((row) => row.draftedAt)
		.displayName("Date drafted")
		.icon(CalendarArrowUpIcon)
		.build(),
] satisfies FilterColumnConfig<DraftedJob>[];

export type DraftedJobsColumnFilters = BazzaQueryFilters<typeof filters>;
