/** @format */

import { z } from "zod";

/**
 * Basic schema for a required password string.
 * High-level password validation (e.g., confirm password, server-side checks)
 * should be handled separately.
 *
 * @see {@link addPasswordFieldsSchema} for adding password fields with full validation to your form.
 */
const BasePasswordSchema = z.string().min(1, {
	message: "Required field",
});

/**
 * Zod string schema for strong password validation.
 * Enforces:
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character (non-alphanumeric, non-space)
 * - Minimum length of 8 characters
 *
 * @see {@link addPasswordFieldsSchema} if you need to combine this with other
 * password-related fields (e.g., confirm password) in a form.
 */
const StrongPasswordSchema = BasePasswordSchema.regex(
	/[a-z]/,
	"At least one lowercase letter"
)
	.regex(/[A-Z]/, "At least one uppercase letter")
	.regex(/\d/, "At least one number")
	.regex(/[^a-zA-Z0-9\s]/, "At least one special character")
	.min(8, "At least 8 characters long");

export { BasePasswordSchema, StrongPasswordSchema };

/**
 * ### Important Note on `addPasswordFieldsSchema`
 *
 * This helper started simple, but its code became complex to fix critical issues and limitations:
 *
 * -   **Incorrect Schema Types**: The previous version generated incorrect types when extending existing Zod schemas, leading to inconsistent behavior and requiring extra type transformations after `z.infer<>`.
 *
 * -   **Lack of Flexible Field Names**: The initial helper didn't support using different names for password fields.
 *
 * -   **Validation Duplication**: It now centralizes all complex password validation rules, eliminating unnecessary code duplication across the app.
 */

/**
 * Type to dynamically create a ZodRawShape for password fields based on provided keys.
 * This ensures type safety when creating the object with computed property names.
 * @template P The literal string type for the password field key.
 * @template CP The literal string type for the confirm password field key.
 */
type DynamicPasswordShape<P extends string, CP extends string> = Record<
	P,
	z.ZodString
> &
	Record<CP, z.ZodString>;

/**
 * Return type for `addPasswordFieldsSchema` when extending an existing Zod object.
 * It combines the original schema's shape with the dynamically named password fields.
 * @template T The raw shape of the original Zod object.
 * @template P The literal string type for the password field key.
 * @template CP The literal string type for the confirm password field key.
 * @template U Zod's UnknownKeysParam for unknown key handling.
 * @template C Zod's ZodTypeAny for catchall types.
 */
type WithSchema<
	P extends string,
	CP extends string,
	T extends z.ZodRawShape,
	C extends z.ZodTypeAny,
> = z.ZodEffects<
	z.ZodObject<
		z.objectUtil.extendShape<T, DynamicPasswordShape<P, CP>>,
		"strip",
		C
	>
>;

/**
 * Return type for `addPasswordFieldsSchema` when creating a new Zod object
 * consisting only of the dynamically named password fields.
 * @template P The literal string type for the password field key.
 * @template CP The literal string type for the confirm password field key.
 */
type WithoutSchema<P extends string, CP extends string> = z.ZodEffects<
	z.ZodObject<DynamicPasswordShape<P, CP>, "strip", z.ZodTypeAny> // "strip", z.ZodTypeAny are defaults for a fresh new zod object
>;

/**
 * Options for creating a new schema with password fields.
 * @template PKey The literal string type for the password field key, defaults to 'password'.
 * @template CPKey The literal string type for the confirm password field key, defaults to 'confirmPassword'.
 */
interface NewSchemaOptions<
	PKey extends string = "password",
	CPKey extends string = "confirmPassword",
> {
	passwordKey?: PKey;
	confirmPasswordKey?: CPKey;
}

const SCHEMA_KEY = "schema";

/**
 * Options for extending an existing schema with password fields.
 * @template TSchemaShape The raw shape of the Zod schema.
 * @template UParam The unknown keys parameter for the Zod schema.
 * @template CParam The catchall parameter for the Zod schema.
 * @template PKey The literal string type for the password field key, defaults to 'password'.
 * @template CPKey The literal string type for the confirm password field key, defaults to 'confirmPassword'.
 */
interface ExtendSchemaOptions<
	PKey extends string = "password",
	CPKey extends string = "confirmPassword",
	TSchemaShape extends z.ZodRawShape = z.ZodRawShape,
	CParam extends z.ZodTypeAny = z.ZodTypeAny,
> extends NewSchemaOptions<PKey, CPKey> {
	[SCHEMA_KEY]: z.ZodObject<TSchemaShape, "strip", CParam>;
}

/**
 * Overload 1: Creates a new schema with optional custom password field names.
 */
export function addPasswordFieldsSchema<
	P extends string = "password",
	CP extends string = "confirmPassword",
>(options?: NewSchemaOptions<P, CP>): WithoutSchema<P, CP>;

/**
 * Overload 2: Extends an existing schema with optional custom password field names.
 */
export function addPasswordFieldsSchema<
	T extends z.ZodRawShape,
	C extends z.ZodTypeAny,
	P extends string = "password",
	CP extends string = "confirmPassword",
>(options: ExtendSchemaOptions<P, CP, T, C>): WithSchema<P, CP, T, C>;

/**
 * Helper function to add password and confirm password fields to any Zod schema.
 * It can either extend an existing schema or create a new one with just the password fields.
 * Includes validation to ensure password and confirm password fields match.
 */
export function addPasswordFieldsSchema<
	T extends z.ZodRawShape,
	C extends z.ZodTypeAny,
	P extends string = "password",
	CP extends string = "confirmPassword",
>(
	options?: NewSchemaOptions<P, CP> | ExtendSchemaOptions<P, CP, T, C>
): WithoutSchema<P, CP> | WithSchema<P, CP, T, C> {
	const checkIsExtendOption = (
		opts: unknown
	): opts is ExtendSchemaOptions<P, CP, T, C> =>
		typeof opts === "object" &&
		opts !== null &&
		SCHEMA_KEY in opts &&
		!!opts[SCHEMA_KEY];

	const schema = checkIsExtendOption(options) ? options.schema : undefined;
	const passwordKey = options?.passwordKey ?? "password";
	const confirmPasswordKey = options?.confirmPasswordKey ?? "confirmPassword";

	const dynamicPasswordFields = {
		[passwordKey]: StrongPasswordSchema,
		[confirmPasswordKey]: BasePasswordSchema, // Confirm password typically doesn't need full validation, just matching
	} as Record<typeof passwordKey | typeof confirmPasswordKey, z.ZodString>;

	const refinementPath = [confirmPasswordKey];

	const checkAreEqual = (a: string, b: string) => a === b;

	if (schema) {
		return schema
			.extend(dynamicPasswordFields)
			.refine(
				(data) =>
					checkAreEqual(data[passwordKey], data[confirmPasswordKey]),
				{
					message: "Passwords do not match",
					path: refinementPath,
				}
			);
	}

	return z
		.object(dynamicPasswordFields)
		.refine(
			(data) =>
				checkAreEqual(data[passwordKey], data[confirmPasswordKey]),
			{
				message: "Passwords do not match",
				path: refinementPath,
			}
		);
}
