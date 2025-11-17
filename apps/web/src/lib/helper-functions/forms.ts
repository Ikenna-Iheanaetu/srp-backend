/** @format */

import type { FieldValues, Path, PathValue } from "react-hook-form";

/**
 * Type for file field values
 */
type FileOrString = File | string;

export type PathSupportingFile<T> = {
	[P in Path<T>]: File extends PathValue<T, P>
		? P
		: PathValue<T, P> extends File
			? P
			: never;
}[Path<T>];

/**
 * Normalizes form data fields expected to contain only files before submission.
 *
 * It removes invalid types (`undefined`, `null`, numbers, objects) from targeted fields.
 * By default (`onlyFiles: true`), it removes strings. Set to `false` to preserve strings (existing file IDs/URLs).
 */
export function normalizeFileFields<T extends FieldValues>(
	data: T,
	fileFieldPaths: PathSupportingFile<T>[],
	options: { onlyFiles?: boolean } = {},
): T {
	const { onlyFiles = true } = options;
	const result = { ...data };

	for (const path of fileFieldPaths) {
		const value = getNestedValue(result, path);

		if (Array.isArray(value)) {
			// Handle array fields (multiple files)
			const transformedArray = value
				.filter((item): item is FileOrString => item !== undefined)
				.filter(
					(item): item is FileOrString =>
						item instanceof File ||
						(!onlyFiles && typeof item === "string"),
				);

			setNestedValue(
				result,
				path,
				transformedArray.length > 0 ? transformedArray : undefined,
			);
		} else if (value !== undefined) {
			// Handle single file fields
			if (
				value instanceof File ||
				(!onlyFiles && typeof value === "string")
			) {
				// Keep as is - it's a valid file or string (depending on onlyFiles option)
			} else {
				// Remove invalid values
				setNestedValue(result, path, undefined);
			}
		}
	}

	return result;
}

/**
 * Helper to get a nested value from an object using a dot-notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	const keys = path.split(".");
	let current: unknown = obj;

	for (const key of keys) {
		if (current === undefined) return undefined;
		if (typeof current !== "object" || current === null) return undefined;

		current = (current as Record<string, unknown>)[key];
	}

	return current;
}

/**
 * Helper to set a nested value in an object using a dot-notation path
 */
function setNestedValue(
	obj: Record<string, unknown>,
	path: string,
	value: unknown,
): void {
	const keys = path.split(".");
	const lastKey = keys.pop()!;
	let current = obj;

	for (const key of keys) {
		if (current[key] === undefined) {
			current[key] = {};
		}
		if (typeof current[key] !== "object" || current[key] === null) {
			current[key] = {};
		}
		current = current[key] as Record<string, unknown>;
	}

	if (value === undefined) {
		delete current[lastKey];
	} else {
		current[lastKey] = value;
	}
}

type DirtyFieldsType =
	| boolean
	| null
	| {
			[key: string]: DirtyFieldsType;
	  }
	| DirtyFieldsType[];

export function getDirtyValues<TForm extends FieldValues>(
	dirtyFields: Partial<Record<keyof TForm, DirtyFieldsType>>,
	values: TForm,
): Partial<TForm> {
	const dirtyValues = Object.keys(dirtyFields).reduce((prev, key) => {
		const value = dirtyFields[key];
		if (!value) {
			return prev;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const nestedValue =
			!!value && typeof value === "object" && !Array.isArray(value)
				? getDirtyValues(value as FieldValues, values[key])
				: values[key];
		return {
			...prev,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			[key]: Array.isArray(value) ? values[key] : nestedValue,
		};
	}, {} as Partial<TForm>);
	return dirtyValues;
}
