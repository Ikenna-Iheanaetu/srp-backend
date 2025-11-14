/** @format */

// NOTE: Don't add any import/export statements here. So TypeScript treats it as a script not module. That way, we use the types without explicitly importing them.

/**
 * Compares if two types `A` and `B` are exactly equal.
 * Returns `true` if they are identical, otherwise `false`.
 */
type ExpectEqual<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? true
		: false;

/**
 * Asserts that a given type `T` evaluates to `true`.
 * Primarily used with {@link ExpectEqual} for type-level testing to ensure a condition is met.
 * @example
 * // This test will pass because 'string' and 'string' are considered equal by ExpectEqual.
 * type TestStringType = AssertTrue<ExpectEqual<string, string>>;
 *
 * // This test would cause a type error because 'number' and 'string' are not equal.
 * type TestNumberStringError = AssertTrue<ExpectEqual<number, string>>;
 */
type AssertTrue<T extends true> = ExpectEqual<T, true>;

/** @format */

/**
 * Applies an autocomplete hint to a type `T` for better suggestions in unions.
 * It guides TypeScript to prioritize literal union members over `T`.
 *
 * @template T - The base type to apply the hint to (e.g., `string`, `/${string}`).
 * @example
 * ```ts
 * // Use with literals to suggest specific values first, then allow any string:
 * type SpecificItems = "apple" | "banana";
 * type FlexibleItemInput = SpecificItems | AutocompleteHint<string>; // Suggests "apple", "banana"; allows "orange"
 *
 * // Use with template literals to suggest specific paths, then allow any matching path:
 * type KnownRoutes = "/dashboard" | "/settings";
 * type FlexibleRouteInput = KnownRoutes | AutocompleteHint<`/${string}`>; // Suggests "/dashboard", "/settings"; allows "/api/data"
 * ```
 */
type AutocompleteHint<T extends string> = T & { _?: never };

/**
 * Allows autocompletion for specific string literal(s) provided by `T`,
 * while still permitting any other string.
 *
 * @template T - The string literal(s) to suggest in autocomplete.
 * If omitted, the type defaults to a general string, offering autocompletion
 * for any valid string literal you might type in.
 *
 * @see {@link AutocompleteHint}
 */
type AutocompleteString<T extends string = AutocompleteHint<string>> =
	| T
	| AutocompleteHint<string>;

/**
 * Merges types T and U; U's properties override T's on key collision.
 */
type Merge<T, U> = Omit<T, keyof U> & U;

/**A type-safe version of Extract that ensures U is a sub-type of T.*/
type SafeExtract<T, U extends T> = Extract<T, U>;

/**A type-safe version of Exclude that ensures U is a sub-type of T.*/
type SafeExclude<T, U extends T> = Exclude<T, U>;

/**
 * A type-safe version of Omit that ensures K can only be keys of T.
 */
type SafeOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/**Turns a complex intersection of objects into a clean object type */
type Prettify<T> = T extends unknown
	? {
			[K in keyof T]: T[K];
		} & {}
	: never;

/**
 * Converts a union of types (`U = A | B`) into an intersection of those types (`=> A & B`).
 * Useful for merging properties of objects in a union.
 */
type UnionToIntersection<U> = (
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
type RequireKeys<T, K extends keyof T> = T & { [P in K]-?: T[P] };

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
type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

/**
 * Makes all property values of a type T non-nullable.
 */
type NonNullableValues<T> = {
	[K in keyof T]: NonNullable<T[K]>;
};

/**
 * Asserts that type `U` is a subtype of type `T`.
 *
 * If `U` is a subtype of `T`, it returns `U`; otherwise,
 * TypeScript errors.
 *
 * This is crucial for **type-safety**, ensuring `U` conforms to `T`.
 */
type AssertSubtype<T, U extends T> = U;

/**
 * Ensures an object has all the keys of type `T`, allowing any value type (`U`).
 *
 * Useful with `satisfies` keyword to validate key presence with/without strict value type matching.
 */
type HasKeysOf<T, U = unknown> = Record<keyof T, U>;

/**
 * Creates a branded type, a type-safe way to distinguish between
 * values of the same underlying type.
 *
 * @template T The underlying type.
 * @template B The unique brand literal.
 */
type Brand<T, B> = T & { __brand: B };
