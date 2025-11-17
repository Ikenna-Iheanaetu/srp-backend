/** @format */

import { JobActiveStatus } from "@/routes/main/routes/jobs/constants";
import { cn } from "../utils";

// Define available colors
type Colors = "green" | "red";

const map = {
	active: "green",
	draft: "red",
} as const satisfies Record<JobActiveStatus, Colors>;
type StatusMap = typeof map;

type InferReturnType<T extends JobActiveStatus> = `status-${StatusMap[T]}`;

export const getJobActiveStatusStyles = <T extends JobActiveStatus>(
	status: T,
): InferReturnType<T> => {
	const statusLowerCase = status.toLowerCase() as T;

	return cn({
		"status-red": statusLowerCase === "draft",
		"status-green": statusLowerCase === "active",
	}) as InferReturnType<T>;
};
