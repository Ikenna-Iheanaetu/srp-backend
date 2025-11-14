/** @format */

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router";

const routesMap = [
	{ route: "dashboard", label: "Dashboard" },
	{ route: "jobs", label: "Jobs" },
	{ route: "profile", label: "Profile" },
];

interface Props {
	className?: string;
}

export default function PlayerMainNavTabs({ className }: Props) {
	const location = useLocation();

	// Determine the active tab based on the first segment of the path
	const activeTab = location.pathname.split("/")[1] || "dashboard";

	return (
		<Tabs
			value={activeTab}
			className={cn(
				"grid grid-cols-1 gap-6 w-full *:w-full sticky top-20 lg:top-28 z-10",
				className
			)}>
			<TabsList className="justify-evenly overflow-auto z-[100]">
				{routesMap.map(({ route, label }) => (
					<TabsTrigger key={route} value={route} asChild>
						<Link to={`/${route}`}>{label}</Link>
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}
