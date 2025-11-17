/** @format */

import {
	FormSelect,
	FormSelectTrigger,
	StringOnlyField,
} from "@/components/common/form/form-select";
import LoadingIndicator from "@/components/common/loading-indicator";
import { SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import useCountriesApi from "@/hooks/use-countries-api";
import { ReactNode } from "react";
import { Control, FieldValues } from "react-hook-form";

interface Props<TForm extends FieldValues> {
	control: Control<TForm>;
	path: StringOnlyField<TForm>;
	placeholder?: string;
	label?: ReactNode;
	showError?: boolean;
}

/**Use inside a `FormProvider` React Hook Form */
const FormCountrySelect = <TForm extends FieldValues>({
	control,
	path,
	placeholder = "Choose a country",
	label,
	showError = true,
}: Props<TForm>) => {
	const { data: countries } = useCountriesApi({
		urlParams: { fields: ["name"] },
	});

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
					if (!countries) {
						return <LoadingIndicator />;
					}

					const sortedNames = countries
						.map(({ name }) => name.common)
						.sort();

					return sortedNames.map((commonName, index) => (
						<SelectItem
							key={commonName + index}
							value={commonName}
							className="max-w-60 overflow-auto">
							{commonName}
						</SelectItem>
					));
				})()}
			</SelectContent>
		</FormSelect>
	);
};

export default FormCountrySelect;
