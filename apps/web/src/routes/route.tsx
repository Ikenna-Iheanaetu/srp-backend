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
import { getErrorMessage } from "@/lib/utils";
import { GlobalQueryClient } from "@/root";
import React, { FC } from "react";
import {
	href,
	Navigate,
	Outlet,
	useLocation,
	useNavigate,
	useRouteError,
} from "react-router";
import { getAuthStatusFromCookies } from "./auth/cookie-management/get-auth-status-helper";
import { profileQueries } from "./main/routes/profile/query-factory";
import { AllowedProfileUserTypeSchema } from "./main/routes/profile/schemas";

export const clientLoader = () => {
	const { isAuthenticated, cookies } = getAuthStatusFromCookies();

	if (isAuthenticated) {
		const userTypeWithProfile = AllowedProfileUserTypeSchema.safeParse(
			cookies.userType,
		).data;
		if (userTypeWithProfile) {
			// starting fetching profile data without awaiting
			void GlobalQueryClient.ensureQueryData({
				...profileQueries.byUserType(userTypeWithProfile),
				meta: {
					onError: () => "none", // toast no errors for this query
				},
			});
		}
	}
};

export const ErrorBoundary = () => {
	const error = useRouteError();
	const navigate = useNavigate();
	useAuthStatus(); // Require to listen for any auth errors, even in error boundaries

	return (
		<ErrorScreen>
			<ErrorScreenIcon />
			<ErrorScreenHeader />
			<ErrorScreenDetails errorMessage={getErrorMessage(error)} />
			<ErrorScreenActions onGoHome={() => void navigate("/")} />
			<ErrorScreenSupport />
		</ErrorScreen>
	);
};

const RootLayout: FC = () => {
	const { isAuthenticated } = useAuthStatus({ assertAuthenticated: false });

	const { pathname } = useLocation();

	const shouldRedirect = isAuthenticated && pathname === href("/");

	const isInitialRenderRef = React.useRef(true);
	React.useEffect(() => {
		if (isInitialRenderRef.current) {
			isInitialRenderRef.current = false;
		}
	}, []);

	// redirect only on initial render
	if (shouldRedirect && isInitialRenderRef.current) {
		return <Navigate to={href("/dashboard")} replace />;
	}

	return <Outlet />;
};

export default RootLayout;
