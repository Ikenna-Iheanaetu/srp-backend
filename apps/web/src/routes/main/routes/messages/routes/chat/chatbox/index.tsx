/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { CardDescription, CardTitle } from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getErrorMessage } from "@/lib/utils";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { EntityProfileParams } from "@/routes/main/routes/entity/schemas";
import dayjs from "dayjs";
import React from "react";
import { href, LinkProps, useLocation } from "react-router";
import {
	Chat,
	ChatContent,
	ChatHeader,
	ChatRecipientInfo,
	ChatStatusBadge,
} from "../../../components/chat";
import { useChatDetails } from "../hooks/use-chat-details";
import { ChatActionsDropdown } from "./components/chat-actions-dropdown";
import { ChatStatusSection } from "./components/chat-status-section";
import { MessageComposerSection } from "./components/message-composer-section";
import { MessageFeedSection } from "./components/message-feed-section";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useChatMessagesQueryConfig } from "../hooks/use-chat-messages-query-config";
import { ChatSkeleton } from "./skeleton";

const ChatExpirationBadge = ({
	className,
	expiresAt,
}: {
	className?: string;
	expiresAt: string;
}) => {
	const daysLeft = React.useMemo((): number => {
		const expiresAtObject = dayjs(expiresAt);
		const now = dayjs();
		return expiresAtObject.diff(now, "day");
	}, [expiresAt]);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<ChatStatusBadge className={className}>
					{Math.max(0, daysLeft)} Days left
				</ChatStatusBadge>
			</TooltipTrigger>
			<TooltipContent>
				<p>
					Remaining time before the chat is terminated on{" "}
					{dayjs(expiresAt).format("MMM D")}.
				</p>
			</TooltipContent>
		</Tooltip>
	);
};

/**
 * Consolidates the loading, error, and refetch logic for the Chat Details
 * and Chat Messages queries.
 */
const useChatLoadingState = () => {
	const {
		data: chatDetails,
		isLoading: isLoadingDetails,
		error: detailsError,
		isSuccess: hasLoadedDetails,
		refetch: refetchDetails,
	} = useChatDetails();

	const { queryOptions } = useChatMessagesQueryConfig();
	const {
		isLoading: isLoadingMsgs,
		error: msgsError,
		isSuccess: hasLoadedMsgs,
		refetch: refetchMsgs,
	} = useInfiniteQuery(queryOptions);

	const loadingError = (() => {
		const hasLoaded = hasLoadedMsgs && hasLoadedDetails;
		const hasLoadingError = !hasLoaded && (msgsError || detailsError);
		if (!hasLoadingError) {
			return null;
		}

		if (detailsError && msgsError) {
			return (
				getErrorMessage(detailsError) + " " + getErrorMessage(msgsError)
			);
		}
		if (detailsError) {
			return getErrorMessage(detailsError);
		}
		if (msgsError) {
			return getErrorMessage(msgsError);
		}

		return null;
	})();

	const isLoadingData = isLoadingDetails || isLoadingMsgs;

	const handleRetry = () => {
		if (detailsError) {
			void refetchDetails();
		}
		if (msgsError) {
			void refetchMsgs();
		}
	};

	return {
		chatDetails,
		isLoadingData,
		loadingError,
		handleRetry,
	};
};

export const ChatBox = ({ className }: { className?: string }) => {
	const { chatDetails, isLoadingData, loadingError, handleRetry } =
		useChatLoadingState();
	const recipient = chatDetails?.recipient;

	const currentLocation = useLocation();

	const recipientProfileOptions: LinkProps = React.useMemo(
		() =>
			recipient
				? {
						to: href("/:userType/:id", {
							userType:
								recipient?.userType as EntityProfileParams["userType"],
							id: recipient?.profileId,
						} satisfies EntityProfileParams),
						state: {
							crumbs: [
								{
									label: `Chat with ${recipient?.name}`,
									to: currentLocation,
								},
								{
									label: "Profile",
								},
							],
						} satisfies CrumbsLocationState,
					}
				: ({} as LinkProps),
		[currentLocation, recipient],
	);

	if (isLoadingData || loadingError) {
		return (
			<ChatSkeleton
				onRetry={handleRetry}
				loadingError={loadingError}
				className={cn("flex-1", className)}
			/>
		);
	}

	return (
		<Chat className={cn("relative", className)}>
			<ChatHeader className="flex items-center justify-between gap-3">
				<div className="sr-only">
					<CardTitle>
						<h3>
							{recipient
								? `Chat with ${recipient.name}`
								: "Chat Box"}
						</h3>
					</CardTitle>
					<CardDescription>
						<p>
							{recipient &&
								`This chat expires ${dayjs(chatDetails.expiresAt).toNow()}`}
						</p>
					</CardDescription>
				</div>

				{/* avatar and name */}
				{recipient && (
					<LinkButton
						{...recipientProfileOptions}
						disableDefaultStyles
						variant={"ghost"}
						className="size-fit p-0">
						<ChatRecipientInfo recipient={recipient} />
					</LinkButton>
				)}

				<div className="flex items-stretch gap-1">
					{chatDetails?.status === "PENDING" ? (
						<ChatStatusBadge>Pending Request</ChatStatusBadge>
					) : (
						chatDetails?.status === "ACCEPTED" && (
							<ChatExpirationBadge
								expiresAt={chatDetails.expiresAt}
							/>
						)
					)}

					<ChatActionsDropdown />
				</div>
			</ChatHeader>

			<ChatContent>
				<MessageFeedSection className="flex-1" />
				<ChatStatusSection />
				<MessageComposerSection />
			</ChatContent>
		</Chat>
	);
};
