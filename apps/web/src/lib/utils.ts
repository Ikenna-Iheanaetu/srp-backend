/** @format */

import { z as z3 } from "zod";
import * as z from "zod/v4";
import { isAxiosApiError } from "./axios-instance/utils";

export { cn } from "@repo/shared";

export interface ReplaceWithSpacesOptions {
	separators?: string[];
}

export function replaceUnderscoresWithSpaces(
	input: string,
	options: ReplaceWithSpacesOptions = {},
) {
	const { separators = ["_", "-"] } = options;
	return separators.reduce(
		(result, separator) => result?.replace(new RegExp(separator, "g"), " "),
		input,
	);
}

export const getErrorMessage = (error: unknown): string => {
	if (typeof error === "string") {
		return error;
	}

	if (error instanceof Error) {
		if (isAxiosApiError(error)) {
			return error.response.data.message;
		}
		if (error instanceof z.ZodError) {
			return z.prettifyError(error);
		}
		if (error instanceof z3.ZodError) {
			return error.issues.map(({ message }) => message).join(", ");
		}
		if (error.message) {
			return error.message;
		}
		if (error.cause) {
			return getErrorMessage(error.cause);
		}
	}

	return "Unknown error";
};

/**
 * Calculates the index of the item that should serve as the sentinel
 * (fetch-more trigger) for infinite scrolling.
 *
 * @param totalItemsCount The total number of items currently loaded.
 * @param thresholdFromEnd The number of items from the end of the list at which the fetch should be triggered.
 */
export const getScrollFetchThresholdIndex = (
	totalItemsCount: number,
	thresholdFromEnd = 10,
) => {
	return Math.max(0, totalItemsCount - thresholdFromEnd);
};
