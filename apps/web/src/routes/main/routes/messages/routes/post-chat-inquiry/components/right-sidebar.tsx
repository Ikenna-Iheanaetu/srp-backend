/** @format */

import { RIGHT_SIDEBAR_BANNER_STYLES } from "@/constants";
import { cn } from "@/lib/utils";
import { BriefcaseBusiness } from "lucide-react";

export const RightSidebar = () => {
	return (
		<div
			className={cn(
				RIGHT_SIDEBAR_BANNER_STYLES,
				"flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-800 to-gray-900 p-8 text-center text-white lg:flex",
			)}>
			<div className="mb-2 flex size-24 items-center justify-center !rounded-full bg-white/10">
				<BriefcaseBusiness className="size-12 text-white" />
			</div>
			<h2 className="text-2xl font-bold">We Understand</h2>
			<p className="text-lg leading-relaxed opacity-90">
				Making our hiring process better for you.
			</p>
		</div>
	);
};
