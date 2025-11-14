/** @format */
import { FormField, FormItem } from "@/components/ui/form";
import { TREE_PATH_SEPERATOR } from "@/constants/tree-ui";
import { COMPANY_INDUSTRY_TREE, PLAYER_INDUSTRY_TREE } from "@/data/tree-data";
import { ClubReferredUserType } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { StringOnlyField } from "@/types/form";
import { ReactNode } from "react";
import { Control, FieldValues } from "react-hook-form";
import { TreeSelection } from "../tree-select";
import { DefaultTreeNode } from "../tree-select/types";
import { FormFieldErrorAndLabelWrapper } from "./wrapper";
import { Badge } from "@/components/ui/badge";
import { getPathDominantItem } from "@/lib/helper-functions/generic-string-helpers";

interface BaseProps<TForm extends FieldValues> {
	control: Control<TForm>;
	path: StringOnlyField<TForm>;
	placeholder?: string;
	label?: ReactNode;
	showError?: boolean;
	/**@deprecated use the `userType` prop instead */
	isCompany?: boolean;
}

interface WithOptions<TForm extends FieldValues> extends BaseProps<TForm> {
	options: DefaultTreeNode[];
	userType?: never;
}

interface WithoutOptions<TForm extends FieldValues> extends BaseProps<TForm> {
	/**To be used when you don't have options to pass in.
	 * Then internal options specific to the allowed user types is used instead.
	 *
	 * **NOTE**: user type "player" to also cover for "supporter", since their libs are interchangable.
	 *
	 * @default "company"
	 */
	userType?: ClubReferredUserType;
	options?: never;
}

type Props<TForm extends FieldValues> =
	| WithOptions<TForm>
	| WithoutOptions<TForm>;

const checkIsString = (value: unknown): value is string =>
	typeof value === "string" || value instanceof String;

export const FormIndustryTreeSelect = <TForm extends FieldValues>({
	control,
	path,
	label = "Industry",
	showError = true,
	options,
	isCompany,
	userType = "company",
}: Props<TForm>) => {
	return (
		<FormField
			control={control}
			name={path}
			render={({ field }) => (
				<FormFieldErrorAndLabelWrapper
					control={control}
					path={path}
					label={label}
					showError={showError}>
					<FormItem>
						<p>
							Selected:{" "}
							<Badge>
								{checkIsString(field.value)
									? getPathDominantItem(field.value)
									: "None"}
							</Badge>
						</p>
						<TreeSelection
							variant="default"
							data={
								options ?? // isCompany to be removed
								(isCompany || userType === "company"
									? COMPANY_INDUSTRY_TREE
									: PLAYER_INDUSTRY_TREE)
							}
							onSelectionChange={(selection) =>
								field.onChange(
									selection.join(TREE_PATH_SEPERATOR)
								)
							}
							controlledSelection={
								checkIsString(field.value)
									? (field.value as string).split(
											TREE_PATH_SEPERATOR
									  )
									: undefined
							}
						/>
					</FormItem>
				</FormFieldErrorAndLabelWrapper>
			)}
		/>
	);
};
