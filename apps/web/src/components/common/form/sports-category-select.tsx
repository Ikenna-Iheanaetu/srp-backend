/** @format */
import {
	FormSelect,
	FormSelectTrigger,
	StringOnlyField,
} from "@/components/common/form/form-select";
import { SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ReactNode } from "react";
import { Control, FieldValues } from "react-hook-form";
import SPORT_CATEGORIES from "@/data/sport-categories.json";

export interface FormSportsCategorySelectProps<TForm extends FieldValues> {
	control: Control<TForm>;
	path: StringOnlyField<TForm>;
	placeholder?: string;
	label?: ReactNode;
	showError?: boolean;
}

export const FormSportsCategorySelect = <TForm extends FieldValues>({
	control,
	path,
	placeholder = "Choose a sports category",
	label = "Sports Category",
	showError = true,
}: FormSportsCategorySelectProps<TForm>) => {
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
					return SPORT_CATEGORIES.map((category, index) => (
						<SelectItem
							key={category + index}
							value={category}
							className="max-w-60 overflow-auto">
							{category}
						</SelectItem>
					));
				})()}
			</SelectContent>
		</FormSelect>
	);
};
