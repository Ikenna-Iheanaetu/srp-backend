/** @format */
import {
	Tabs as BaseTabs,
	TabsList as BaseTabsList,
	TabsTrigger as BaseTabsTrigger,
	TabsContent,
} from "@/components/ui/tabs";
import { removeTrailingSlash } from "@/lib/helper-functions/generic-string-helpers";
import { cn } from "@/lib/utils";
import {
	TabsListProps,
	TabsProps,
	TabsTriggerProps,
} from "@radix-ui/react-tabs";
import React from "react";
import { Link, Outlet, useLocation } from "react-router";

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
	({ className, ...props }, ref) => (
		<BaseTabs
			ref={ref} // Pass the ref down
			{...props}
			className={cn(
				"sticky top-20 z-[12] mb-12 grid w-full grid-cols-1 gap-6 *:w-full lg:top-28",
				className,
			)}
		/>
	),
);
Tabs.displayName = "Tabs"; // Good practice for forwardRef components

// TabsList wrapper
const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
	({ className, ...props }, ref) => (
		<BaseTabsList
			ref={ref} // Pass the ref down
			{...props}
			className={cn("z-[100] justify-evenly overflow-auto", className)}
		/>
	),
);
TabsList.displayName = "TabsList";

// TabsTrigger wrapper
const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
	({ className, ...props }, ref) => (
		<BaseTabsTrigger
			ref={ref} // Pass the ref down
			{...props}
			className={cn("capitalize", className)}
		/>
	),
);
TabsTrigger.displayName = "TabsTrigger";

interface TabItem<TValue extends string = string> {
	/**
	 * The unique value associated with this tab. This value is used to identify the tab.
	 */
	value: TValue;
	/**
	 * The label displayed on the tab trigger.
	 */
	label: string;
	/**
	 * A function that returns the React element to be rendered as the content
	 * for this tab.
	 * This allows for deferred rendering.
	 */
	renderComponent: () => React.JSX.Element;
}

interface TabPanelsProps<TValue extends string = string>
	extends SafeOmit<TabsProps, "onValueChange"> {
	value: TValue;
	onValueChange: (value: TValue) => void;
	defaultValue?: TValue;
	tabs: TabItem<TValue>[];
}

const TabPanels = <TValue extends string = string>({
	tabs,
	className,
	value,
	defaultValue,
	onValueChange,
	...rootProps
}: TabPanelsProps<TValue>) => {
	return (
		<Tabs
			{...rootProps}
			value={value}
			defaultValue={defaultValue}
			onValueChange={onValueChange as TabsProps["onValueChange"]}
			className={cn(className)}>
			<TabsList>
				{tabs.map(({ value, label }) => (
					<TabsTrigger key={value} value={value}>
						{label}
					</TabsTrigger>
				))}
			</TabsList>

			{tabs.map(({ value, renderComponent }) => (
				<TabsContent key={value} value={value}>
					{renderComponent()}
				</TabsContent>
			))}
		</Tabs>
	);
};

interface TabRouteItem {
	/**
	 * Absolute path (e.g., "/settings/profile"). Use {@link href} util.
	 */
	path: string;
	/**
	 * The label displayed on the tab trigger.
	 */
	label: string;
}

interface TabPanelsNavigationProps {
	tabs: TabRouteItem[];
	/**
	 * Prevents rendering the current route's `<Outlet>` within `TabsContent`.
	 *
	 * Use this when the route's content is handled elsewhere.
	 * @default false
	 */
	disableRenderOutlet?: boolean;
	className?: string;
	tabListClassName?: string;
	tabTriggerClassName?: string;
	activeTabTriggerClassName?: string;
}

const TabPanelsNavigation: React.FC<TabPanelsNavigationProps> = ({
	tabs,
	disableRenderOutlet = false,
	className,
	tabListClassName,
	tabTriggerClassName,
	activeTabTriggerClassName,
}) => {
	if (!tabs.length || tabs.length === 1) {
		throw new Error(
			"TabPanelsNavigation: Use this component only for routes with two or more nested tabs. For single routes, render directly.",
		);
	}

	const location = useLocation();
	const activeTabPath = removeTrailingSlash(location.pathname);

	return (
		<Tabs value={activeTabPath} className={cn(className)}>
			<TabsList className={cn(tabListClassName)}>
				{tabs.map(({ path, label }) => {
					const isActive = activeTabPath === path;
					return (
						<TabsTrigger
							key={path}
							value={path}
							asChild
							className={cn(
								tabTriggerClassName,
								isActive && activeTabTriggerClassName,
							)}>
							<Link to={path} prefetch="viewport">
								{label}
							</Link>
						</TabsTrigger>
					);
				})}
			</TabsList>

			{!disableRenderOutlet && (
				<TabsContent value={activeTabPath} className="w-full">
					<Outlet />
				</TabsContent>
			)}
		</Tabs>
	);
};

export { TabPanels, TabPanelsNavigation };
export type { TabItem, TabPanelsNavigationProps, TabPanelsProps, TabRouteItem };
