/** @format */

import { apiErrorSignal } from "@/lib/axios-instance/api-error-signal";
import { isAxiosExpiredTokenError } from "@/lib/axios-instance/utils";
import { AuthStatus, AuthSuccess, AuthSuccessSchema } from "@/lib/schemas/auth";
import { UserType } from "@/lib/schemas/user";
import { getErrorMessage } from "@/lib/utils";
import React, { useEffect } from "react";
import { getAuthStatusFromCookies } from "../routes/auth/cookie-management/get-auth-status-helper";
import { logoutUser, useLogout } from "./use-logout";
import { href, useNavigate } from "react-router";

// An assertion function to ensure the auth status is a success state.
function assertIsAuthenticated(
	authStatus: AuthStatus,
): asserts authStatus is AuthSuccess {
	AuthSuccessSchema.parse(authStatus);
}

type AssertUserTypes = UserType[];

function assertUserTypes<T extends AssertUserTypes>(
	authStatus: AuthSuccess,
	requiredUserTypes: T,
): asserts authStatus is AuthSuccess & { cookies: { userType: T[number] } } {
	if (!requiredUserTypes.includes(authStatus.cookies.userType as T[number])) {
		throw new Error(
			`Authentication failed: User type '${
				authStatus.cookies.userType
			}' does not match the required types: ${requiredUserTypes.join(
				", ",
			)}.`,
		);
	}
}

type UseAuthStatusOptions<T extends AssertUserTypes> =
	| {
			assertAuthenticated?: false;
			userTypesToAssert?: never;
	  }
	| {
			assertAuthenticated: true;
			userTypesToAssert?: undefined;
	  }
	| {
			assertAuthenticated: true;
			userTypesToAssert: T;
	  };

/**
 * @deprecated Use the options object instead.
 * @param shouldAssertIsAuthenticated - If true, asserts that the returned auth status must be AuthSuccess.
 * @throws {Error} If `shouldAssertIsAuthenticated` is true and the auth status is not AuthSuccess.
 */
export function useAuthStatus(shouldAssertIsAuthenticated: true): AuthSuccess;

/**
 * @deprecated Use the options object instead.
 * @param shouldAssertIsAuthenticated - If false, prevents asserting an authenticated state.
 */
export function useAuthStatus(shouldAssertIsAuthenticated: false): AuthStatus;

export function useAuthStatus(options?: {
	assertAuthenticated?: false;
}): AuthStatus;

export function useAuthStatus(options: {
	assertAuthenticated: true;
	userTypesToAssert?: never;
}): AuthSuccess;

export function useAuthStatus<T extends AssertUserTypes>(options: {
	assertAuthenticated: true;
	userTypesToAssert: T;
}): AuthSuccess & { cookies: { userType: T[number] } };

// TODO: Write tests for this hook, very important because it's used throughout the app.
export function useAuthStatus<T extends AssertUserTypes>(
	options?: boolean | UseAuthStatusOptions<T>,
): AuthStatus {
	const [auth, setAuth] = React.useState<AuthStatus>(
		getAuthStatusFromCookies,
	);

	const assertAuthenticated =
		typeof options === "boolean"
			? options
			: (options?.assertAuthenticated ?? false);

	const userTypesToAssertOption =
		typeof options === "object" ? options.userTypesToAssert : undefined;

	const navigate = useNavigate();
	const { mutate: logout } = useLogout();

	React.useMemo(() => {
		try {
			if (assertAuthenticated) {
				assertIsAuthenticated(auth);
				if (userTypesToAssertOption) {
					assertUserTypes(auth, userTypesToAssertOption);
				}
			}
		} catch {
			void navigate(href("/login"));
			logout(); // user also has to be logged out from the api side
			// NOTE: state update to unauthenticated is unnecessary here, since the navigation to login unmounts this component.

			// throw error
		}
	}, [assertAuthenticated, auth, userTypesToAssertOption, navigate, logout]);

	const handleApiAuthErrors = React.useCallback((error: unknown) => {
		if (isAxiosExpiredTokenError(error)) {
			// NOTE: Do not redirect to login route. Caller of the hook is expected to handle that from the below state update.

			logoutUser(); // didn't use the useLogout hook cause we already know user is no longer authenticated in the api side.
			setAuth((prev) => ({
				...prev,
				isAuthenticated: false,
				cookies: null,
				error: {
					type: "INVALID_SESSION_API_ERROR",
					message: getErrorMessage(error),
				},
			}));
		}
	}, []);

	useEffect(() => {
		const unsubscribe = apiErrorSignal.subscribe(handleApiAuthErrors);
		return () => unsubscribe();
	}, [handleApiAuthErrors]);

	return auth;
}
