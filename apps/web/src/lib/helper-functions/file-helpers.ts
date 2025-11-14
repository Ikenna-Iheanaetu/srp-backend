/** @format */

import { z } from "zod";

const urlSchema = z.string().url();

import apiAxiosInstance from "../axios-instance";
import { removeTrailingSlash } from "./generic-string-helpers";

/**
 * @deprecated Api now sends full url for any file. You can safely remove this helper.
 *
 * Constructs a file URL from the filename using the {@link apiAxiosInstance}'s baseURL or returns the input if it's already a valid URL. */
export const getFileNameUrl = <T extends string | undefined>(filename: T) => {
	if (!filename) {
		return filename;
	}

	// Check if the filename is a valid URL
	const isValidUrl = urlSchema.safeParse(filename);

	if (isValidUrl.success) {
		return filename;
	}

	const baseURL = apiAxiosInstance.defaults.baseURL;
	if (baseURL) {
		const normalizedBaseURL = removeTrailingSlash(baseURL);
		const encodedFilename = encodeURIComponent(filename);

		return `${normalizedBaseURL}/file/${encodedFilename}` as const;
	}
};

export const truncateFilename = (filename: string, maxLength = 15) => {
	const ELLIPSIS = "...";
	const ELLIPSIS_LENGTH = ELLIPSIS.length; // Derived from ELLIPSIS
	const SHORTEST_EXTENSION_LENGTH = 4; // Length of shortest common extension like ".txt" (dot + 3 chars)
	const MINIMUM_LENGTH = ELLIPSIS_LENGTH + SHORTEST_EXTENSION_LENGTH; // Enough for "a.txt" + "..."

	// Ensure maxLength is reasonable (at least enough for ellipsis + shortest extension)
	if (maxLength < MINIMUM_LENGTH) return filename;

	// If the filename is already short enough, return it as is
	if (filename.length <= maxLength) return filename;

	// Find the last dot to split into name and extension
	const lastDotIndex = filename.lastIndexOf(".");
	if (lastDotIndex === -1) {
		// No extension: truncate and add ellipsis
		return filename.slice(0, maxLength - ELLIPSIS_LENGTH) + ELLIPSIS;
	}

	const name = filename.slice(0, lastDotIndex);
	const extension = filename.slice(lastDotIndex); // Includes the dot

	// Calculate the max length for the name part
	const maxNameLength = maxLength - extension.length - ELLIPSIS_LENGTH;
	if (maxNameLength <= 0) return filename; // Edge case: extension too long to truncate

	// Truncate the name and append ellipsis and the extension
	return name.slice(0, maxNameLength) + ELLIPSIS + extension;
};

/**
 * Appends an array of files from a specified field in an object to a FormData object.
 * The files are appended with keys in the format `prefix.index` (e.g., `files.0`, `files.1`).
 * The object must have a field at the first level that is an array of File objects, and the key of that field must be provided.
 */

type FileArrayObject<T extends Record<string, unknown>> =
	File[] extends T[keyof T] ? T : never;

// Interface for the function parameters
interface AppendFilesParams<T extends Record<string, unknown>> {
	formData: FormData;
	obj: T & FileArrayObject<T>; // Ensure the key K maps to File[]
	key: keyof T;
	prefix?: string;
}

/**Adds an array of files to your FormData obj, in the form `{[${prefix}{index}]: File} and returns the rest of the original object */
export function appendFilesToFormData<T extends Record<string, unknown>>({
	formData,
	obj,
	key,
	prefix = key as string,
}: AppendFilesParams<T>) {
	const { [key]: files, ...rest } = obj;
	if (Array.isArray(files)) {
		files.forEach((file, index) => {
			if (file instanceof File) {
				const formDataKey = `${prefix}${index}`;
				formData.append(formDataKey, file);
			}
		});
	}

	return rest;
}

type ExtPrefixedArrValType<T, P extends string> =
	T extends Record<infer K, infer Val>
		? K extends `${P}${number}`
			? Val
			: never
		: never;

type WithoutPrefixedKeys<T, P extends string> = {
	[K in keyof T as K extends `${P}${number}` ? never : K]: T[K];
};

type ReturnType<T, P extends string> = WithoutPrefixedKeys<T, P> &
	Record<P, ExtPrefixedArrValType<T, P>[]>;

// Ensure prefix is a string that matches the pattern in keyof T
interface ExtrPrefixedArrParams<T, P extends string> {
	obj: T;
	prefix: P;
}

const isValidIndex = (value: string): value is `${number}` => {
	const num = Number(value);
	return !isNaN(num) && num >= 0 && Number.isInteger(num);
};

/**@deprecated */
export const extrPrefixedArr = <T extends object, P extends string>({
	obj,
	prefix,
}: ExtrPrefixedArrParams<T, P>) => {
	const filesArray: ExtPrefixedArrValType<T, P>[] = [];

	Object.keys(obj).forEach((key) => {
		if (!key.startsWith(prefix)) return;

		const numberPart = key.slice(prefix.length);
		if (!isValidIndex(numberPart)) return;

		const index = Number(numberPart);
		filesArray[index] = obj[key as keyof T] as ExtPrefixedArrValType<T, P>;
	});

	const rest = Object.fromEntries(
		Object.entries(obj).filter(([key]) => {
			if (!key.startsWith(prefix)) return true;
			const numberPart = key.slice(prefix.length);
			return !isValidIndex(numberPart);
		}),
	) as WithoutPrefixedKeys<T, P>;

	return { [prefix]: filesArray, ...rest } as ReturnType<T, P>;
};
