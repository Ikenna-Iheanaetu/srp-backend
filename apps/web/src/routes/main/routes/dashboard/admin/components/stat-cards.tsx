/** @format */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { FileChartLineIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Building2, User, Users } from "lucide-react";

interface StatItem {
	title: string;
	count: number;
	percentageChange: string;
	icon: React.ReactNode;
}

interface StatCardsProps {
	companySignup: {
		count: number;
		percentageChange: string;
	};
	companyHires: {
		count: number;
		percentageChange: string;
	};
	totalUsers: {
		count: number;
		percentageChange: string;
	};
}

export function StatCards({
	companySignup,
	companyHires,
	totalUsers,
}: StatCardsProps) {
	const stats: StatItem[] = [
		{
			title: "Total company Signup",
			count: companySignup.count,
			percentageChange: companySignup.percentageChange,
			icon: (
				<Building2 size={25} color="gray" />
			),
		},
		{
			title: "Total Company Hires",
			count: companyHires.count,
			percentageChange: companyHires.percentageChange,
			icon: (
				<User size={25} color="gray" />
			),
		},
		{
			title: "Total Users",
			count: totalUsers.count,
			percentageChange: totalUsers.percentageChange,
			icon: (
				<Users size={25} color="gray" />
			),
		},
	];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
			{stats.map((stat) => (
				<Card key={stat.title} className="bg-white border border-gray-200 shadow-none">
					<CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
						<div className="text-gray-500">{stat.icon}</div>
						<CardTitle className="text-sm font-normal">
							{stat.title}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl py-1 md:text-3xl font-medium">{stat.count}</div>
						<p
							className={cn(
								"text-xs md:text-sm font-medium mt-1",
								stat.percentageChange.startsWith("+")
									? "text-green-500"
									: "text-red-500"
							)}>
							{stat.percentageChange} from yesterday
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
