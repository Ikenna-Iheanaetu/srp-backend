/** @format */

import LoadingIndicator from "@/components/common/loading-indicator";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { UserType } from "@/lib/schemas/user";
import React, { Suspense } from "react";
import { href, Navigate } from "react-router";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyLoadedComponent = React.LazyExoticComponent<React.ComponentType<any>>;

type LazyLoadedUserComponents<TUserType extends UserType = UserType> = Record<
	TUserType,
	LazyLoadedComponent
>;

/**@deprecated Use {@link LazyLoadedUserComponents} instead, as this type is
 * not strict.
 */
type LazyLoadedUserComponentsMap = Partial<LazyLoadedUserComponents>;

interface UserComponentByTypeProps<TUserType extends UserType = UserType> {
	componentsMap: LazyLoadedUserComponents<TUserType>;
	/** For Suspense loading state */
	suspenseFallback?: React.ReactNode;
	/**Defaults to true.
	 * * When true, If logged in user's type doesn't match any
	 * keys in `components` prop, the user is redirected to
	 * "/dashboard".
	 */
	isRoute?: boolean;
}

/**
 * A component that renders a lazy-loaded component based on logged in
 *  user's type,
 * with built-in Suspense handling and customizable fallbacks.
 */
const UserComponentByType = <TUserType extends UserType = UserType>({
	componentsMap,
	suspenseFallback = <LoadingIndicator />,
	isRoute = true,
}: UserComponentByTypeProps<TUserType>) => {
	const { isAuthenticated, cookies } = useAuthStatus(false);

	if (!isAuthenticated) {
		return <Navigate to={href("/login")} replace />;
	}

	const Component = componentsMap[
		cookies.userType as TUserType
	] as LazyLoadedComponent;

	if (!Component) {
		// user shouldn't be on this route if the corresponding component isn't
		// provided.
		return isRoute ? <Navigate to={href("/dashboard")} replace /> : null;
	}

	return (
		<Suspense fallback={suspenseFallback}>
			<Component />
		</Suspense>
	);
};

export default UserComponentByType;

export type {
	LazyLoadedUserComponents,
	LazyLoadedUserComponentsMap,
	UserComponentByTypeProps,
};
