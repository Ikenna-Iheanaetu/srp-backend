/** @format */

"use client";

import { Button } from "@/components/ui/button";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MAX_FILES_DEFAULT } from "@/constants/file";
import { cn } from "@/lib/utils";
import type {
	StringOrFileArrayPath,
	StringOrFileUnionPath,
} from "@/types/form";
import { FileIcon, Plus, Trash2, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import {
	useFormContext,
	type Control,
	type FieldValues,
	type Path,
	type PathValue,
} from "react-hook-form";
import { FormFieldErrorAndLabelWrapper } from "./wrapper";

/**
 * A type-safe file upload field component that works with fields that can accept File or string values
 */
interface FileUploadFieldProps<TFieldValues extends FieldValues> {
	control: Control<TFieldValues>;
	path: StringOrFileUnionPath<TFieldValues>;
	accept?: string[];
	label?: React.ReactNode;
	placeholder?: string;
	showError?: boolean;
}

// Type guard to check if value is an object
function isObject(value: unknown): value is object {
	return typeof value === "object" && value !== null;
}

// Type guard to check if value is a File
function isFile(value: unknown): value is File {
	return isObject(value) && value instanceof File;
}

const DEFAULT_DOCUMENT_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const FormFileUpload = <TFieldValues extends FieldValues>({
	control,
	path,
	accept = DEFAULT_DOCUMENT_TYPES,
	label,
	placeholder = "Upload file",
	showError = true,
}: FileUploadFieldProps<TFieldValues>) => {
	return (
		<FormField
			control={control}
			name={path}
			render={({ field }) => (
				<FormItem className="relative">
					<FormFieldErrorAndLabelWrapper
						control={control}
						path={path}
						label={label}
						showError={showError}>
						<FormLabel
							className={cn(
								"relative h-12 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center",
								"border border-input"
							)}>
							{field.value ? (
								<div className="flex items-center justify-between w-full px-3">
									<span className="inline-grid grid-cols-1 text-sm truncate max-w-[80%]">
										{isFile(field.value)
											? field.value.name
											: typeof field.value === "string"
											? field.value
											: "Unknown file"}
									</span>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={(e) => {
											e.stopPropagation();
											field.onChange("");
										}}>
										<X className="h-4 w-4" />
										<span className="sr-only">
											Remove file
										</span>
									</Button>
								</div>
							) : (
								<div className="text-gray-400 flex items-center gap-2">
									<FileIcon className="h-4 w-4" />
									<span>{placeholder}</span>
								</div>
							)}
						</FormLabel>
						<FormControl className="sr-only">
							<Input
								type="file"
								onChange={(e) => {
									const files = (e.target as HTMLInputElement)
										.files;
									field.onChange(files?.[0] ?? null);
								}}
								accept={accept.join(",")}
								className="sr-only"
							/>
						</FormControl>
					</FormFieldErrorAndLabelWrapper>
				</FormItem>
			)}
		/>
	);
};

/**@deprecated Use the named export instead. */
export default FormFileUpload;

/**
 * Type for a nested field path
 */
type NestedFieldPath<
	TFieldValues extends FieldValues,
	TPath extends Path<TFieldValues>
> = `${TPath}.${number}` &
	Path<TFieldValues> &
	StringOrFileUnionPath<TFieldValues>;

/**
 * A type-safe multiple file upload field component
 */
interface MultipleFileUploadFieldProps<
	TFieldValues extends FieldValues,
	TPath extends StringOrFileArrayPath<TFieldValues>
> {
	control: Control<TFieldValues>;
	path: TPath;
	accept?: string[];
	label?: string;
	addLabel?: string;
	placeholder?: string;
	showError?: boolean;
	maxFiles?: number;
}

/**
 * Helper function to filter out nullish values and empty strings from an array
 */
function filterValidFiles(array: unknown[]): (File | string)[] {
	return array.filter(
		(item): item is File | string =>
			!!item &&
			(item instanceof File ||
				(typeof item === "string" && item.trim() !== ""))
	);
}

export const FormMultipleFileUpload = <
	TFieldValues extends FieldValues,
	TPath extends StringOrFileArrayPath<TFieldValues>
>({
	control,
	path,
	accept = DEFAULT_DOCUMENT_TYPES,
	label,
	showError = true,
	maxFiles = MAX_FILES_DEFAULT,
	addLabel = "Add file",
	placeholder,
}: MultipleFileUploadFieldProps<TFieldValues, TPath>) => {
	const { getValues, setValue, watch } = useFormContext<TFieldValues>();
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Watch the array field to filter out nullish values on initial load and changes
	const filesArray = watch(path);

	// Filter nullish values on initial load and when the array changes
	useEffect(() => {
		if (!Array.isArray(filesArray)) return;

		const filteredArray = filterValidFiles(filesArray);

		// Only update if the filtered array is different
		if (filteredArray.length !== filesArray.length) {
			setValue(path, filteredArray as PathValue<TFieldValues, TPath>, {
				shouldValidate: true,
			});
		}
	}, [filesArray, path, setValue]);

	// Add a new file to the array
	const handleFileSelect = useCallback(
		(file: File) => {
			// Get the current array value directly from form
			const currentArray = [
				...(getValues(path) || ([] as PathValue<TFieldValues, TPath>)),
			];

			// Add the new file
			currentArray.push(file);

			// Filter out nullish values and empty strings
			const filteredArray = filterValidFiles(currentArray);

			// Update the form
			setValue(path, filteredArray as PathValue<TFieldValues, TPath>, {
				shouldValidate: true,
				shouldDirty: true,
			});
		},
		[getValues, path, setValue]
	);

	// Remove an item from the array
	const removeFile = useCallback(
		(indexToRemove: number) => {
			// Get the current array value directly from form
			const currentValues = getValues(path);

			// Ensure we have an array to work with
			if (!Array.isArray(currentValues)) return;

			// Create a new array without the item at the specified index
			const filteredArray = (currentValues as (string | File)[]).filter(
				(_, index) => index !== indexToRemove
			);

			// Update the form with the filtered array
			setValue(path, filteredArray as PathValue<TFieldValues, TPath>, {
				shouldValidate: true,
				shouldDirty: true,
			});
		},
		[getValues, path, setValue]
	);

	// Handle file input change
	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				handleFileSelect(file);
			}
			// Reset the input so the same file can be selected again
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[handleFileSelect]
	);

	return (
		<FormField
			control={control}
			name={path}
			render={({ field }) => {
				const value = field.value as (string | File)[];
				return (
					<FormItem className="relative">
						<FormFieldErrorAndLabelWrapper
							control={control}
							path={path}
							label={label}
							showError={showError}>
							<FormControl>
								<div className="space-y-2">
									{/* File list */}
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
										{Array.isArray(value) &&
											value.map((item, index) => {
												// Skip rendering nullish values
												if (
													item === null ||
													item === undefined ||
													(typeof item === "string" &&
														item.trim() === "")
												) {
													return null;
												}

												// Create a path for the nested field
												const nestedPath =
													`${path}.${index}` as NestedFieldPath<
														TFieldValues,
														TPath
													>;

												return (
													<div
														key={`file-${index}`}
														className="relative group">
														{/* We need to cast the nested path to a FileFieldPath type for FormFileUpload */}
														<FormFileUpload
															control={control}
															path={nestedPath}
															accept={accept}
															showError={false}
															placeholder={
																placeholder
															}
														/>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																removeFile(
																	index
																);
															}}>
															<Trash2 className="h-3 w-3 stroke-red-500" />
															<span className="sr-only">
																Remove file
															</span>
														</Button>
													</div>
												);
											})}

										{/* Add file button */}
										{(!field.value ||
											field.value.length < maxFiles) && (
											<>
												<FormLabel
													className={cn(
														"h-12 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center",
														"border border-input border-dashed"
													)}
													onClick={() =>
														fileInputRef.current?.click()
													}>
													<div className="text-gray-400 flex items-center gap-2">
														<Plus className="h-4 w-4" />
														<span>{addLabel}</span>
													</div>
												</FormLabel>
												<input
													ref={fileInputRef}
													type="file"
													className="hidden"
													accept={accept.join(",")}
													onChange={
														handleFileInputChange
													}
												/>
											</>
										)}
									</div>
								</div>
							</FormControl>
						</FormFieldErrorAndLabelWrapper>
					</FormItem>
				);
			}}
		/>
	);
};
