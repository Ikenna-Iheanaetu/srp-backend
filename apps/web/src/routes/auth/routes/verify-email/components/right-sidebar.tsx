/** @format */

import { RIGHT_SIDEBAR_BANNER_STYLES } from "@/constants";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";

export const RightSidebar = () => {
	return (
		<div
			className={cn(
				RIGHT_SIDEBAR_BANNER_STYLES,
				"lg:flex flex-col items-center justify-center text-center gap-4 text-white p-8 bg-gradient-to-br from-gray-800 to-gray-900"
			)}>
			<div className="size-24 bg-white/10 !rounded-full flex items-center justify-center mb-2">
				<Mail className="size-12 text-white" />
			</div>
			<h2 className="text-2xl font-bold">Your Security Matters</h2>
			<p className="text-lg opacity-90 leading-relaxed">
				Verifying your email keeps your account safe and helps us send
				you important updates.
			</p>
		</div>
	);
};
