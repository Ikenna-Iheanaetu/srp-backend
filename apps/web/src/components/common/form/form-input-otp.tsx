/** @format */

import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { InputOTP, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { StringOnlyField } from "@/types/form";
import { OTPInputContext } from "input-otp";
import React, { FC, useContext } from "react";
import { Control, FieldValues } from "react-hook-form";
import { FormFieldErrorAndLabelWrapper } from "./wrapper";

type FormInputOTPProps<TForm extends FieldValues> = React.ComponentProps<
	typeof InputOTP
> & {
	control: Control<TForm>;
	path: StringOnlyField<TForm>;
	label?: React.ReactNode;
	showError?: boolean;
};

/**To be used inside a `FormProvider` - React Hook Form
 *
 * Composition matches your normal `InputOTP` from *Shadcn UI* but integrates
 * with React Hook Form.
 */
const FormInputOTP = <TForm extends FieldValues>({
	control,
	path,
	onChange,
	defaultValue,
	label,
	disabled,
	showError = true,
	...props
}: FormInputOTPProps<TForm>) => {
	return (
		<FormField
			control={control}
			name={path}
			render={({ field }) => (
				<FormFieldErrorAndLabelWrapper
					control={control}
					path={path}
					label={label}
					showError={showError}
					disabled={disabled}>
					<FormItem>
						<FormControl>
							<InputOTP
								{...props}
								{...field}
								disabled={disabled}
								onChange={(value) => {
									field.onChange(value);
									onChange?.(value);
								}}
								defaultValue={defaultValue ?? field.value}
							/>
						</FormControl>
					</FormItem>
				</FormFieldErrorAndLabelWrapper>
			)}
		/>
	);
};

const FormInputOTPSlot: FC<React.ComponentProps<typeof InputOTPSlot>> = ({
	index,
	className,
	...props
}) => {
	const { slots } = useContext(OTPInputContext);
	const slot = slots[index];
	if (!slot) {
		throw new Error(`no longer provided for the index: ${index}`);
	}
	const { isActive } = slot;

	return (
		<InputOTPSlot
			{...props}
			index={index}
			className={cn(isActive && "ring-2 ring-blue-700", className)}
		/>
	);
};

export { FormInputOTP, FormInputOTPSlot };
