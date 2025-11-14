/** @format */

import { useChatDetails } from "../../../hooks/use-chat-details";
import { ChatDeclinedAction } from "./components/chat-declined-action";
import { ChatExpiredAction } from "./components/chat-expired-action";
import { ChatRequestedAction } from "./components/chat-request-action";
import { ChatStatusAlert } from "./components/chat-status-alert";
import { useListenForChatAcceptance } from "./hooks/use-listen-for-chat-acceptance";
import { useListenForChatEnded } from "./hooks/use-listen-for-chat-ended";
import { useListenForChatExpiredUpdates } from "./hooks/use-listen-for-chat-expired-updates";
import { useListenForRequestResent } from "./hooks/use-listen-for-request-resent";

export const ChatStatusSection = () => {
	const { data: chatDetails } = useChatDetails();

	useListenForChatAcceptance();
	useListenForChatEnded();
	useListenForRequestResent();
	useListenForChatExpiredUpdates();

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
						<ChatDeclinedAction
							title={`Your message request was declined`}
						/>
					</>
				) : (
					<ChatStatusAlert
						status="DECLINED"
						title="You declined this message request"
					/>
				))}

			{chatDetails?.status === "ENDED" &&
				(chatDetails.initiatedBy === "ME" ? (
					<>
						<ChatStatusAlert
							status="ENDED"
							title={`${chatDetails.closedBy === "ME" ? "You ended this Conversation" : "Conversation ended"}. Send a new message to send a new request`}
							className="mb-6"
						/>
					</>
				) : (
					<ChatStatusAlert
						status="ENDED"
						title={`${chatDetails.closedBy === "ME" ? "You ended this Conversation" : "Conversation ended"}. Send a new message to request opening Conversation again.`}
					/>
				))}

			{chatDetails?.status === "EXPIRED" &&
				(chatDetails.initiatedBy === "ME" ? (
					<>
						<ChatStatusAlert
							status="EXPIRED"
							title="Conversation period has passed."
							className="mb-16"
						/>

						<ChatExpiredAction
							title={"Conversation period has passed"}
							description="What would you like to do?"
						/>
					</>
				) : (
					<ChatStatusAlert
						status="EXPIRED"
						title="Conversation ended."
					/>
				))}
		</>
	);
};
