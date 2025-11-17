/** @format */

import { removeTrailingSlash } from "@/lib/helper-functions/generic-string-helpers";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { getErrorMessage } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";
import { href, Navigate, Outlet, useLocation } from "react-router";
import { CrumbsLocationState } from "../../components/app-header/bread-crumb-navigation";
import { chatSocket } from "./chat-socket-manager";
import { AllowedChatUserSchema } from "./constants";
import { useChatsListQueryConfig } from "./routes/chat/chats-list/use-chats-list-query-config";
import { useListenForMessageUpdates } from "./hooks/use-listen-for-messages";

export const clientLoader = () => {
	return restrictRouteByUserType({
		allowedUserTypes: AllowedChatUserSchema.options,
	}).redirect;
};

export default function MessagesLayoutRoute() {
	useListenForMessageUpdates();
	React.useEffect(() => {
		const onConnectError = (error: unknown) => {
			if (chatSocket.active) {
				// temporary failure, the socket will automatically try to reconnect
				console.warn(
					"temporary failure, the socket will automatically try to reconnect",
					getErrorMessage(error),
				);
			} else {
				// the connection was denied by the server
				// in that case, `socket.connect()` must be manually called in order to reconnect
				console.error(
					"the connection was denied by the server",
					getErrorMessage(error),
				);
			}
		};
		chatSocket.on("connect_error", onConnectError);

		if (!chatSocket.connected) {
			chatSocket.connect();
		}

		const onDisconnect = () => {
			// This connection must remain active as longer as the component is mounted
			chatSocket.connect();
		};
		chatSocket.on("disconnect", onDisconnect);

		return () => {
			// WARN: Don't disconnect chatSocket on unmount, cause messages sidebar item outside this route is using it
			chatSocket.off("disconnect", onDisconnect);
			chatSocket.off("connect_error", onConnectError);
		};
	}, []);

	const { pathname } = useLocation();

	const { queryOptions } = useChatsListQueryConfig();
	const { data, isLoading } = useInfiniteQuery(queryOptions);

	if (isLoading) {
		return null;
	}

	const isIndexRoute = removeTrailingSlash(pathname) === href("/messages");
	if (!isIndexRoute) {
		return <Outlet />;
	}

	const firstChat = data?.pages[0]?.data[0];
	if (firstChat) {
		return (
			<Navigate
				replace
				to={href("/messages/:id", {
					id: firstChat.id,
				})}
				state={
					{
						crumbs: [{ label: `Chat with ${firstChat.name}` }],
					} satisfies CrumbsLocationState
				}
			/>
		);
	}

	return (
		<Navigate
			replace
			to={href("/messages/new")}
			state={
				{
					crumbs: [{ label: `New chat` }],
				} satisfies CrumbsLocationState
			}
		/>
	);
}
