/** @format */

import { TREE_PATH_SEPERATOR } from "@/constants/tree-ui";

/**Removes trailing slash - `/` from a string.
 *
 * @example
 * Mostly used with routes to clear trailing slash.
 * ```typescript
 * const route = "/jobs/";
 * removeTrailingSlash(route); // route = "/jobs"
 */
const removeTrailingSlash = (value: string): string =>
	value === "/" ? value : value.replace(/\/$/, "");

type TreePath = `${string}${typeof TREE_PATH_SEPERATOR}${string}`;

type TreePathDominantItem<T extends string> =
	T extends `${string}${typeof TREE_PATH_SEPERATOR}${infer Tail}`
		? TreePathDominantItem<Tail>
		: T;

/**
 * Extracts the dominant item from a {@link TreePath},
 * which is the last segment after splitting by the separator.
 */
const getPathDominantItem = <T extends string>(
	treePath: T
): TreePathDominantItem<T> => {
	const pathSegments = treePath.split(TREE_PATH_SEPERATOR);
	return pathSegments[pathSegments.length - 1] as TreePathDominantItem<T>;
};

export { getPathDominantItem, removeTrailingSlash };
export type { TreePath, TreePathDominantItem };
