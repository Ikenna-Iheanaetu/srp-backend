/** @format */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { GlobalQueryClient } from "@/root";
import { clearAuthCookies } from "@/routes/auth/cookie-management/utils";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { href, useNavigate } from "react-router";

/**
 * Logs out the current user on the client-side by clearing authentication cookies and resetting the global query cache.
 *
 * **NOTE**: Usage of this is only meant for places where you can't use the {@link useLogout} hook, or where only client-side logout is required.
 *
 * @returns {Error | void} Returns an error object if the logout process fails, void otherwise
 *
 * @example
 * ```typescript
 * logoutUser();
 * ```
 */
export const logoutUser = (): Error | void => {
	try {
		clearAuthCookies();
		// Reset TanStack Query cache
		GlobalQueryClient.clear();
	} catch (e) {
		return e as Error;
	}
};

/**
 * Log outs user both on the api side and the client-side, and redirects user to login.
 *
 * **NOTE**: This hook makes no toast notifications. You'll have to handle toasts yourself using the `mutation options {onError, onSuccess}`.
 *
 * **NOTE**: Using `options {onError, onSuccess}` in `UseMutationResult.mutate` will not work becaue log out action would've clear all mutations' states before it can reach the callbacks.
 */
export const useLogout = (
	options: Pick<
		UseMutationOptions<void, unknown, void, void>,
		"onSuccess" | "onError"
	> = {},
) => {
	const navigate = useNavigate();

	return useMutation({
		...options,
		mutationFn: async () => {
			await apiAxiosInstance.post("/auth/logout", undefined, {
				skipUserTypePrefix: true,
			});
		},
		onMutate: async () => {
			await navigate(href("/login"), {
				replace: true,
			});
		},
		onSettled: async () => {
			// Because of the need for auth tokens in the logout api request, we can only clear user info after the request.
			logoutUser();

			// redirect the user again, in case they tried to leave the login page during the api request
			await navigate(href("/login"), {
				replace: true,
			});
		},
		meta: {
			errorMessage: "none",
		},
	});
};
