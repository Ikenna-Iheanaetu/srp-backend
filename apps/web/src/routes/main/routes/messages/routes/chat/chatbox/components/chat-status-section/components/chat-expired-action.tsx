/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { DrawerHeader } from "@/components/ui/drawer";
import React from "react";
import { href, useNavigate } from "react-router";
import { toast } from "sonner";
import { useChatRoom } from "../../../../chat-room-context";
import { useExtendChatPeriod } from "../hooks/use-extend-chat-period";
import {
	ChatDrawer,
	ChatDrawerContent,
	ChatDrawerDescription,
	ChatDrawerFooter,
	ChatDrawerTitle,
} from "./chat-drawer";

interface ChatExpiredActionProps {
	title: string;
	description?: string;
}

export const ChatExpiredAction: React.FC<ChatExpiredActionProps> = ({
	title,
	description,
}) => {
	const { mutate: extend, isPending: isExtending } = useExtendChatPeriod();
	const navigate = useNavigate();
	const [isClosing, setIsClosing] = React.useState(false);
	const isActionRunning = isExtending || isClosing;

	const handleCloseChat = async () => {
		setIsClosing(true);
		await navigate(href("/messages"));
		setIsClosing(false);
	};

	const { roomId } = useChatRoom();
	const isChatRoomReady = !!roomId;

	return (
		<ChatDrawer>
			<ChatDrawerContent>
				<DrawerHeader>
					<ChatDrawerTitle>{title}</ChatDrawerTitle>
					<ChatDrawerDescription>{description}</ChatDrawerDescription>
				</DrawerHeader>

				<ChatDrawerFooter>
					<Button
						disabled={isActionRunning}
						onClick={() => {
							if (!isChatRoomReady) {
								toast.error("Chat Room not ready");
								return;
							}
							extend({ chatId: roomId });
						}}
						className="button">
						{isExtending ? (
							<>
								Extending <LoadingIndicator />
							</>
						) : (
							"Extend Conversation"
						)}
					</Button>
					<Button
						disabled={isActionRunning}
						onClick={() => {
							void handleCloseChat();
						}}
						variant={"destructive"}>
						{isClosing ? (
							<>
								Closing <LoadingIndicator />
							</>
						) : (
							"Close chat"
						)}
					</Button>
				</ChatDrawerFooter>
			</ChatDrawerContent>
		</ChatDrawer>
	);
};
