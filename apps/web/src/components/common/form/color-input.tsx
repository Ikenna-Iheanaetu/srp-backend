/** @format */
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { StringOnlyField } from "@/types/form";
import { type ReactNode } from "react";
import {
	PathValue,
	useFormContext,
	type Control,
	type FieldValues,
} from "react-hook-form";
import { FormFieldErrorAndLabelWrapper } from "./wrapper";

interface FormColorInputProps<TForm extends FieldValues> {
	control: Control<TForm>;
	path: StringOnlyField<TForm>;
	placeholder?: string;
	label?: ReactNode;
	showError?: boolean;
	disabled?: boolean;
	className?: string;
	defaultValue?: PathValue<TForm, FormColorInputProps<TForm>["path"]>;
}

export const FormColorInput = <TForm extends FieldValues>({
	control,
	path,
	defaultValue = "#1d4ed8" as PathValue<TForm, typeof path>,
	placeholder = defaultValue, // blue-700
	label = "Color",
	showError = true,
	disabled = false,
	className,
}: FormColorInputProps<TForm>) => {
	const { trigger } = useFormContext<TForm>();
	return (
		<FormField
			control={control}
			defaultValue={defaultValue}
			name={path}
			render={({ field: fieldProp }) => {
				const field: typeof fieldProp = {
					...fieldProp,
					onChange: (event) => {
						fieldProp.onChange(event);
						// this needs to be validated on change for good UX
						void trigger(path);
					},
				};

				return (
					<FormFieldErrorAndLabelWrapper
						control={control}
						path={path}
						label={label}
						showError={showError}
						disabled={disabled}
						className={className}>
						<FormItem className="flex items-center gap-3">
							<FormControl>
								<Input
									type="color"
									placeholder={placeholder}
									disabled={disabled}
									className="w-16 h-10 p-1 border rounded cursor-pointer"
									{...field}
								/>
							</FormControl>

							<FormControl>
								<Input
									type="text"
									placeholder={placeholder}
									disabled={disabled}
									className="flex-1"
									{...field}
								/>
							</FormControl>
						</FormItem>
					</FormFieldErrorAndLabelWrapper>
				);
			}}
		/>
	);
};
