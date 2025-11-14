/** @format */

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SwitchProps } from "@radix-ui/react-switch";
import { ReactNode } from "react";
import type { Control, FieldValues, Path, PathValue } from "react-hook-form";

type BooleanPath<TForm extends FieldValues> = {
	[K in Path<TForm>]: boolean extends PathValue<TForm, K> ? K : never;
}[Path<TForm>];

type FormSwitchToggleProps<TForm extends FieldValues> = Pick<
	SwitchProps,
	"className" | "onCheckedChange"
> & {
	control: Control<TForm>;
	path: BooleanPath<TForm>;
	leftLabel?: string;
	rightLabel?: ReactNode;
};

const FormSwitchToggle = <TForm extends FieldValues>({
	control,
	path,
	leftLabel,
	rightLabel,
	className,
	onCheckedChange,
}: FormSwitchToggleProps<TForm>) => {
	return (
		<FormField
			control={control}
			name={path}
			render={({ field }) => (
				<FormItem
					className={cn(
						"relative text-sm flex items-center gap-2 capitalize",
						className
					)}>
					{leftLabel && <FormLabel>{leftLabel}</FormLabel>}

					<FormControl>
						<Switch
							type="button"
							checked={field.value}
							onCheckedChange={(value) => {
								field.onChange(value);
								onCheckedChange?.(value);
							}}
							aria-readonly={field.disabled}
							className="data-[state=checked]:bg-blue-700"
						/>
					</FormControl>

					{rightLabel && <FormLabel>{rightLabel}</FormLabel>}
				</FormItem>
			)}
		/>
	);
};

export default FormSwitchToggle;
