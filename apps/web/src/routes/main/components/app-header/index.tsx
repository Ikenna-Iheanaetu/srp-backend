/** @format */

import { Settings, SidebarIcon } from "lucide-react";

import SiteLogo from "@/components/common/site-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { replaceUnderscoresWithSpaces } from "@/lib/utils";
import { FC } from "react";
import { href, Link, useLocation } from "react-router";
import { BreadcrumbNav } from "./bread-crumb-navigation";
import { NavIconButton } from "./nav-icon-button";
import { NotificationsHoverCard } from "./notifications-hover-card";
import { ProfileAccessSummaryCard } from "./profile-summary-card";
import { AllowedProfileUserTypeSchema } from "../../routes/profile/schemas";

const AppHeader: FC = () => {
	const { pathname } = useLocation();
	const rootPathName = pathname.split("/")[1] ?? "";

	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
	});
	const userType = cookies.userType;
	const isAllowedProfileUser =
		AllowedProfileUserTypeSchema.safeParse(userType).success;

	const { toggleSidebar } = useSidebar();

	return (
		<header className="fle bg-background sticky top-0 z-50 w-full items-center border-b bg-white">
			{/* big nav banner in desktop screens */}
			<nav className="hidden h-20 w-full items-center justify-between gap-2 px-4 lg:flex">
				<Link
					to={`/${rootPathName}`}
					className="text-2xl font-semibold capitalize">
					{replaceUnderscoresWithSpaces(rootPathName)}
				</Link>

				{/* page nav links */}
				<ul className="flex h-full items-center justify-between gap-2">
					<li>
						<NavIconButton to={href("/settings")} icon={Settings} />
					</li>

					<li>
						<NotificationsHoverCard />
					</li>

					{isAllowedProfileUser && (
						<li>
							<ProfileAccessSummaryCard />
						</li>
					)}
				</ul>
			</nav>

			<div className="flex h-[--header-height] w-full items-center justify-between gap-2 px-2 lg:hidden">
				<SiteLogo
					classNames={{
						logoText: "!bg-none text-xl text-black",
						icon: "brightness-0 grayscale",
						root: "justify-start",
					}}
				/>

				<div className="flex w-auto items-center justify-end sm:ml-auto">
					<NotificationsHoverCard />

					<Separator
						orientation="vertical"
						className="ml-2 h-4 bg-gray-300"
					/>

					<Button
						className="h-8 w-8"
						variant="ghost"
						size="icon"
						title="Open sidebar"
						onClick={toggleSidebar}>
						<SidebarIcon className="!size-6" />
					</Button>
				</div>
			</div>

			<BreadcrumbNav />
		</header>
	);
};

export default AppHeader;
