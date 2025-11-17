/** @format */

import {
	CrumbItem,
	isStateWithCrumbs,
} from "@/routes/main/components/app-header/bread-crumb-navigation";
import React from "react";
import { useLocation } from "react-router";

/**
 * Extracts the last crumb from the current URL location and prepares it to be
 * used as the first crumb for a subsequent, related location.
 */
export const useLastCrumbHandover = (): CrumbItem | null => {
	const currentLocation = useLocation();
	const firstCrumbForTarget = React.useMemo(() => {
		if (isStateWithCrumbs(currentLocation.state)) {
			const currentCrumbs = currentLocation.state.crumbs;
			const lastCrumb = currentCrumbs[currentCrumbs.length - 1];
			if (lastCrumb) {
				const handoverCrumb: CrumbItem = {
					...lastCrumb,
					to: currentLocation,
					path: undefined,
				};
				return handoverCrumb;
			}
		}
	}, [currentLocation]);

	return firstCrumbForTarget ?? null;
};
