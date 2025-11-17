/** @format */

import {
	FormSelect,
	FormSelectTrigger,
} from "@/components/common/form/form-select";
import { FormFieldErrorAndLabelWrapper } from "@/components/common/form/wrapper";
import {
	MultiOptionsSelect,
	MultiSelectOption,
} from "@/components/common/multi-options-select";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { EmploymentTypeEnumsSchema } from "@/lib/schemas/work-experience";
import React from "react";
import { useFormContext } from "react-hook-form";
import {
	PLAYER_MAX_SECONDARY_EMPLOYMENT_TYPES,
	PlayerStep2FormValues,
} from "./form-schema";

export const EmploymentTypesSection = () => {
	const form = useFormContext<PlayerStep2FormValues>();

	const selectedSecondary = form.watch("employmentType.secondary");

	const primaryOptions = React.useMemo(() => {
		const options: string[] = [];
		EmploymentTypeEnumsSchema.options.forEach((value) => {
			if (selectedSecondary?.includes(value)) {
				return;
			}
			options.push(value);
		});
		return options;
	}, [selectedSecondary]);

	const selectedPrimary = form.watch("employmentType.primary");

	const secondaryOptions = React.useMemo(() => {
		const options: MultiSelectOption[] = [];
		EmploymentTypeEnumsSchema.options.forEach((value) => {
			if (value !== selectedPrimary) {
				options.push({
					value,
					label: value,
				});
			}
		});
		return options;
	}, [selectedPrimary]);

	return (
		<FormFieldErrorAndLabelWrapper
			control={form.control}
			path={"employmentType"}
			label={"Employment Types"}
			showError={true}>
			<div className="pl-4">
				<FormSelect
					control={form.control}
					path="employmentType.primary"
					label={
						<span className="text-slate-700">
							Primary Employment Type
						</span>
					}>
					<FormSelectTrigger className="capitalize w-fit">
						<SelectValue placeholder="Select employment type" />
					</FormSelectTrigger>

					<SelectContent className="w-fit">
						{primaryOptions.map((option) => (
							<SelectItem
								key={option}
								value={option}
								className="capitalize">
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</FormSelect>

				<FormField
					control={form.control}
					name={"employmentType.secondary"}
					render={({ field }) => (
						<FormFieldErrorAndLabelWrapper
							control={form.control}
							path={"employmentType.secondary"}
							label={
								<span className="text-slate-700">
									Secondary Employment Types
								</span>
							}
							showError={true}>
							<FormItem>
								<FormControl>
									<MultiOptionsSelect
										options={secondaryOptions}
										selectedOptions={field.value?.map(
											(value) => ({
												value,
												label: value,
											})
										)}
										onChange={(newOptions) => {
											field.onChange(
												newOptions.map(
													(option) => option.value
												)
											);
										}}
										maxSelections={
											PLAYER_MAX_SECONDARY_EMPLOYMENT_TYPES
										}
										searchInputPlaceholder="Search employment types"
										addButtonText="Add employment type"
										filteredLabel="Filtered employment types"
										selectedLabel="Selected employment types"
									/>
								</FormControl>
							</FormItem>
						</FormFieldErrorAndLabelWrapper>
					)}
				/>
			</div>
		</FormFieldErrorAndLabelWrapper>
	);
};
