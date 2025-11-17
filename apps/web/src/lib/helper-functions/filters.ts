/** @format */

import { ArrayParserWithDefault } from "@/hooks/use-filter-by-url-params-nuqs";
import { parseAsArrayOf, parseAsString } from "nuqs";

/**
 * Creates filter parsers with default values
 *
 * @param defaults - An object with default values for each filter
 * @returns A properly typed parsers object for use with useFilterByUrlParams
 */
export function createFilterParsers<
	T extends Record<string | number | symbol, string[]>,
>(defaults: T): { [K in keyof T]: ArrayParserWithDefault<string> } {
	type Result = { [K in keyof T]: ArrayParserWithDefault<string> };

	return Object.entries(defaults).reduce<Partial<Result>>(
		(acc, [key, defaultValue]) => {
			acc[key as keyof T] =
				parseAsArrayOf(parseAsString).withDefault(defaultValue);
			return acc;
		},
		{}
	) as Result;
}
