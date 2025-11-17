/** @format */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Outlet } from "react-router";
import { useTabPanelsNavigation } from "./use-tab-panels-navigation";

interface Props<RootRoute extends string, NestedTabRoute extends string> {
	routesMap: { route: NestedTabRoute; label: string }[];
	indexRoute: NestedTabRoute;
	rootRoute: RootRoute;
}

/**
 * @deprecated Use {@link TabPanelsNavigation} instead.
 */
export default function TabPanelsNavigationMapper<
	RootRoute extends string,
	NestedTabRoute extends string
>({ routesMap, rootRoute, indexRoute }: Props<RootRoute, NestedTabRoute>) {
	const { activeRouteTab, setActiveRouteTab } = useTabPanelsNavigation(
		rootRoute,
		indexRoute
	);

	if (!activeRouteTab) return null;

	return (
		<Tabs
			value={activeRouteTab}
			onValueChange={(value) =>
				setActiveRouteTab(value as NestedTabRoute)
			}
			className="w-full space-y-6">
			<TabsList className="flex justify-evenly overflow-auto">
				{routesMap.map(({ route, label }) => (
					<TabsTrigger key={route} value={route}>
						{label}
					</TabsTrigger>
				))}
			</TabsList>

			{routesMap.map(({ route }) => (
				<TabsContent key={route} value={route}>
					<Outlet />
				</TabsContent>
			))}
		</Tabs>
	);
}
