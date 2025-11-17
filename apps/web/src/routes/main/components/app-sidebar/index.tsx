/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import SiteLogo from "@/components/common/site-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { useLogout } from "@/hooks/use-logout";
import { removeTrailingSlash } from "@/lib/helper-functions/generic-string-helpers";
import { PlayerUserTypesSchema } from "@/lib/schemas/user";
import { getErrorMessage } from "@/lib/utils";
import { LogOut, User as LucideUser, Settings } from "lucide-react";
import { FC, useEffect, useRef } from "react";
import { href, Link, useLocation } from "react-router";
import { toast } from "sonner";
import { MessagesItem } from "./components/messages-item";
import {
	TopSidebarMenuButton,
	TopSidebarMenuIcon,
	TopSidebarMenuItem,
	TopSidebarMenuLabel,
} from "./components/top-sidebar-menu";
import { sidebarNavLinks } from "./items-data";

const TopSidebarLogoutButton = () => {
	const { mutate: logout, isPending: isLoggingOut } = useLogout({
		onSuccess: () => {
			toast.success("Successfully logged out.");
		},
		onError: (error) => {
			toast.error("Failed to log out completely.", {
				description: getErrorMessage(error),
				action: (
					<Button onClick={() => logout()} className="button">
						Try again
					</Button>
				),
				duration: 10000, // 10 secs
			});
		},
	});

	return (
		<TopSidebarMenuButton onClick={() => logout()} disabled={isLoggingOut}>
			{isLoggingOut ? (
				<LoadingIndicator />
			) : (
				<TopSidebarMenuIcon Icon={LogOut} />
			)}
			<TopSidebarMenuLabel>
				{isLoggingOut ? "Exiting..." : "Exit"}
			</TopSidebarMenuLabel>
		</TopSidebarMenuButton>
	);
};

const AppSidebar: FC = () => {
	const { pathname } = useLocation();
	const currentRoute = removeTrailingSlash(pathname);

	// sidebar should only be open on desktop
	const { setOpen } = useSidebar();
	const initialRenderRef = useRef(false);

	useEffect(() => {
		if (!initialRenderRef.current) {
			setOpen(window.innerWidth >= 1024);
			initialRenderRef.current = true;
		}
	}, [setOpen]);

	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
	});

	const currentUserType = cookies.userType;

	const hasChatFeature =
		PlayerUserTypesSchema.safeParse(currentUserType).success ||
		currentUserType === "company";

	return (
		<Sidebar variant="inset" className="max-h-[800px]">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem className="flex flex-col gap-2">
						<SiteLogo
							classNames={{
								icon: "brightness-0 grayscale",
								logoText: "!bg-none text-black",
							}}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="flex-none tw-scrollbar h-xs:flex-1">
				<SidebarGroup>
					<SidebarMenu>
						{sidebarNavLinks[currentUserType].map((item) => {
							return (
								<TopSidebarMenuItem key={item.url}>
									<TopSidebarMenuButton
										asChild
										isActive={currentRoute.startsWith(
											removeTrailingSlash(item.url),
										)}>
										<Link to={item.url}>
											<TopSidebarMenuIcon
												Icon={item.icon}
											/>
											<TopSidebarMenuLabel>
												{item.title}
											</TopSidebarMenuLabel>
										</Link>
									</TopSidebarMenuButton>
								</TopSidebarMenuItem>
							);
						})}
						{hasChatFeature && <MessagesItem />}

						{/* Settings item */}
						<TopSidebarMenuItem>
							<TopSidebarMenuButton
								asChild
								isActive={currentRoute.startsWith(
									href("/settings"),
								)}>
								<Link to={href("/settings")}>
									<TopSidebarMenuIcon Icon={Settings} />
									<TopSidebarMenuLabel>
										Settings
									</TopSidebarMenuLabel>
								</Link>
							</TopSidebarMenuButton>
						</TopSidebarMenuItem>
						<TopSidebarMenuItem>
							<TopSidebarLogoutButton />
						</TopSidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						{/* Support card */}
						<Card className="bg-gray-100 h-xs:border-none h-xs:bg-transparent h-xs:shadow-none">
							<CardHeader className="h-xs:sr-only">
								<CardTitle>Support</CardTitle>
								<CardDescription>
									Get the support you need 24/7
								</CardDescription>
							</CardHeader>

							<CardContent className="flex items-center justify-center h-xs:sr-only">
								<Avatar>
									<AvatarImage></AvatarImage>
									<AvatarFallback className="bg-gray-200 text-slate-500">
										<LucideUser />
									</AvatarFallback>
								</Avatar>
							</CardContent>

							<CardFooter className="h-xs:p-0">
								<Button asChild className="w-full button">
									<Link to="/contact-us">Contact us</Link>
								</Button>
							</CardFooter>
						</Card>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
};

export default AppSidebar;
