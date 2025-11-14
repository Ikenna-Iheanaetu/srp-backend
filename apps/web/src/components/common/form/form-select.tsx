/** @format */

// prettier-ignore
/* eslint-disable @typescript-eslint/unbound-method */

import {
	FormControl,
	FormField,
	FormItem,
	useFormField,
} from "@/components/ui/form";
import { Select, SelectTrigger } from "@/components/ui/select";
import { SelectProps, SelectTriggerProps } from "@radix-ui/react-select";
import React from "react";
import { Control, FieldValues, PathValue } from "react-hook-form";
import { FormFieldErrorAndLabelWrapper } from "./wrapper";
import { StringOnlyField } from "@/types/form";

interface FormSelectProps<
	TForm extends FieldValues = FieldValues,
	TPath extends StringOnlyField<TForm> = StringOnlyField<TForm>
> extends SelectProps {
	control: Control<TForm>;
	path: TPath;
	defaultValue?: PathValue<TForm, TPath>;
	label?: React.ReactNode;
	showError?: boolean;
}

/**To be used inside a `FormProvider` - React Hook Form
 * * Use with {@link FormSelectTrigger} instead of `SelectTrigger`.
 * * Composition matches your normal `Select` from *Shadcn UI* but integrates
 * with React Hook Form.
 */
const FormSelect = <
	TForm extends FieldValues = FieldValues,
	TPath extends StringOnlyField<TForm> = StringOnlyField<TForm>
>({
	control,
	path,
	onValueChange,
	defaultValue,
	label,
	showError = true,
	...props
}: FormSelectProps<TForm, TPath>) => {
	return (
		<FormField
			control={control}
			name={path}
			defaultValue={defaultValue}
			render={({ field }) => (
				<FormFieldErrorAndLabelWrapper
					control={control}
					path={path}
					label={label}
					showError={showError}>
					<FormItem>
						<Select
							onValueChange={(value) => {
								field.onChange(value);
								onValueChange?.(value);
							}}
							value={field.value}
							{...props}
						/>
					</FormItem>
				</FormFieldErrorAndLabelWrapper>
			)}
		/>
	);
};

interface FormSelectTriggerProps extends SelectTriggerProps {
	children: React.ReactNode;
}

/**
 * Use with {@link FormSelect} instead of `Select` from Shadcn UI.
 * * Composition matches your normal `SelectTrigger` from *Shadcn UI* but
 * integrates with React Hook Form.
 * * Don't forget to add your `SelectValue`.
 */
const FormSelectTrigger = (props: FormSelectTriggerProps) => {
	const { formItemId } = useFormField(); // Ensure form context is available

	return (
		<FormControl>
			<SelectTrigger
				{...props}
				id={formItemId} // Ensure proper ID for label association
			/>
		</FormControl>
	);
};

export { FormSelect, FormSelectTrigger, type StringOnlyField };
