/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { AxiosApiError } from "@/lib/axios-instance/types";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { BaseJob } from "./types";

export const bookmarkJobMutationFn = async (jobId: string) => {
	await apiAxiosInstance.post("/jobs/bookmarks/" + jobId);
};

interface HandleBookmarkJobOnSuccessProps<TData extends BaseJob> {
	job: TData;
}
export const handleBookmarkJobOnSuccess = <TData extends BaseJob>({
	job,
}: HandleBookmarkJobOnSuccessProps<TData>) => {
	const title = job.title;
	toast.success(
		`${
			job.isBookmarked
				? `${title} removed from Bookmarks`
				: `${title} bookmarked`
		} successfully!`,
		{
			id: job.id + "bookmark-success",
		},
	);
};

interface HandleBookmarkJobOnErrorProps<TData extends BaseJob> {
	job: TData;
	error: AxiosApiError;
}
export const handleBookmarkJobOnError = <TData extends BaseJob>({
	job,
	error,
}: HandleBookmarkJobOnErrorProps<TData>) => {
	const title = job.title;
	toast.error(
		`Failed to ${
			job.isBookmarked
				? `remove ${title} from Bookmarks`
				: `bookmark ${title}`
		}`,
		{
			description: getErrorMessage(error),
			id: job.id + "bookmark-error",
		},
	);
};
