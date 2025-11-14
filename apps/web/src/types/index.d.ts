/** @format */

import { UserType } from "@/lib/schemas/user";

export type MapUserTypeToValue<
	TObject extends Partial<Record<UserType, unknown>>,
	TKey extends UserType,
> = TKey extends keyof TObject ? TObject[TKey] : never;

/**
 * Removes index signatures from a type while preserving specific property signatures.
 *
 * @template T - The input type from which to remove index signatures
 * @returns A new type with all index signatures removed, keeping only specific property signatures
 *
 * @example
 * ```typescript
 * type Input = {
 *   [key: string]: any;
 *   specificProp: string;
 * }
 *
 * type Result = RemoveIndexSignature<Input>; // { specificProp: string }
 * ```
 */
export type RemoveIndexSignature<T> = {
	[K in keyof T as string extends K
		? never
		: number extends K
			? never
			: K]: T[K];
};

/**Extracts from T only those types that are assignable to U, ensuring U is a subtype of T. */
export type SafeExtract<T, U extends T> = U;

/**Extract from T those types that are assignable to U, ensuring U is a subtype of T */
export type SafeExclude<T, U extends T> = T extends U ? never : T;

/**
 * A type-safe version of Omit that ensures K can only be keys of T.
 */
export type SafeOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Converts a union of types (`U = A | B`) into an intersection of those types (`=> A & B`).
 * Useful for merging properties of objects in a union.
 */
export type UnionToIntersection<U> = (
	U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
	? I
	: never;

/**
 * Makes a subset of keys in an object type required,
 * leaving other keys as they were (either optional or required).
 *
 * @template T - The original object type.
 * @template K - A union of keys from T that should be made required.
 */
type RequireKeys<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

/**
 * Makes a subset of keys in an object type optional,
 * leaving other keys as they were (either optional or required).
 *
 * @template T - The original object type.
 * @template K - A union of keys from T that should be made optional.
 */
type OptionalKeys<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

/**
 * Makes all properties of a type T mutable (removes the readonly modifier).
 */
export type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

/**
 * Checks if the input type T is an object type (excluding arrays, functions, and null).
 * If T is a qualifying object type (`{key: value}` or class instance), it returns T.
 * Otherwise, it returns never.
 *
 * @template T - The type to check.
 */
export type CheckIfObject<T> = T extends object
	? // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
		T extends Function | (unknown[] | readonly unknown[])
		? never
		: T
	: never;

/**Turns a complex intersection of objects into a clean object type */
type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

/**
 * Merges types T and U; U's properties override T's on key collision.
 */
type Merge<T, U> = Omit<T, keyof U> & U;

/**
 * Allows autocompletion for `T` while still permitting any string.
 * @template T - The string literal(s) to suggest in autocomplete.
 */
type AutocompleteString<T extends string> = T | (string & {});
