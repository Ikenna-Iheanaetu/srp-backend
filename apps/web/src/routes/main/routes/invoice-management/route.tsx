/** @format */

import {
	TabPanelsNavigation,
	TabRouteItem,
} from "@/components/common/tab-panels";
import { FC } from "react";
import { href, redirect } from "react-router";
import { Route } from "./+types/route";

export const clientLoader = ({ request }: Route.ClientLoaderArgs) => {
	const { pathname } = new URL(request.url);
	if (pathname === href("/invoice-management")) {
		return redirect(href("/invoice-management/company"));
	}
};

const tabRoutes = [
	{
		path: href("/invoice-management/company"),
		label: "Company",
	},
	{
		path: href("/invoice-management/club"),
		label: "Club",
	},
] as const satisfies TabRouteItem[];

const InvoiceManagementLayout: FC = () => {
	return (
		<div className="-m-4 min-h-screen space-y-4 bg-[#F1F5F9] !p-4 sm:-m-8 sm:p-8 md:space-y-6">
			<h1 className="text-base font-normal text-gray-900 md:text-2xl md:font-semibold">
				Invoice Management
			</h1>
			<TabPanelsNavigation
				tabs={tabRoutes}
				tabListClassName="h-16 md:h-20 bg-white border border-gray-200 rounded-lg flex !justify-start !px-4 md:!px-6 overflow-x-auto"
				tabTriggerClassName="text-sm font-medium !px-4 md:!px-[25px] !py-2 md:!py-[12px] !max-w-[180px] md:!max-w-[216px] !w-full whitespace-nowrap"
				activeTabTriggerClassName="!bg-[#F1F5F9]"
			/>
		</div>
	);
};

export default InvoiceManagementLayout;
