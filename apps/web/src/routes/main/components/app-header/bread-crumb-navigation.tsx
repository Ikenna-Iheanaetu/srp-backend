/** @format */

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn, replaceUnderscoresWithSpaces } from "@/lib/utils";
import { RouteIdsAutocomplete } from "@/types/react-router";
import React from "react";
import { Link, LinkProps, useLocation, useNavigate } from "react-router";

interface BaseCrumbItem extends SafeOmit<LinkProps, "to"> {
	/**"-" and "_" are removed from the string for display */
	label: string;
}

type CrumbItemWithPath = BaseCrumbItem & {
	/**
	 * @deprecated Use the `to` property instead.
	 */
	path: string;
	to?: never;
};

type CrumbItemWithTo = BaseCrumbItem & Pick<LinkProps, "to"> & { path?: never };

type CrumbItem = CrumbItemWithPath | CrumbItemWithTo;

/**
 * Makes a single key in a type required while keeping all other properties optional.
 */
type OnlyRequiredKey<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

type Crumbs = [
	...CrumbItem[],
	OnlyRequiredKey<CrumbItem, "label"> | CrumbItem, // You can also specify only label in the segment
];

type ExtractedCrumbsArray = Crumbs | null;

interface CrumbsLocationState {
	[crumbsKey]: Crumbs;
	[key: string]: unknown;
}

const crumbsKey = "crumbs";

const getCrumbsFromPath = (
	path: RouteIdsAutocomplete,
): Pick<
	CrumbItemWithPath,
	| "path"
	| "label"
	// to help typescript narrow down types better
	| "to"
>[] => {
	const segments = path.split("/").filter(Boolean);

	let currentPath = "";
	return segments.map((segment) => {
		currentPath += `/${segment}`;
		return {
			path: currentPath,
			label: segment,
		};
	});
};

const isStateWithCrumbs = (state: unknown): state is CrumbsLocationState =>
	typeof state === "object" &&
	state !== null &&
	crumbsKey in state &&
	Array.isArray(state[crumbsKey]);

/**
 * Renders a breadcrumbs navigation.
 * Crumbs are prioritized from:
 * 1. `location.state.crumbs` (dynamic override).
 * 2. `route.handle.crumbs` (route definition override).
 * 3. `pathname` segmentation (default fallback).
 */
const BreadcrumbNav: React.FC = () => {
	const currentLocation = useLocation();
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const { pathname, state } = currentLocation;

	const locationCrumbs: ExtractedCrumbsArray = isStateWithCrumbs(state)
		? state[crumbsKey]
		: null;

	const pathNameCrumbs = React.useMemo(
		() => getCrumbsFromPath(pathname),
		[pathname],
	);

	const navigate = useNavigate();
	const onNoCrumbsInLocation = React.useEffectEvent(
		(crumbsFromPath: typeof pathNameCrumbs) => {
			// location.state is the single source for crumbs to use
			// so if current location doesn't have crumbs, add the one constructed from path

			const existingState =
				!!currentLocation.state &&
				typeof currentLocation.state === "object"
					? (currentLocation.state as Record<string, unknown>)
					: {};

			void navigate(currentLocation, {
				replace: true,
				state: {
					...existingState,
					crumbs: crumbsFromPath as Crumbs,
				} satisfies CrumbsLocationState,
			});
		},
	);
	React.useEffect(() => {
		if (!locationCrumbs?.length && pathNameCrumbs.length) {
			onNoCrumbsInLocation(pathNameCrumbs);
		}
	}, [locationCrumbs?.length, pathNameCrumbs]);

	const hasCrumbsToMap = locationCrumbs?.length || pathNameCrumbs.length;
	if (!hasCrumbsToMap) {
		return null;
	}

	const crumbsToMap = locationCrumbs ?? pathNameCrumbs;

	return (
		<Breadcrumb className="bg-gray-50 px-2">
			<BreadcrumbList>
				{crumbsToMap.map(
					({ path, to, label: l, ...linkProps }, index, array) => {
						const isLastCrumb = index === array.length - 1;

						const label = replaceUnderscoresWithSpaces(l);

						return (
							<React.Fragment key={path}>
								<BreadcrumbItem className="capitalize">
									{isLastCrumb ? (
										<BreadcrumbPage className="flex items-center gap-1 font-semibold">
											{label}
										</BreadcrumbPage>
									) : (
										<BreadcrumbLink asChild>
											<Link
												{...linkProps}
												to={(to ?? path)!}
												replace={
													"replace" in linkProps &&
													typeof linkProps.replace ===
														"boolean"
														? linkProps.replace
														: true
												}>
												{label}
											</Link>
										</BreadcrumbLink>
									)}
								</BreadcrumbItem>
								{!isLastCrumb && (
									<BreadcrumbSeparator
										className={cn(
											isLastCrumb &&
												"[&_svg]:stroke-black [&_svg]:stroke-[0.15rem]",
										)}
									/>
								)}
							</React.Fragment>
						);
					},
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
};

export { BreadcrumbNav, isStateWithCrumbs };
export type { CrumbItem, Crumbs, CrumbsLocationState };
