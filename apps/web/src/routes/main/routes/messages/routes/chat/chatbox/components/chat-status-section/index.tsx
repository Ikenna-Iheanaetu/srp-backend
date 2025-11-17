/** @format */

import { useChatDetails } from "../../../hooks/use-chat-details";
import {
	ChatDeclinedByMeAction,
	ChatDeclinedByThemAction,
} from "./components/chat-declined-action";
import {
	ChatEndedByMeAction,
	ChatEndedByThemAction,
} from "./components/chat-ended-action";
import {
	ChatExpiredByMeAction,
	ChatExpiredByThemAction,
} from "./components/chat-expired-action";
import { ChatRequestedAction } from "./components/chat-request-action";
import { ChatStatusAlert } from "./components/chat-status-alert";

export const ChatStatusSection = () => {
	const { data: chatDetails } = useChatDetails();

	return (
		<>
			{chatDetails?.status === "PENDING" &&
				(chatDetails.initiatedBy === "ME" ? (
					<ChatStatusAlert
						title="This Message request is still pending"
						status="PENDING"
					/>
				) : (
					<>
						<ChatStatusAlert
							title="This Message request is pending your approval"
							status="PENDING"
							className="mb-6"
						/>

						<ChatRequestedAction
							title={`You have a new message from ${chatDetails.recipient?.name}`}
						/>
					</>
				))}

			{chatDetails?.status === "DECLINED" &&
				(chatDetails.initiatedBy === "ME" ? (
					<>
						<ChatStatusAlert
							status="DECLINED"
							title="This Message request was declined"
							className="mb-6"
						/>
						<ChatDeclinedByThemAction
							title={`Your message request was declined`}
							description="You can resend the request after the cooldown period"
						/>
					</>
				) : (
					<>
						<ChatStatusAlert
							status="DECLINED"
							title="You declined this message request"
							className="mb-16 lg:mb-12"
						/>

						<ChatDeclinedByMeAction
							title="You declined this message request"
							description="Changed your mind? You can reopen this chat after the cooldown period"
						/>
					</>
				))}

			{chatDetails?.status === "ENDED" &&
				(chatDetails.closedBy === "ME" ? (
					<>
						<ChatStatusAlert
							status="ENDED"
							title="You ended this Conversation"
							className="mb-16 lg:mb-12"
						/>
						<ChatEndedByMeAction
							title="You ended this Conversation"
							description="Changed your mind? You can reactivate this chat after the cooldown period"
						/>
					</>
				) : (
					<>
						<ChatStatusAlert
							status="ENDED"
							title="Conversation ended"
							className="mb-6"
						/>
						<ChatEndedByThemAction
							title="Conversation ended"
							description="You can reactivate this chat after the cooldown period"
						/>
					</>
				))}

			{chatDetails?.status === "EXPIRED" &&
				(chatDetails.initiatedBy === "ME" ? (
					<>
						<ChatStatusAlert
							status="EXPIRED"
							title={
								chatDetails.remainingExtensions > 0
									? "Conversation period has passed"
									: "All extensions exhausted"
							}
							className="mb-6"
						/>
						<ChatExpiredByMeAction
							title={
								chatDetails.remainingExtensions > 0
									? "Conversation period has passed"
									: "All extensions exhausted"
							}
							description={
								chatDetails.remainingExtensions > 0
									? "You can extend this conversation"
									: chatDetails.canRetryAt
										? "You can resend the request after the cooldown period"
										: "You can resend the request"
							}
						/>
					</>
				) : (
					<>
						<ChatStatusAlert
							status="EXPIRED"
							title="Conversation period has passed"
							className="mb-6"
						/>
						<ChatExpiredByThemAction
							title="Conversation period has passed"
							description="You can send a request after the cooldown period"
						/>
					</>
				))}
		</>
	);
};
