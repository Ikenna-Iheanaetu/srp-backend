/** @format */

import SiteLogo from "@/components/common/site-logo";
import { RIGHT_SIDEBAR_BANNER_STYLES } from "@/constants";
import { cn } from "@/lib/utils";
import { FC } from "react";

export const RightSidebar = () => {
	return (
		<aside
			className={cn(
				RIGHT_SIDEBAR_BANNER_STYLES,
				"w-[30%] bg-indigo-600 lg:!flex justify-center items-center"
			)}
			style={{
				background:
					"linear-gradient(218.9deg, #504AC2 3.19%, #27245E 84.45%, #26235C 102.22%)",
			}}>
			<SiteLogo
				classNames={{
					root: "flex flex-col justify-center items-center gap-4 w-1/2",
					logoText: "lg:!bg-none lg:text-white",
					icon: "w-full h-auto aspect-square",
				}}
			/>
		</aside>
	);
};

export interface AuthDisplayLayoutProps {
	/**
	 * Content for the left panel, and which is the main content of the page.
	 */
	children: React.ReactNode;
}

/**
 * Layout component for authentication pages.
 *
 * Provides a two-panel structure with the left panel containing the main content and a fixed background,
 * and the right panel having a dynamic background or being replaced by a custom element.
 */
export const AuthDisplayLayout: FC<AuthDisplayLayoutProps> = ({ children }) => {
	return (
		<div className="bg-[url(/assets/images/auth/auth-bg-banner.webp)] bg-indigo-300 bg-cover min-w-[100dvw] min-h-dvh bg-center relative @container overflow-hidden">
			<div
				className={cn(
					"relative size-full flex justify-between *:min-h-dvh bg-opacity-30 bg-indigo-300"
				)}>
				<main className="flex-1 relative">{children}</main>

				<RightSidebar />
			</div>
		</div>
	);
};
