/** @format */

/* eslint-disable react-refresh/only-export-components */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	FormControl,
	FormDescription,
	FormField,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { cn } from "@/lib/utils";
import { StringOrFileUnionPath } from "@/types/form";
import { CloudUpload } from "lucide-react";
import { ReactNode, useEffect, useId, useState } from "react";
import { Control, FieldValues, useWatch } from "react-hook-form";
import { ClassNameValue } from "tailwind-merge";
import { z } from "zod";
import { FormFieldErrorAndLabelWrapper } from "./wrapper";

export const ALLOWED_AVATAR_MIME_TYPES = [
	"image/gif",
	"image/jpeg",
	"image/png",
	"image/svg+xml",
];

type Variant = "avatar" | "banner";

interface SizeConstraint {
	maxSizeInMB: number;
	dimensions: {
		aspectRatio: number;
		tolerance: number;
	};
}

const sizeConstraints = {
	avatar: {
		maxSizeInMB: 5,
		dimensions: {
			aspectRatio: 1, // 1:1
			tolerance: 0.1,
		},
	},
	banner: {
		maxSizeInMB: 10,
		dimensions: {
			aspectRatio: 4, // 4:1
			tolerance: 0.2,
		},
	},
} satisfies Record<Variant, SizeConstraint>;

// Schema without dimension validation
const createImageSchema = (variant: Variant) => {
	const { maxSizeInMB, dimensions } = sizeConstraints[variant];

	const expectedRatio = dimensions.aspectRatio;
	const tolerance = dimensions.tolerance;

	const urlStringSchema = z
		.string({ required_error: `${variant} image is required` })
		.url();

	let unExpectedError: unknown = null;

	const fileSchema = z
		.instanceof(File)
		// Required validation
		.refine((value) => value !== undefined && value !== null, {
			message: `${variant} image is required`,
		})
		// Format validation
		.refine(
			(file) => ALLOWED_AVATAR_MIME_TYPES.includes(file.type),
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
				: `Invalid aspect ratio. For ${
						variant === "avatar" ? "an" : "a"
				  } ${variant}, it should be ${expectedRatio}:1.`
		);

	return z.union([urlStringSchema, fileSchema]);
};

export type AvatarFieldType = z.infer<ReturnType<typeof createImageSchema>>;

export const ProfileAvatarSchema = createImageSchema("avatar");
export const ProfileBannerSchema = createImageSchema("banner");

interface Props<TForm extends FieldValues>
	extends Omit<React.ComponentProps<"div">, "className"> {
	control: Control<TForm>;
	path: StringOrFileUnionPath<TForm>;
	variant?: Variant;
	className?: ClassNameValue;
	label?: ReactNode;
	showError?: boolean;
}

const usePreviewUrl = (fieldValue: AvatarFieldType) => {
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
export const AvatarPicker = <TForm extends FieldValues>({
	control,
	path,
	variant = "avatar",
	className,
	label,
	showError = true,
	...rest
}: Props<TForm>) => {
	const fieldValue = useWatch<TForm, typeof path>({ control, name: path });
	const previewUrl = usePreviewUrl(fieldValue);
	const inputId = useId();

	const { maxSizeInMB, dimensions } = sizeConstraints[variant];
	const expectedRatio = dimensions.aspectRatio;

	const instructionText = `max ${maxSizeInMB} MB`;

	const descriptionText = `Max ${maxSizeInMB} MB. Formats: SVG, PNG, JPG, GIF. Aspect ratio: ${expectedRatio}:1.`;

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
						<Avatar
							className={cn(
								"relative border-2 border-blue-700/65 cursor-pointer pointer-events-auto focus:ring-2 focus:ring-lime-400",
								{
									"size-40": variant === "avatar",
									"aspect-profile-banner w-full h-auto rounded-none":
										variant === "banner",
								}
							)}>
							<AvatarImage
								src={previewUrl}
								alt="Avatar image"
								className="object-cover"
							/>
							<span className="absolute inset-0 size-full flex justify-center items-center bg-blue-700/30 group">
								{uploadIcon}
							</span>
							<AvatarFallback
								className={cn(
									"relative flex flex-col items-center gap-2 bg-gray-200 group",
									{
										"": variant === "avatar",
										"rounded-none": variant === "banner",
									}
								)}>
								{uploadIcon}
								<strong className="font-medium text-center">
									Upload image
								</strong>
								<span
									className={cn(
										"text-[0.65rem] italic text-blue-700/65 text-center max-w-[80%]",
										{
											"": variant === "avatar",
											"absolute sm:static right-4 top-1/2 -translate-y-1/2 sm:-translate-y-0 sm:max-w-none sm:text-left":
												variant === "banner",
										}
									)}>
									SVG, PNG, JPG or GIF ({instructionText})
								</span>
							</AvatarFallback>
						</Avatar>
					</FormLabel>
					<FormControl>
						<Input
							type="file"
							id={inputId}
							accept={ALLOWED_AVATAR_MIME_TYPES.join(",")}
							onChange={(e) =>
								field.onChange(e.target.files?.[0])
							}
							className={cn("sr-only", {
								"rounded-full": variant === "avatar",
							})}
						/>
					</FormControl>
					<FormDescription>{descriptionText}</FormDescription>
				</FormFieldErrorAndLabelWrapper>
			)}
		/>
	);
};

/**@deprecated Use the named export instead */
export default AvatarPicker;
