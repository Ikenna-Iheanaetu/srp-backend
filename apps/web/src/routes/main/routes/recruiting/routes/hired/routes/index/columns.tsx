/** @format */

import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import {
	StackedAvatarItem,
	StackedAvatars,
} from "@/components/common/stacked-avatars";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getJobActiveStatusStyles } from "@/lib/helper-functions/get-job-active-status-styles";
import { cn } from "@/lib/utils";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { JobPosting } from "@/routes/main/routes/job-management/utils/types";
import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical } from "lucide-react";
import React, { FC } from "react";
import { href, useNavigate } from "react-router";
import { useRemoveJob } from "./use-remove-job";

export interface HiredJob extends JobPosting {
	hiredCount: number;
	hiredAvatars: string[];
}

interface RowActionsProps {
	job: HiredJob;
}

const RowActions: FC<RowActionsProps> = ({ job }) => {
	const { mutate: deleteJob, isPending } = useRemoveJob();
	const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

	const navigate = useNavigate();
	const onViewCandidates = () => {
		const path = href("/recruiting/hired/:id", {
			id: job.id,
		});
		void navigate(path, {
			state: {
				crumbs: [
					{
						path: href("/recruiting/hired"),
						label: "Shortlisted jobs",
					},
					{
						path,
						label: `Shortlisted Candidates for ${job.title}`,
					},
				],
			} satisfies CrumbsLocationState,
		});
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button type="button" variant={"secondary"} size={"icon"}>
						<EllipsisVertical />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem onClick={onViewCandidates}>
						Candidates
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={() => setIsConfirmingDelete(true)}
						disabled={isPending}>
						Delete list
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<CriticalActionConfirmationDialog
				open={isConfirmingDelete}
				onOpenChange={setIsConfirmingDelete}
				title="Delete Job List"
				description={`Are you sure you want to delete the job list for "${job.title}"? This action cannot be undone.`}
				confirmText="delete"
				confirmButtonText="Delete"
				onConfirm={() => deleteJob(job)}
			/>
		</>
	);
};

export const columns: ColumnDef<HiredJob>[] = [
	{
		header: "Job Title",
		accessorKey: "title",
		cell: ({ row }) => {
			const title = row.original.title;
			return <div className="w-max max-w-28">{title}</div>;
		},
	},
	{
		header: "Count",
		accessorKey: "hiredCount",
		cell: ({ row }) => {
			const count = row.original.hiredCount;
			return <div>{count}</div>;
		},
	},
	{
		header: "Status",
		accessorKey: "status",
		cell: ({ row }) => {
			const status = row.original.status;
			return (
				<div className={cn(getJobActiveStatusStyles(status))}>
					{status}
				</div>
			);
		},
	},
	{
		header: "Candidates",
		accessorKey: "hiredAvatars",
		cell: ({ row }) => {
			const avatars = row.original.hiredAvatars.map((src) => ({
				src,
			})) satisfies StackedAvatarItem[];

			return <StackedAvatars avatars={avatars} />;
		},
	},
	{
		header: "Actions",
		id: "actions",
		cell: ({ row }) => {
			return <RowActions job={row.original} />;
		},
	},
];
