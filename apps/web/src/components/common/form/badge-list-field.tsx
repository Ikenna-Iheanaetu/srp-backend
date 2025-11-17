/** @format */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StringArrayPath } from "@/types/form";
import { Plus, X } from "lucide-react";
import React, { useRef } from "react";
import {
	type Control,
	type FieldValues,
	type PathValue,
	useFormContext,
} from "react-hook-form";
import { z } from "zod/v4";

import { FormFieldErrorAndLabelWrapper } from "./wrapper";

interface FormBadgeListProps<T extends FieldValues = FieldValues>
	extends React.ComponentProps<typeof Input> {
	control: Control<T>;
	path: StringArrayPath<T>;
	label?: string;
	addLabel?: string;
	placeholder?: string;
	emptyMessage?: string;
	className?: string;
	showError?: boolean;

	/**
	 * Zod schema that validates a single item in the array.
	 *
	 * Provide this if you want to validate before adding any item.
	 */
	itemSchema?: z.ZodType;
}
const FormBadgeList = <T extends FieldValues>({
	control,
	path,
	label,
	addLabel = "Add",
	placeholder = "Type and press Enter...",
	emptyMessage = "No items added",
	className,
	showError = true,
	itemSchema,
	...inputProps
}: FormBadgeListProps<T>) => {
	const { watch, setValue } = useFormContext<T>();
	const inputRef = useRef<HTMLInputElement>(null);
	const items = (watch(path) as string[]) || [];

	const [localError, setLocalError] = React.useState<string | null>(null);
	const handleAdd = () => {
		const newValue = inputRef.current?.value.trim();
		if (!inputRef.current || !newValue) {
			// Clear any previous error
			setLocalError(null);
			return;
		}

		if (itemSchema) {
			const result = itemSchema.safeParse(newValue);
			if (!result.success) {
				// Get and set the error message from Zod
				setLocalError(
					result.error.issues[0]?.message || "Value is invalid.",
				);
				inputRef.current.focus();
				return;
			}
		}

		// Clear any previous error and proceed with adding
		setLocalError(null);

		const updatedItems = [...items, newValue];
		setValue(path, updatedItems as PathValue<T, typeof path>, {
			shouldValidate: true,
		});
		inputRef.current.value = "";
		inputRef.current.focus();
	};

	const handleRemove = (index: number) => {
		const updatedItems = items.filter((_, i) => i !== index);
		setValue(path, updatedItems as PathValue<T, typeof path>, {
			shouldValidate: true,
		});
	};

	return (
		<FormFieldErrorAndLabelWrapper
			control={control}
			path={path}
			label={label}
			showError={showError}
			className={cn(className)}>
			<div className="flex min-h-[3rem] flex-wrap gap-2 rounded-md border border-gray-200 bg-gray-50 p-2">
				{items.length === 0 && (
					<div className="flex w-full items-center justify-center text-sm text-gray-500">
						{emptyMessage}
					</div>
				)}

				{items.map((item, index) => (
					<div
						key={item}
						className="flex h-6 items-center gap-1 rounded-full border border-gray-300 bg-white px-2 text-gray-700">
						<span className="text-sm">{item}</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-4 w-4 rounded-full p-0 hover:bg-gray-100"
							onClick={() => handleRemove(index)}>
							<X className="h-3 w-3" />
							<span className="sr-only">Remove {item}</span>
						</Button>
					</div>
				))}
			</div>

			<div className="flex max-w-md flex-col gap-2">
				<div className="flex gap-2">
					<Input
						{...inputProps}
						ref={inputRef}
						placeholder={placeholder}
						onChange={(e) => {
							if (localError) {
								const value = e.target.value.trim();
								const shouldClear =
									!value ||
									!!itemSchema?.safeParse(value).success;
								if (shouldClear) {
									setLocalError(null);
								}
							}
							inputProps.onChange?.(e);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleAdd();
							}
							inputProps.onKeyDown?.(e);
						}}
					/>

					<Button type="button" onClick={handleAdd} variant="ghost">
						<Plus className="mr-1 h-4 w-4" />
						{addLabel}
					</Button>
				</div>

				{localError && (
					<p className="form-error relative">{localError}</p>
				)}
			</div>
		</FormFieldErrorAndLabelWrapper>
	);
};

export { FormBadgeList };
export type { FormBadgeListProps };
