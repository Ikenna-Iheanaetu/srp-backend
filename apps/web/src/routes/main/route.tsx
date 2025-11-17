/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { GlobalQueryClient } from "@/root";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { href, Outlet, redirect } from "react-router";
import AppHeader from "./components/app-header";
import AppSidebar from "./components/app-sidebar";
import { PendingApprovalUI } from "./components/pending-approval-ui";
import { notificationsQueries } from "./routes/notifications/query-factory";
import { profileQueries } from "./routes/profile/query-factory";
import { AllowedProfileUserTypeSchema } from "./routes/profile/schemas";
import { getAuthStatusFromCookies } from "../auth/cookie-management/get-auth-status-helper";

export const clientLoader = () => {
	const { isAuthenticated } = getAuthStatusFromCookies();
	if (!isAuthenticated) {
		return redirect(href("/login"));
	}

	// start loading notifications, but don't wait
	void GlobalQueryClient.ensureQueryData({
		...notificationsQueries.notifications({
			status: ["unread"],
		}),
		meta: {
			onError: () => "none", // toast no notifications for this query
		},
	});
};

/**
 * Wraps main app with the {@link AppSidebar} and the {@link AppHeader}.
 *
 * @see Layout inspiration from {@link https://ui.shadcn.com/blocks/sidebar#sidebar-16 Shadcn - A sidebar with a sticky site header.}
 */
const MainAppLayoutRoute: FC = () => {
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
	});
	const userType = cookies.userType;
	const userTypeWithProfile =
		AllowedProfileUserTypeSchema.safeParse(userType).data;
	const requiresAdminApproval = !!userTypeWithProfile;
	const { data } = useQuery({
		...profileQueries.byUserType(userTypeWithProfile!),
		enabled: requiresAdminApproval,
		refetchInterval: (query) => {
			// No polling needed if user is admin or if user is approved
			if (!requiresAdminApproval || query.state.data?.isApproved) {
				return false; // Stop polling
			}
			return 5000; // Poll every 5 seconds if approval is required and not yet approved
		},
	});

	const shouldRenderOutlet =
		!requiresAdminApproval || // when User is an admin
		!!data?.isApproved; // when User requires approval

	// [--header-height:calc(theme(spacing.14))]

	return (
		<SidebarProvider className="flex w-full flex-1">
			<AppSidebar />

			<SidebarInset className="flex flex-col">
				<AppHeader />
				<main className="relative flex-1 overflow-auto p-4 tw-scrollbar sm:p-8">
					{shouldRenderOutlet ? (
						<Outlet />
					) : (
						// User is pending approval
						<div className="flex size-full justify-center">
							{data ? (
								<PendingApprovalUI />
							) : (
								// data is still loading
								<LoadingIndicator />
							)}
						</div>
					)}
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
};

export default MainAppLayoutRoute;
