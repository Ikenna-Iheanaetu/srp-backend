/** @format */

import { getErrorMessage } from "../utils";

/**@deprecated in favour of {@link getErrorMessage} */
export const getApiErrorMessage = (error: unknown) => getErrorMessage(error);
