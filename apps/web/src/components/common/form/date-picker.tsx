/** @format */

"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { DayPickerSingleProps, Matcher } from "react-day-picker";
import {
	Control,
	FieldPathValue,
	FieldValues,
	Path,
	useFormContext,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FormFieldErrorAndLabelWrapper } from "./wrapper";

type StringPath<TForm extends FieldValues> = {
	[K in Path<TForm>]: string extends FieldPathValue<TForm, K> ? K : never;
}[Path<TForm>];

type FormSingleDatePickerProps<TForm extends FieldValues> = {
	control: Control<TForm>;
	path: StringPath<TForm>;
	label?: string;
	placeholder?: string;
	showError?: boolean;
	className?: string;
	disabled?: Matcher | Matcher[];
	onSelect?: (isoString: string | undefined) => void;
} & Omit<DayPickerSingleProps, "mode" | "selected">;

export const FormSingleDatePicker = <TForm extends FieldValues>({
	control,
	path,
	placeholder = "Pick a date",
	label,
	showError = true,
	className,
	disabled = false,
	onSelect,
	...props
}: FormSingleDatePickerProps<TForm>) => {
	const combinedDisabled = useMemo(() => {
		const persistentCheck = (date: Date) => date < new Date("1900-01-01");
		const combinedArray: Matcher[] = [persistentCheck];

		if (disabled) {
			if (Array.isArray(disabled)) {
				combinedArray.push(...disabled);
			} else {
				combinedArray.push(disabled);
			}
		}

		return combinedArray;
	}, [disabled]);

	return (
		<FormField
			control={control}
			name={path}
			render={({ field }) => {
				const selectedDate = field.value
					? new Date(field.value)
					: undefined;

				return (
					<FormItem className={cn("flex flex-col", className)}>
						<FormFieldErrorAndLabelWrapper
							control={control}
							path={path}
							label={label}
							showError={showError}>
							<Popover modal>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											variant={"outline"}
											className={cn(
												"w-[240px] pl-3 text-left font-normal",
												!field.value &&
													"text-muted-foreground"
											)}
											disabled={combinedDisabled.includes(
												true
											)}>
											{field.value ? (
												format(field.value, "PPP")
											) : (
												<span>{placeholder}</span>
											)}
											<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>

								<PopoverContent
									className="w-auto p-0"
									align="start">
									<Calendar
										captionLayout="dropdown"
										{...props}
										mode="single"
										selected={selectedDate}
										onSelect={(date) => {
											const isoString = date
												? date.toISOString()
												: undefined;
											field.onChange(isoString);
											onSelect?.(isoString);
										}}
										disabled={combinedDisabled}
										autoFocus
									/>
								</PopoverContent>
							</Popover>
						</FormFieldErrorAndLabelWrapper>
					</FormItem>
				);
			}}
		/>
	);
};

type DistinctPaths<
	TForm extends FieldValues,
	TStart extends StringPath<TForm>
> = {
	[K in StringPath<TForm>]: K extends TStart ? never : K;
}[StringPath<TForm>];

type IntervalProps<
	TForm extends FieldValues,
	TPath extends StringPath<TForm>
> = Omit<FormSingleDatePickerProps<TForm>, "path" | "control"> & {
	path: TPath;
};

interface FormDateRangePickerProps<
	TForm extends FieldValues,
	TStart extends StringPath<TForm>
> {
	control: Control<TForm>;
	intervalProps: {
		start: IntervalProps<TForm, TStart>;
		end: IntervalProps<TForm, DistinctPaths<TForm, TStart>>;
	};
	className?: string;
}

export const FormDateRangePicker = <
	TForm extends FieldValues,
	TStart extends StringPath<TForm>
>({
	control,
	intervalProps,
	className,
}: FormDateRangePickerProps<TForm, TStart>) => {
	const { watch } = useFormContext<TForm>();

	const startDateValue = watch(intervalProps.start.path);
	const startDate = useMemo(
		() => (startDateValue ? new Date(startDateValue) : undefined),
		[startDateValue]
	);

	const beforeStartDateMatcher: Matcher = useCallback(
		(date: Date) => {
			if (!startDate) return false;
			return date < startDate;
		},
		[startDate]
	);

	const endDateDisabled = useMemo(() => {
		const existingDisabled = intervalProps.end.disabled;
		const combined: Matcher[] = [];

		if (existingDisabled) {
			if (Array.isArray(existingDisabled)) {
				combined.push(...existingDisabled);
			} else {
				combined.push(existingDisabled);
			}
		}

		combined.push(beforeStartDateMatcher);
		return combined;
	}, [beforeStartDateMatcher, intervalProps.end.disabled]);

	return (
		<div className={cn("flex flex-wrap gap-4", className)}>
			<FormSingleDatePicker
				placeholder="From"
				control={control}
				showError
				{...intervalProps.start}
			/>
			<FormSingleDatePicker
				placeholder="To"
				control={control}
				showError
				{...intervalProps.end}
				disabled={endDateDisabled}
			/>
		</div>
	);
};
