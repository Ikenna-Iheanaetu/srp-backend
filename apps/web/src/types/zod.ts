/** @format */

// prettier-ignore
/* eslint-disable @typescript-eslint/no-empty-object-type */

import { z } from "zod";

interface OREmptyLiteral<T extends z.ZodTypeAny> {
	/**
	 * Allows an empty string ("") as a valid value.
	 *
	 * Useful for making optional string fields from web forms truly
	 * optional (as empty form fields send `""` not `undefined`).
	 *
	 * @example
	 * ```tsx
	 * const formSchema = z.object({
	 *  email: z.string().email().empty().optional(), // instead of just z.string().email().optional()
	 * 	anotherEmail: z.string().email().empty(), // this works also but only for native form fields
	 * })
	 * ```
	 *
	 * @debug If getting `TypeError: (intermediate value).empty is not a function`, make sure the implementation file is registered on page load, imported in `src/root.tsx` - `import "./types/zod";`.
	 *
	 * @see {@link https://github.com/colinhacks/zod/issues/310 Zod Issue - Validating optional text inputs}
	 * @see {@link https://github.com/colinhacks/zod/issues/310#issuecomment-2459468691 Discussion comment}
	 */
	empty(): z.ZodUnion<[T, z.ZodLiteral<"">]>;
}

declare module "zod" {
	interface ZodString extends OREmptyLiteral<ZodString> {}
	interface ZodUnion<T extends z.ZodUnionOptions>
		extends OREmptyLiteral<ZodUnion<T>> {}
	interface ZodOptional<T extends z.ZodTypeAny>
		extends OREmptyLiteral<ZodOptional<T>> {}
	interface ZodNumber
		extends OREmptyLiteral<z.ZodType<number, z.ZodNumberDef, number>> {}
}

z.ZodString.prototype.empty = function () {
	// 'function' keyword ensures 'this' refers to the instance; arrow function fails.
	return this.or(z.literal(""));
};
z.ZodUnion.prototype.empty = function () {
	return this.or(z.literal(""));
};
z.ZodOptional.prototype.empty = function () {
	return this.or(z.literal(""));
};
z.ZodNumber.prototype.empty = function () {
	return this.or(z.literal(""));
};
