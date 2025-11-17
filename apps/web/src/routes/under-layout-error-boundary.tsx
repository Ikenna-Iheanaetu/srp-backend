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
import { Outlet, useNavigate, useRouteError } from "react-router";

// For errors thrown under the layout to not unmount layout but render error bound within it.

export const ErrorBoundary = () => {
	const error = useRouteError();
	const navigate = useNavigate();
	useAuthStatus();
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

export default function UnderLayoutErrorBoundary() {
	return <Outlet />;
}
