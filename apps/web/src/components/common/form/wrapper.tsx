/** @format */

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";
import {
	ArrayPath,
	Control,
	FieldValues,
	FormProvider,
	Path,
	UseFormReturn,
} from "react-hook-form";
import FormErrorLabel from "./error-label";
import FormErrorMessage from "./form-error-message";

interface FormFieldErrorAndLabelWrapperProps<
	TForm extends FieldValues,
	TTransformedValues = TForm,
> {
	children: React.ReactNode;
	control: Control<TForm, unknown, TTransformedValues>;
	path: Path<TForm> | ArrayPath<TForm>;
	className?: string;
	label?: ReactNode;
	htmlFor?: string;
	showError?: boolean;
	disabled?: boolean;
}

const FormFieldErrorAndLabelWrapper = <
	TForm extends FieldValues,
	TTransformedValues,
>({
	children,
	path,
	control,
	className,
	label,
	htmlFor,
	disabled,
	showError = true,
}: FormFieldErrorAndLabelWrapperProps<TForm, TTransformedValues>) => {
	const errorMessageLabel: string =
		typeof label === "string" || typeof label === "number"
			? String(label)
			: path;
	return (
		<div
			className={cn(
				"relative mb-8 flex flex-col gap-4",
				disabled &&
					"cursor-not-allowed opacity-50 [&_*]:!pointer-events-none [&_*]:!cursor-not-allowed",
				className,
			)}>
			{label && (
				<FormErrorLabel path={path} control={control} htmlFor={htmlFor}>
					{label}
				</FormErrorLabel>
			)}

			{children}

			{showError && (
				<FormErrorMessage
					control={control}
					path={path}
					fieldLabel={errorMessageLabel}
					className="static"
				/>
			)}
		</div>
	);
};

interface FormProviderWrapperProps<
	TForm extends FieldValues,
	TContext = unknown,
	TTransformedValues = TForm,
> extends Omit<React.ComponentProps<"form">, "onSubmit"> {
	form: UseFormReturn<TForm, TContext, TTransformedValues>;
	children: React.ReactNode;
	onSubmit: (data: TTransformedValues) => void;
}

const FormProviderWrapper = <
	TForm extends FieldValues,
	TContext = unknown,
	TTransformedValues = TForm,
>({
	children,
	onSubmit,
	form,
	className,
	...props
}: FormProviderWrapperProps<TForm, TContext, TTransformedValues>) => {
	return (
		<FormProvider {...form}>
			<form
				{...props}
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className={cn("space-y-4", className)}>
				{children}
			</form>
		</FormProvider>
	);
};

export { FormProviderWrapper, FormFieldErrorAndLabelWrapper };
export type { FormProviderWrapperProps, FormFieldErrorAndLabelWrapperProps };
