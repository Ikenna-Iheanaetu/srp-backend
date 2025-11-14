/** @format */

import { getJobActiveStatusStyles } from "@/lib/helper-functions/get-job-active-status-styles";
import { getJobApplicationStatusStyles } from "@/lib/helper-functions/get-job-application-status-styles-styles";
import { cn, replaceUnderscoresWithSpaces } from "@/lib/utils";
import {
	JOB_ACTIVE_STATUSES,
	JOB_APPLICATION_STATUSES,
	JobActiveStatus,
	JobApplicationStatus,
} from "@/routes/main/routes/jobs/constants";
import { useMemo } from "react";

const isArrayElement = <
	T extends string,
	A extends readonly unknown[] | unknown[]
>(
	element: T,
	array: A
): element is T & A[number] => array.some((item) => item === element);

export type StatusStylesString = `status-${string}`;

export type StatusStylesGetter<T extends string> = (
	status: T
) => StatusStylesString;

type Props<T extends string> =
	| {
			status: T & (JobApplicationStatus | JobActiveStatus);
			getStatusStyles?: StatusStylesGetter<T>;
			className?: string;
	  }
	| {
			status: T;
			getStatusStyles: StatusStylesGetter<T>;
			className?: string;
	  };

export const StatusCell = <T extends string>({
	status,
	getStatusStyles,
	className,
}: Props<T>) => {
	const statusStyles = useMemo(() => {
		if (getStatusStyles) {
			return getStatusStyles(status);
		}

		if (isArrayElement(status, JOB_APPLICATION_STATUSES)) {
			return getJobApplicationStatusStyles(status);
		}

		if (isArrayElement(status, JOB_ACTIVE_STATUSES)) {
			return getJobActiveStatusStyles(status);
		}
	}, [getStatusStyles, status]);

	return (
		<div className={cn(statusStyles, className)}>
			{replaceUnderscoresWithSpaces(status)}
		</div>
	);
};
