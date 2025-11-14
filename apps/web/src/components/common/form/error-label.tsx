/** @format */

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LabelProps } from "@radix-ui/react-label";
import {
	Control,
	FieldArrayPath,
	FieldValues,
	Path,
	useFormContext,
} from "react-hook-form";

interface Props<TForm extends FieldValues, TTransformedValues>
	extends LabelProps {
	/**This is just for TypeScript to help in restricting values that can be passed in
	 * as `path` based on the shape of `TForm`.
	 * Not used in any runtime behavior.
	 */
	control: Control<TForm, unknown, TTransformedValues>;
	path: Path<TForm> | FieldArrayPath<TForm>;
}

/**To be used inside a `FormProvider` - React Hook Form.
 * * Renders an asterisk `*` when the associated form field
 * has an error.
 */
const FormErrorLabel = <TForm extends FieldValues, TTransformedValues>({
	path,
	children,
	htmlFor,
	className,
	...props
}: Props<TForm, TTransformedValues>) => {
	const {
		formState: { errors },
	} = useFormContext<TForm, unknown, TTransformedValues>();

	const hasError = !!errors[path];

	const extendedProps = htmlFor
		? { htmlFor, ...props }
		: { htmlFor: path, ...props };

	return (
		<Label
			className={cn(
				"relative w-fit pr-2 text-left text-inherit",
				className,
			)}
			{...extendedProps}>
			{children}
			{hasError && (
				<span className="form-error left-[unset] right-0 top-0 not-italic leading-[unset]">
					*
				</span>
			)}
		</Label>
	);
};

export default FormErrorLabel;
