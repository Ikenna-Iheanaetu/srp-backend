/** @format */
import {
	FormSelect,
	FormSelectTrigger,
	StringOnlyField,
} from "@/components/common/form/form-select";
import { SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import REGIONS from "@/data/regions.json";
import { ReactNode } from "react";
import { Control, FieldValues } from "react-hook-form";

interface Props<TForm extends FieldValues> {
	control: Control<TForm>;
	path: StringOnlyField<TForm>;
	placeholder?: string;
	label?: ReactNode;
	showError?: boolean;
}

export const FormRegionsSelect = <TForm extends FieldValues>({
	control,
	path,
	placeholder = "Choose a region",
	label = "Region",
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
					return REGIONS.map((region, index) => (
						<SelectItem
							key={region + index}
							value={region}
							className="max-w-60 overflow-auto">
							{region}
						</SelectItem>
					));
				})()}
			</SelectContent>
		</FormSelect>
	);
};
