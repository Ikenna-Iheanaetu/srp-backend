/** @format */

import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import {
	StatusCell,
	StatusStylesString,
} from "@/components/common/data-table/application-status-cell";
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
import dayjs from "dayjs";
import { CalendarArrowUpIcon, Info, MoreHorizontal } from "lucide-react";
import React, { FC } from "react";
import { toast } from "sonner";
import { NewJobFormData } from "../new-job/form-schema";
import { usePostedJobsTableConfig } from "./data-table";
import { EditJobForm } from "./edit-job-form";

export interface PostedJob extends NewJobFormData {
	id: string;
	status: "active" | "drafted";
	applicants: number;
	createdAt: string;
}

const useDeleteJob = () => {
	const { queryOptions } = usePostedJobsTableConfig();
	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (job: PostedJob) => {
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

const useDraftJob = () => {
	const { queryOptions } = usePostedJobsTableConfig();
	return useOptimisticMutation({
		queryKey: queryOptions.queryKey,
		mutationFn: async (job: PostedJob) => {
			await apiAxiosInstance.patch(`/jobs/${job.id}`, {
				status: "DRAFT",
			});
		},
		updater: (old, job) => {
			if (!old) return old;
			return {
				...old,
				data: old.data.map((prevJob) =>
					prevJob.id === job.id
						? {
								...job,
								status: "drafted" as const,
							}
						: prevJob,
				),
			};
		},
		onSuccess: (_, job) => {
			toast.success(`Successfully moved job, ${job.title}, to drafts.`);
		},
		onError: (error, job) => {
			toast.error(`Error occurred moving job, ${job.title}, to drafts.`, {
				description: getApiErrorMessage(error),
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};

interface RowActionsProps {
	job: PostedJob;
}

const RowActions: FC<RowActionsProps> = ({ job }) => {
	const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
	const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

	const { mutate: deleteJob, isPending: isDeletePending } = useDeleteJob();
	const { mutate: draftJob, isPending: isDraftingJob } = useDraftJob();

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
						{job.status === "active" && (
							<DropdownMenuItem
								onClick={() => draftJob(job)}
								disabled={isDraftingJob}
								title="Move job to drafts">
								Draft
							</DropdownMenuItem>
						)}
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
				description={`Are you sure you want to delete the job "${job.title}"? This action cannot be undone.`}
				confirmText="delete"
				confirmButtonText="Delete"
				onConfirm={() => deleteJob(job)}
			/>
		</>
	);
};

interface PostedJobStatusProps {
	status: PostedJob["status"];
}
const PostedJobStatus: React.FC<PostedJobStatusProps> = ({ status }) => {
	const statusStylesMap = {
		active: "status-green",
		drafted: "status-gray",
	} satisfies Record<typeof status, StatusStylesString>;

	return (
		<StatusCell
			status={status}
			getStatusStyles={(status) => statusStylesMap[status]}
		/>
	);
};

export const columns: ColumnDef<PostedJob>[] = [
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
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <PostedJobStatus status={row.original.status} />,
	},
	{
		accessorKey: "createdAt",
		header: "Date Posted",
		cell: ({ row }) => {
			const date = row.original.createdAt;
			return (
				<div className="flex items-center truncate pl-4">
					{dayjs(date).format("MM-DD-YYYY")}
				</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const job = row.original;

			return <RowActions job={job} />;
		},
	},
];

const dtf = createColumnConfigHelper<PostedJob>();

export const filters = [
	dtf
		.option()
		.id("status")
		.accessor((row) => row.status)
		.displayName("Status")
		.options(
			(["active", "drafted"] satisfies PostedJob["status"][]).map(
				(value) => ({
					value,
					label: "", // the icon already has the label
					icon: <PostedJobStatus status={value} />,
				}),
			),
		)
		.icon(Info)
		.build(),
	dtf
		.date()
		.id("createdAt")
		.accessor((row) => row.createdAt)
		.displayName("Date posted")
		.icon(CalendarArrowUpIcon)
		.build(),
] satisfies FilterColumnConfig<PostedJob>[];

export type PostedJobsColumnFilters = BazzaQueryFilters<typeof filters>;
