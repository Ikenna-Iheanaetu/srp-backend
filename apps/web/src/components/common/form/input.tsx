/** @format */

import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import { Control, FieldValues, PathValue } from "react-hook-form";
import { StringOnlyField } from "./form-select";
import {
	FormFieldErrorAndLabelWrapper,
	FormFieldErrorAndLabelWrapperProps,
} from "./wrapper";
import { NumberOnlyField } from "@/types/form";

interface BaseProps<TForm extends FieldValues, TTransformedValues>
	extends SafeOmit<
		FormFieldErrorAndLabelWrapperProps<TForm, TTransformedValues>,
		"children" | "path"
	> {
	path: StringOnlyField<TForm> | NumberOnlyField<TForm>;
	defaultValue?: PathValue<
		TForm,
		BaseProps<TForm, TTransformedValues>["path"]
	>;
	variant?: "input" | "textarea";
}

type InputProps = SafeOmit<
	React.ComponentProps<typeof Input>,
	"children" | "defaultValue"
>;

interface BaseInputVariantProps<TForm extends FieldValues, TTransformedValues>
	extends BaseProps<TForm, TTransformedValues>,
		InputProps {
	variant: "input";
}

type StringLiteralsOnly<T extends string> = T extends unknown
	? string extends T
		? never
		: T
	: never;

interface StringInputVariantProps<TForm extends FieldValues, TTransformedValues>
	extends BaseInputVariantProps<TForm, TTransformedValues> {
	type: StringLiteralsOnly<
		SafeExclude<InputProps["type"], "number" | undefined>
	>;
	path: StringOnlyField<TForm>;
}

interface NumberInputVariantProps<TForm extends FieldValues, TTransformedValues>
	extends BaseInputVariantProps<TForm, TTransformedValues> {
	type: SafeExtract<InputProps["type"], "number">;
	path: NumberOnlyField<TForm>;
}

type InputVariantProps<TForm extends FieldValues, TTransformedValues> =
	| OptionalKeys<StringInputVariantProps<TForm, TTransformedValues>, "type"> // string input is the default variant
	| NumberInputVariantProps<TForm, TTransformedValues>;

type TextareaProps = SafeOmit<
	React.ComponentProps<typeof Textarea>,
	"children" | "defaultValue"
>;

interface TextareaVariantProps<TForm extends FieldValues, TTransformedValues>
	extends BaseProps<TForm, TTransformedValues>,
		TextareaProps {
	variant: "textarea";
	path: StringOnlyField<TForm>;
}

type FormInputProps<TForm extends FieldValues, TTransformedValues> =
	| OptionalKeys<InputVariantProps<TForm, TTransformedValues>, "variant"> // input is the defaultVariant
	| TextareaVariantProps<TForm, TTransformedValues>;

const FormInput = <TForm extends FieldValues, TTransformedValues>(
	passedProps: FormInputProps<TForm, TTransformedValues>,
) => {
	const {
		path,
		label,
		control,
		disabled,
		defaultValue,
		showError = true,
		variant = "input",
		...props
	} = passedProps;

	const checkIsInputProps = (
		_data: InputProps | TextareaProps,
	): _data is InputProps => variant === "input";
	const checkIsTextAreaProps = (
		_data: InputProps | TextareaProps,
	): _data is TextareaProps => variant === "textarea";

	return (
		<FormField
			control={
				control as unknown /* Shadcn didn't use precise types */ as Control<TForm>
			}
			name={path}
			defaultValue={defaultValue}
			render={({ field }) => (
				<FormFieldErrorAndLabelWrapper
					control={control}
					path={path}
					label={label}
					showError={showError}
					disabled={disabled}>
					<FormItem>
						<FormControl>
							{checkIsInputProps(props) ? (
								<Input
									{...props}
									{...field}
									disabled={disabled}
									onChange={(value) => {
										field.onChange(value);
										props.onChange?.(value);
									}}
								/>
							) : (
								checkIsTextAreaProps(props) && (
									<Textarea
										{...props}
										{...field}
										disabled={disabled}
										onChange={(value) => {
											field.onChange(value);
											props.onChange?.(value);
										}}
									/>
								)
							)}
						</FormControl>
					</FormItem>
				</FormFieldErrorAndLabelWrapper>
			)}
		/>
	);
};

export { FormInput };
export type { FormInputProps, InputVariantProps, TextareaVariantProps };
