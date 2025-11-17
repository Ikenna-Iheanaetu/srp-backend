/** @format */

import { isAxiosError } from "axios";
import { AxiosApiError } from "./types";

export const isAxiosApiError = (error: unknown): error is AxiosApiError => {
	if (!isAxiosError(error) || !error.response) {
		return false;
	}

	const data: unknown = error.response.data;

	return (
		!!data &&
		typeof data === "object" &&
		"success" in data &&
		typeof data.success === "boolean" &&
		"message" in data &&
		typeof data.message === "string"
	);
};

export const isAxiosExpiredTokenError = (
	error: unknown
): error is AxiosApiError & { status: 401 } => {
	if (isAxiosApiError(error)) {
		return error.status === 401;
	}

	return false;
};
