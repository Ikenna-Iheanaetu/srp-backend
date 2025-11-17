/** @format */

import { getAuthStatusFromCookies } from "@/routes/auth/cookie-management/get-auth-status-helper";
import { href, redirect, RedirectFunction } from "react-router";
import { AuthClientError, AuthSuccess } from "../schemas/auth";
import { UserType } from "../schemas/user";
import { SafeExclude } from "@/types";

type StrictUserType = readonly UserType[];

// Utility type to extract the union of elements from a readonly array/tuple type
type ElementType<T extends readonly unknown[]> = T[number];

interface RedirectHandlersAuthSuccess<TAllowed extends StrictUserType>
	extends AuthSuccess {
	cookies: {
		userType: SafeExclude<UserType, ElementType<TAllowed>>;
		accessToken: string;
		refreshToken: string;
	};
}

// Interface for when a redirect occurs
interface RedirectHandlers<TAllowed extends StrictUserType> {
	redirect: ReturnType<RedirectFunction>;
	/**
	 * Authentication status indicating the user is authenticated, but their type is not among the allowed types,
	 * triggering a redirect.
	 */
	authStatus: RedirectHandlersAuthSuccess<TAllowed>;
}

interface NoRedirectHandlersAuthSuccess<
	TAllowed extends StrictUserType = StrictUserType
> extends AuthSuccess {
	cookies: {
		userType: ElementType<TAllowed>;
		accessToken: string;
		refreshToken: string;
	};
}

// Interface for when no redirect occurs
interface NoRedirectHandlers<TAllowed extends StrictUserType> {
	redirect?: undefined;
	/**
	 * Authentication status, either indicating the user is unauthenticated
	 * or is authenticated with an allowed user type (no redirect required).
	 */
	authStatus: AuthClientError | NoRedirectHandlersAuthSuccess<TAllowed>;
}

/**
 * The result type for the restrictRouteByUserType function, using a discriminated union
 * to ensure type safety regarding the presence of a redirect and the authentication status.
 * It is generic over the allowed user types.
 */
export type RestrictRouteResult<
	TAllowed extends StrictUserType = StrictUserType
> = RedirectHandlers<TAllowed> | NoRedirectHandlers<TAllowed>;

interface RestrictRouteByUserTypeProps<T extends StrictUserType> {
	/**
	 * The route to redirect unauthorized users to. Defaults to "/dashboard".
	 */
	redirectRoute?: string;
	allowedUserTypes: T;
}

/**
 * Restricts a route based on user type, returning handlers for redirect and auth status.
 * In a React Router v7 clientLoader, return `handlers.redirect` directly when it exists
 * to trigger the redirect (e.g., `return handlers.redirect`). Do NOT return it as a property
 * like `{ redirect: handlers.redirect }`, as this will not trigger the redirect.
 *
 * @See {@link https://reactrouter.com/en/main/utils/redirect}.
 *
 * @example
 * ```tsx
 * import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
 *
 * const ALLOWED_USER_TYPES = ["player", "company"] as const;
 *
 * export const ClientLoader = async () => {
 * const { redirect, authStatus } = restrictRouteByUserType({
 * allowedUserTypes: ALLOWED_USER_TYPES,
 * });
 * if (redirect) return redirect;
 *
 * if (authStatus.isAuthenticated) {
 * const userType = authStatus.cookies.userType;
 * // This block correctly infers `userType` as "player" | "company"
 * await GlobalQueryClient.ensureQueryData(
 *      questionnaireQueries[userType]()
 *  );
 * }
 * };
 * ```
 */
export const restrictRouteByUserType = <const TAllowed extends StrictUserType>({
	redirectRoute,
	allowedUserTypes,
}: RestrictRouteByUserTypeProps<TAllowed>): RestrictRouteResult<TAllowed> => {
	const authStatus = getAuthStatusFromCookies();

	if (authStatus.isAuthenticated) {
		const userType = authStatus.cookies.userType;
		const shouldRedirect = !allowedUserTypes.includes(userType);

		if (shouldRedirect) {
			// Redirect if the authenticated user's type is not in the allowed list
			return {
				redirect: redirect(redirectRoute ?? href("/dashboard")),
				authStatus: {
					...authStatus,
					cookies: {
						...authStatus.cookies,
						// Assert userType is not one of the allowed types
						userType: userType as SafeExclude<
							UserType,
							ElementType<TAllowed>
						>,
					},
				},
			};
		}

		// User is authenticated and their type is allowed; no redirect needed
		return {
			redirect: undefined,
			authStatus: {
				...authStatus,
				cookies: {
					...authStatus.cookies,
					userType: userType as ElementType<TAllowed>, // Assert userType is one of the allowed types
				},
			},
		};
	}

	// User is not authenticated; no redirect
	return {
		redirect: undefined,
		authStatus: authStatus,
	};
};
