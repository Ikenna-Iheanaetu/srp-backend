/** @format */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";

export const useTabPanelsNavigation = <
	RootRoute extends string,
	NestedTabRoute extends string,
>(
	rootRoute: RootRoute,
	indexRoute: NestedTabRoute
) => {
	const [activeRouteTab, setActiveRouteTab] = useState<NestedTabRoute | null>(
		null
	);

	// the activeRouteTab needs to be controlled by the currentRoute
	const { pathname } = useLocation();

	const currentRoute = useMemo(() => {
		// remove the trailing slash
		return pathname.replace(/\/$/, "") as
			| `/${RootRoute}`
			| `/${RootRoute}/${NestedTabRoute}`;
	}, [pathname]);

	// if the current route matches the activeRouteTab, display the corresponding content
	useEffect(() => {
		// index route is rendered at the root Route.
		if (currentRoute === `/${rootRoute}`) {
			setActiveRouteTab(indexRoute);
			return;
		}

		if (currentRoute.startsWith(`/${rootRoute}/`)) {
			const route = currentRoute.split("/")[2] as
				| NestedTabRoute
				| undefined;
			if (route) {
				setActiveRouteTab(route);
			}
			return;
		}
	}, [currentRoute, indexRoute, rootRoute]);

	// whenever activeRouteTab changes, navigate to that route
	const navigate = useNavigate();

	useEffect(() => {
		if (activeRouteTab) {
			void navigate(`/${rootRoute}/${activeRouteTab}`);
		}
	}, [activeRouteTab, navigate, rootRoute]);

	const memoisedRouteHandlers = useMemo(() => {
		return {
			activeRouteTab,
			setActiveRouteTab,
		};
	}, [activeRouteTab]);

	return memoisedRouteHandlers;
};
