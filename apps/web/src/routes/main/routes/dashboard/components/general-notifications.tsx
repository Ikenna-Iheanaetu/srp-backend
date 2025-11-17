/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { matchQueryStatus } from "@/lib/helper-functions/async-status-render-helpers";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { href, Link } from "react-router";
import { notificationsQueries } from "../../notifications/query-factory";
import ActionsMenu from "./actions-menu";
import { FooterButton } from "./footer-button";

/* export interface UserNotification {
	id: string;
	message: string;
} */

interface Props {
	heading?: string;
	seeAllLink?: {
		href: string;
		label: string;
	};
	editNotificationsLink?: {
		href: string;
		label: string;
	};
	actionsMenuItems?: {
		href: string;
		label: string;
	}[];
	className?: string;
}

const GeneralNewNotifications: FC<Props> = ({
	heading = "Notifications",
	className,
	seeAllLink = {
		href: href("/notifications"),
		label: "See all Notifications",
	},
	actionsMenuItems = [
		{
			href: href("/notifications"),
			label: "See all Notifications",
		},
		{
			href: href("/settings/notifications"),
			label: "Edit Notifications Settings",
		},
	],
}) => {
	const query = useQuery(
		notificationsQueries.notifications({ status: ["unread"], limit: 10 }),
	);

	return (
		<Card
			className={cn(
				"relative h-fit w-full elevated-on-hover",
				className,
			)}>
			<CardHeader>
				<CardTitle className="capitalize">{heading}</CardTitle>
				<CardDescription className="sr-only">
					These are your new {heading}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{matchQueryStatus(query, {
					Loading: (
						<p className="flex flex-1 items-center justify-center">
							Loading notifications <LoadingIndicator />
						</p>
					),
					Errored: (e) => (
						<p className="text-red-500">
							Error occurred: {getApiErrorMessage(e)}
						</p>
					),
					Empty: <p>No new notifications</p>,
					Success: ({ data }) => {
						const notifications = data.data;
						return (
							<>
								<ul className="space-y-2">
									{notifications.map((item) => (
										<li key={item.id}>
											<LinkButton
												variant={"ghost"}
												to={href("/notifications")}
												className="mb-2 w-full justify-start truncate text-sm">
												{item.title}
											</LinkButton>

											<Separator />
										</li>
									))}
								</ul>

								<ActionsMenu
									items={[
										...actionsMenuItems.map((item) => (
											<Link
												key={item.href}
												to={item.href}>
												{item.label}
											</Link>
										)),
									]}
								/>
							</>
						);
					},
				})}
			</CardContent>

			<CardFooter className="flex items-end justify-end">
				<FooterButton to={seeAllLink.href}>
					{seeAllLink.label}
				</FooterButton>
			</CardFooter>
		</Card>
	);
};

export default GeneralNewNotifications;
