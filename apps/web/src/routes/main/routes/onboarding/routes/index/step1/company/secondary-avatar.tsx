/** @format */

"use client";

import type React from "react";

/** @format */

/* eslint-disable react-refresh/only-export-components */

import { FormFieldErrorAndLabelWrapper } from "@/components/common/form/wrapper";
import { FormDescription, FormField, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { cn } from "@/lib/utils";
import type { StringOrFileUnionPath } from "@/types/form";
import { CloudUpload } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";
import { type Control, type FieldValues, useWatch } from "react-hook-form";
import type { ClassNameValue } from "tailwind-merge";
import { z } from "zod";

export const ALLOWED_BANNER_MIME_TYPES = [
	"image/gif",
	"image/jpeg",
	"image/png",
	"image/svg+xml",
];

const BANNER_CONSTRAINTS = {
	maxSizeInMB: 10,
	dimensions: {
		aspectRatio: 14 / 25,
		tolerance: 0.2, // 20%
	},
};

const createSecondaryAvatarSchema = () => {
	const { maxSizeInMB, dimensions } = BANNER_CONSTRAINTS;
	const expectedRatio = dimensions.aspectRatio;
	const tolerance = dimensions.tolerance;

	const urlStringSchema = z
		.string({ required_error: "Banner image is required" })
		.url();

	let unExpectedError: unknown = null;

	const fileSchema = z
		.instanceof(File)
		// Required validation
		.refine((value) => value !== undefined && value !== null, {
			message: "Banner image is required",
		})
		// Format validation
		.refine(
			(file) => ALLOWED_BANNER_MIME_TYPES.includes(file.type),
			"Invalid format (SVG, PNG, JPG, GIF only)"
		)
		// Size validation
		.refine(
			(file) => file.size <= maxSizeInMB * 1024 * 1024,
			`Max ${maxSizeInMB} MB`
		)
		.refine(
			async (file) => {
				try {
					const imageBitmap = await createImageBitmap(file);
					const { width, height } = imageBitmap;
					const actualRatio = width / height;

					const lowerBound = expectedRatio * (1 - tolerance);
					const upperBound = expectedRatio * (1 + tolerance);

					const isValid =
						actualRatio >= lowerBound && actualRatio <= upperBound;

					if (!isValid) {
						return false;
					}
					return true;
				} catch (e) {
					unExpectedError = e;
					return false;
				}
			},
			unExpectedError
				? `Unexpected error while validating: ${getApiErrorMessage(
						unExpectedError
				  )}`
				: "Invalid aspect ratio. Banner should have a 14:25 aspect ratio."
		);

	return z.union([urlStringSchema, fileSchema]);
};

export type BannerFieldType = z.infer<
	ReturnType<typeof createSecondaryAvatarSchema>
>;

export const SecondaryAvatarSchema = createSecondaryAvatarSchema();

interface Props<TForm extends FieldValues>
	extends Omit<React.ComponentProps<"div">, "className"> {
	control: Control<TForm>;
	path: StringOrFileUnionPath<TForm>;
	className?: ClassNameValue;
	label?: ReactNode;
	showError?: boolean;
}

const usePreviewUrl = (fieldValue: BannerFieldType) => {
	const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

	useEffect(() => {
		if (typeof fieldValue === "string") {
			setPreviewUrl(fieldValue);
			return;
		}

		if (fieldValue instanceof File) {
			const url = URL.createObjectURL(fieldValue);
			setPreviewUrl(url);
			return () => URL.revokeObjectURL(url);
		}

		setPreviewUrl(undefined);
	}, [fieldValue]);

	return previewUrl;
};

/** Make sure to use inside a `FormProvider` - React Hook Form */
export const SecondaryAvatarPicker = <TForm extends FieldValues>({
	control,
	path,
	className,
	label,
	showError = true,
	...rest
}: Props<TForm>) => {
	const fieldValue = useWatch<TForm, typeof path>({ control, name: path });
	const previewUrl = usePreviewUrl(fieldValue);
	const inputId = useId();

	const { maxSizeInMB } = BANNER_CONSTRAINTS;
	const instructionText = `max ${maxSizeInMB} MB`;
	const descriptionText = `Max ${maxSizeInMB} MB. Formats: SVG, PNG, JPG, GIF. Aspect ratio: 14:25.`;

	const uploadIcon = (
		<span className="inline-flex items-center justify-center p-2 bg-white rounded-md group-hover:scale-125 transition-transform">
			<CloudUpload />
		</span>
	);

	return (
		<FormField
			control={control}
			name={path}
			render={({ field }) => (
				<FormFieldErrorAndLabelWrapper
					control={control}
					path={path}
					showError={showError}
					className={cn("pointer-events-none mb-16", className)}
					htmlFor={inputId}
					label={label}
					{...rest}>
					<FormLabel
						htmlFor={inputId}
						className="relative pointer-events-none !text-black">
						<div className="relative h-[28.125rem] aspect-[14/25] border-2 border-blue-700/65 cursor-pointer pointer-events-auto focus:ring-2 focus:ring-lime-400 rounded-lg overflow-hidden">
							{previewUrl ? (
								<img
									src={previewUrl || "/placeholder.svg"}
									alt="Banner image"
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-200 group">
									{uploadIcon}
									<strong className="font-medium text-center">
										Upload banner
									</strong>
									<span className="text-[0.65rem] italic text-blue-700/65 text-center max-w-[80%]">
										SVG, PNG, JPG or GIF ({instructionText})
									</span>
								</div>
							)}
							{previewUrl && (
								<span className="absolute inset-0 size-full flex justify-center items-center bg-blue-700/30 opacity-0 hover:opacity-100 transition-opacity group">
									{uploadIcon}
								</span>
							)}
						</div>
					</FormLabel>
					<Input
						type="file"
						id={inputId}
						accept={ALLOWED_BANNER_MIME_TYPES.join(",")}
						onChange={(e) => field.onChange(e.target.files?.[0])}
						className="sr-only"
					/>
					<FormDescription>{descriptionText}</FormDescription>
				</FormFieldErrorAndLabelWrapper>
			)}
		/>
	);
};
