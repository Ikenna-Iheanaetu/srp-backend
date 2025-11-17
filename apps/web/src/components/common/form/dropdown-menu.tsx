/** @format */

import {
	DropdownMenuCheckboxItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	FormControl,
	FormField,
	FormItem,
	useFormField,
} from "@/components/ui/form";
import {
	DropdownMenuCheckboxItemProps,
	DropdownMenuTriggerProps,
} from "@radix-ui/react-dropdown-menu";
import React from "react";
import { Control, FieldValues, Path, PathValue } from "react-hook-form";

export type StringOrNullArrayItemPath<TForm extends FieldValues> = {
	[K in Path<TForm>]: K extends `${infer Base}.${number}`
		? Base extends Path<TForm>
			? PathValue<TForm, K> extends string | null
				? K
				: string | null extends PathValue<TForm, K>
				? K
				: never
			: never
		: never;
}[Path<TForm>];

interface FormDropdownMenuCheckboxItemProps<
	TForm extends FieldValues,
	TPath extends StringOrNullArrayItemPath<TForm> = StringOrNullArrayItemPath<TForm>
> extends SafeOmit<
		DropdownMenuCheckboxItemProps,
		"checked" | "onCheckedChange"
	> {
	control: Control<TForm>;
	path: TPath;
	value: PathValue<TForm, TPath> & string;
}

/**
 * To be used inside a `FormProvider` - React Hook Form
 * * Use with {@link FormDropdownMenuTrigger} instead of `DropdownMenuTrigger`.
 * * Composition matches your normal `DropdownMenu` from *Shadcn UI* but integrates
 * with React Hook Form.
 *
 * **NOTE**: This component requires you to manually filter out undefined items from the parent array field in the form, during form submission.
 */
const FormDropdownMenuCheckboxItem = <
	TForm extends FieldValues,
	TPath extends StringOrNullArrayItemPath<TForm> = StringOrNullArrayItemPath<TForm>
>({
	control,
	path,
	value,
	...props
}: FormDropdownMenuCheckboxItemProps<TForm, TPath>) => {
	return (
		<FormField
			control={control}
			name={path}
			render={({ field }) => {
				const isChecked = field.value === value;

				return (
					<FormItem>
						<DropdownMenuCheckboxItem
							{...props}
							checked={isChecked}
							onCheckedChange={(isChecked) => {
								field.onChange(isChecked ? value : null);
							}}
						/>
					</FormItem>
				);
			}}
		/>
	);
};

type FormDropdownMenuTriggerProps = SafeOmit<DropdownMenuTriggerProps, "id">;

/**
 * Use instead of `DropdownMenuTrigger`  when you're using a form dropdown component like {@link FormDropdownMenuCheckboxItem}..
 * * Composition matches your normal `DropdownMenuTrigger` from *Shadcn UI* but
 * integrates with React Hook Form.
 */
const FormDropdownMenuTrigger: React.FC<FormDropdownMenuTriggerProps> = (
	props
) => {
	const { formItemId } = useFormField(); // Ensure form context is available

	return (
		<FormControl>
			<DropdownMenuTrigger
				{...props}
				id={formItemId} // Ensure proper ID for label association
			/>
		</FormControl>
	);
};

export { FormDropdownMenuCheckboxItem, FormDropdownMenuTrigger };
export type { FormDropdownMenuCheckboxItemProps, FormDropdownMenuTriggerProps };
