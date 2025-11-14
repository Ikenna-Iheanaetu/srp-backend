/** @format */

import {
	ErrorScreen,
	ErrorScreenActions,
	ErrorScreenDetails,
	ErrorScreenHeader,
	ErrorScreenIcon,
	ErrorScreenSupport,
} from "@/components/common/error-screen";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { logoutUser } from "@/hooks/use-logout";
import { getErrorMessage } from "@/lib/utils";
import { GlobalQueryClient } from "@/root";
import React, { useEffect } from "react";
import {
	href,
	Navigate,
	Outlet,
	redirect,
	useNavigate,
	useRouteError,
} from "react-router";
import { toast } from "sonner";
import { getAuthStatusFromCookies } from "../auth/cookie-management/get-auth-status-helper";
import { serializeVerifyEmailParams } from "../auth/routes/verify-email/schemas";
import { profileQueries } from "./routes/profile/query-factory";
import { AllowedProfileUserTypeSchema } from "./routes/profile/schemas";

export const clientLoader = async () => {
	const { isAuthenticated, cookies } = getAuthStatusFromCookies();
	if (isAuthenticated) {
		const userTypeWithProfile = AllowedProfileUserTypeSchema.safeParse(
			cookies.userType,
		).data;

		if (userTypeWithProfile) {
			// NOTE: You must use fetchQuery here and not ensureQueryData, so that if data is stale, it gets refetched.
			const profile = await GlobalQueryClient.fetchQuery(
				profileQueries.byUserType(userTypeWithProfile),
			);

			if (profile.status === "pending") {
				return redirect(
					href("/verify-email") +
						serializeVerifyEmailParams({ email: profile.email }),
				);
			}
		}
	} else {
		return redirect(href("/login"));
	}
};

/**This hook must be used in both the route component and the Error boundary component, because if an error occurs in the render cycle of the route component, it is unmounted and the Error Boundary mounted instead. So we need to continue watching authentication issues even in the Error boundary */
const useAuthRestriction = (): React.JSX.Element | null => {
	const authStatus = useAuthStatus({ assertAuthenticated: false });

	useEffect(() => {
		if (!authStatus.isAuthenticated) {
			const error = authStatus.error;

			if (error.type === "INVALID_SESSION_API_ERROR") {
				logoutUser();
				toast.error(error.message, {
					description: "Please log in again.",
					position: "top-center",
				});
			}
		}
	}, [authStatus]);

	return authStatus.isAuthenticated ? null : (
		<Navigate to={href("/login")} replace />
	);
};

export const ErrorBoundary = () => {
	const redirect = useAuthRestriction();
	const error = useRouteError();
	const navigate = useNavigate();
	return (
		redirect ?? (
			<ErrorScreen>
				<ErrorScreenIcon />
				<ErrorScreenHeader />
				<ErrorScreenDetails errorMessage={getErrorMessage(error)} />
				<ErrorScreenActions onGoHome={() => void navigate("/")} />
				<ErrorScreenSupport />
			</ErrorScreen>
		)
	);
};

/**
 * A wrapper layout route that centralizes route protection logic for authenticated routes.
 * It encapsulates authentication checks and redirects, allowing child routes ( main layout and onboarding layout)
 * to share this logic without duplicating code or introducing UI elements.
 */
const AuthenticatedLayoutRoute = () => {
	const redirect = useAuthRestriction();

	return redirect ?? <Outlet />;
};

export default AuthenticatedLayoutRoute;
