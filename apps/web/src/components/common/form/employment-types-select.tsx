/** @format */
import {
	FormSelect,
	FormSelectTrigger,
	StringOnlyField,
} from "@/components/common/form/form-select";
import { SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { EMPLOYMENT_TYPE_OPTIONS } from "@/constants/data";
import { replaceUnderscoresWithSpaces } from "@/lib/utils";
import { ReactNode } from "react";
import { Control, FieldValues } from "react-hook-form";

interface Props<TForm extends FieldValues> {
	control: Control<TForm>;
	path: StringOnlyField<TForm>;
	placeholder?: string;
	label?: ReactNode;
	showError?: boolean;
}

export const FormEmploymentTypeSelect = <TForm extends FieldValues>({
	control,
	path,
	placeholder = "Select employment type",
	label = "Employment Type",
	showError = true,
}: Props<TForm>) => {
	return (
		<FormSelect
			control={control}
			path={path}
			label={label}
			showError={showError}>
			<FormSelectTrigger>
				<SelectValue placeholder={placeholder} />
			</FormSelectTrigger>

			<SelectContent className="max-w-64">
				{(() => {
					return EMPLOYMENT_TYPE_OPTIONS.map((option, index) => (
						<SelectItem
							key={option + index}
							value={option}
							className="max-w-60 overflow-auto capitalize">
							{replaceUnderscoresWithSpaces(option)}
						</SelectItem>
					));
				})()}
			</SelectContent>
		</FormSelect>
	);
};
