/** @format */

import React from "react";
import {
	FieldPathValue,
	FieldValues,
	Path,
	type PathValue,
} from "react-hook-form";
import { AutocompleteString } from ".";

/**
 * Type constraint to ensure the field can accept File or string values.
 * * Allows path to support other types.
 */
export type StringOrFileUnionPath<TForm extends FieldValues> = {
	[P in Path<TForm>]: string | File extends FieldPathValue<TForm, P>
		? string extends FieldPathValue<TForm, P>
			? File extends FieldPathValue<TForm, P>
				? P
				: never
			: never
		: never;
}[Path<TForm>];

/**
 * Path to an array field in TForm where elements must include both string and File, allowing additional types.
 */
export type StringOrFileArrayPath<TForm extends FieldValues> = {
	[P in Path<TForm>]: (string | File)[] extends FieldPathValue<TForm, P>
		? string extends FieldPathValue<TForm, P>[number]
			? File extends FieldPathValue<TForm, P>[number]
				? P
				: never
			: never
		: never;
}[Path<TForm>];

export type StringArrayPath<T extends FieldValues> = {
	[K in Path<T>]: string[] extends PathValue<T, K> ? K : never;
}[Path<T>];

/** Generic type for array index paths that resolves to `string | undefined` */
export type ArrayStringOrUndefinedPath<TForm extends FieldValues> = {
	[K in Path<TForm>]: K extends `${infer Base}.${number}`
		? Base extends Path<TForm>
			? PathValue<TForm, K> extends string | undefined
				? K
				: string | undefined extends PathValue<TForm, K>
				? K
				: never
			: never
		: never;
}[Path<TForm>];

/** Generic type for paths that resolves to `(string | undefined)[]` */
export type StringOrUndefinedArrayPath<TForm extends FieldValues> = Record<
	Path<TForm>,
	ArrayStringOrUndefinedPath<TForm> extends `${infer Base}.${number}`
		? Base
		: never
>[Path<TForm>];

type IsStringOrStringLike<T> = T extends string ? T : never;
/**Only fields which can support `string` is valid (can include other types, but string is a must)*/
export type StringOnlyField<TForm extends FieldValues> = {
	[P in Path<TForm>]: IsStringOrStringLike<PathValue<TForm, P>> extends never
		? never
		: P;
}[Path<TForm>];

/**Only fields which can support `number` is valid (can include other types, but number is a must)*/
export type NumberOnlyField<TForm extends FieldValues> = {
	[P in Path<TForm>]: PathValue<TForm, P> extends number
		? P
		: number extends PathValue<TForm, P>
		? P
		: never;
}[Path<TForm>];

export interface FormFieldBuilder<TForm extends FieldValues> {
	path: Path<TForm>;
	type: AutocompleteString<React.HTMLInputTypeAttribute>;
	label: string;
	placeholder: string;
}
