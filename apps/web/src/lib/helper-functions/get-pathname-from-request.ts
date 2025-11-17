/** @format */

import { removeTrailingSlash } from "./generic-string-helpers";

export const getPathNameFromRequest = (
	request: Request,
	returnPurePath = false
) => {
	const url = new URL(request.url);

	return returnPurePath ? url.pathname : removeTrailingSlash(url.pathname);
};
