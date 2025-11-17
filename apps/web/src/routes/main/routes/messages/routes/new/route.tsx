/** @format */

import { cn } from "@/lib/utils";
import React, { Activity } from "react";
import { Chat } from "../../components/chat";
import { NewChat } from "./components/new-chat";
import { SearchSection } from "./components/search-section";
import { useRecipientsQuery } from "./hooks/use-recipients-query";
import { useSelectedRecipientId } from "./hooks/use-selected-recipient-id";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { useQuery } from "@tanstack/react-query";
import { profileQueries } from "../../../profile/query-factory";
import { AllowedChatUserSchema } from "../../constants";
import { getDb } from "./db";

const useInitNewChatDb = () => {
	const {
		cookies: { userType },
	} = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: AllowedChatUserSchema.options,
	});

	const { data: profile } = useQuery(profileQueries.byUserType(userType));

	React.useMemo(() => {
		if (profile?.id) {
			getDb(profile.id); // init db
		}
	}, [profile?.id]);

	// Recover stuck messages on page load
	React.useEffect(() => {
		if (!profile?.id) return;

		const recoverStuckMessages = async () => {
			const db = getDb(profile.id);

			// Use transaction to batch-update all SENDING → FAILED messages
			// This prevents multiple re-renders (single DB change event)
			await db.transaction("rw", db.messages, async () => {
				const recipientIds = await db.getRecipientIds();

				for (const recipientId of recipientIds) {
					const messages = await db.getRecipientMessages(recipientId);

					for (const msg of messages) {
						if (msg.status === "SENDING") {
							await db.updateMessageStatus(msg.id, "FAILED");
						}
					}
				}
			});
		};

		void recoverStuckMessages().catch(console.error);
	}, [profile?.id]);

	const isDbReady = !!profile?.id;

	return isDbReady;
};

export default function NewChatRoute() {
	const [selectedRecipientId, setSelectedRecipientId] =
		useSelectedRecipientId();

	const { recipients } = useRecipientsQuery();
	const selectedRecipient = React.useMemo(
		() =>
			selectedRecipientId
				? recipients?.find(
						(recipient) => recipient.id === selectedRecipientId,
					)
				: null,
		[selectedRecipientId, recipients],
	);

	const chatSectionStyles = cn("flex-1 lg:w-auto");

	const isDbReady = useInitNewChatDb();
	if (!isDbReady) {
		return null;
	}

	return (
		<div className="flex size-full gap-6">
			<SearchSection
				onSelectRecipient={(recipient) => {
					void setSelectedRecipientId({ recipientId: recipient.id });
				}}
				className={cn(
					// on mobile, hide when a company is selected
					selectedRecipient && "hidden",
					// always show on desktop
					"lg:block",
					"lg:flex-1 xl:max-w-[35%]",
				)}
			/>

			{recipients?.map((recipient) => (
				// <Activity> preserves the state of the NewChat component when switching recipients.
				// 'visible' for the current recipient, 'hidden' (state preserved, effects paused) for others.
				<Activity
					key={recipient.id}
					mode={
						recipient.id === selectedRecipientId
							? "visible"
							: "hidden"
					}>
					<NewChat
						recipient={recipient}
						className={chatSectionStyles}
					/>
				</Activity>
			))}

			{/* placeholder chat layout for when no recipient has been selected (not selected id) */}
			{!selectedRecipient && (
				<Chat
					className={cn(
						chatSectionStyles,

						// Don't show on mobile
						"hidden",
						// always show on desktop when no recipient is selected
						"lg:flex",
					)}
				/>
			)}
		</div>
	);
}
