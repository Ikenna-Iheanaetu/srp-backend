/** @format */

import { JobApplicationStatus } from "@/routes/main/routes/jobs/constants";
import { cn } from "../utils";

interface StatusMap {
	applied: "orange";
	under_review: "yellow";
	rejected: "red";
	not_applied: "gray";
	shortlisted: "green";
}

type InferReturnType<T extends JobApplicationStatus> = `status-${StatusMap[T]}`;

export const getJobApplicationStatusStyles = <T extends JobApplicationStatus>(
	status: T
): InferReturnType<T> => {
	const statusLowerCase = status.toLowerCase() as T;

	return cn({
		"status-gray": statusLowerCase === "not_applied",
		"status-yellow": statusLowerCase === "under_review",
		"status-red": statusLowerCase === "rejected",
		"status-orange": statusLowerCase === "shortlisted",
		"status-green": statusLowerCase === "applied",
	}) as InferReturnType<T>;
};
