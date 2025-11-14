/** @format */

import { PlayerDynamicCard } from "@/components/user-dynamic-cards/player-card";
import { ServerCandidateResponse } from "../query-factory";
import { useNavigate, useLocation, href, To } from "react-router";
import { serializeNewChatSearchParams } from "@/routes/main/routes/messages/routes/new/search-params";
import {
	CrumbItem,
	Crumbs,
	CrumbsLocationState,
} from "@/routes/main/components/app-header/bread-crumb-navigation";
import React from "react";

export const CandidateProfileCard = ({
	data,
}: {
	data: ServerCandidateResponse;
}) => {
	const navigate = useNavigate();
	const currentLocation = useLocation();

	const navigateTo: To = React.useMemo(() => {
		if (data.chatId) {
			return href("/messages/:id", {
				id: data.chatId,
			});
		}
		return {
			pathname: href("/messages/new"),
			search: serializeNewChatSearchParams({
				recipientId: data.userId,
			}),
		};
	}, [data.chatId, data.userId]);

	const crumbsForTarget: Crumbs = React.useMemo(() => {
		const baseCrumb: CrumbItem = {
			to: currentLocation,
			label: "Candidates search",
		};
		if (data.chatId) {
			return [
				baseCrumb,
				{
					label: `Chat with ${data.name}`,
				},
			];
		}
		return [
			baseCrumb,
			{
				label: "Send a message",
			},
		];
	}, [currentLocation, data.chatId, data.name]);
	return (
		<PlayerDynamicCard
			{...data}
			userType={data.isSupporter ? "supporter" : "player"}
			onMessage={() => {
				void navigate(navigateTo, {
					state: {
						crumbs: crumbsForTarget,
					} satisfies CrumbsLocationState,
				});
			}}
		/>
	);
};
