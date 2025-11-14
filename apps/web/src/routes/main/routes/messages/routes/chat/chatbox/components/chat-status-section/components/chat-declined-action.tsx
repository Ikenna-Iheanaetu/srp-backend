/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { DrawerHeader } from "@/components/ui/drawer";
import React from "react";
import {
	ChatDrawer,
	ChatDrawerContent,
	ChatDrawerDescription,
	ChatDrawerFooter,
	ChatDrawerTitle,
} from "./chat-drawer";
import { useResendRequest } from "../hooks/use-declined-action";
import { useChatRoom } from "../../../../chat-room-context";
import { toast } from "sonner";
import { href, useNavigate } from "react-router";

interface ChatDeclinedActionProps {
	title: string;
	description?: string;
}

export const ChatDeclinedAction: React.FC<ChatDeclinedActionProps> = ({
	title,
	description,
}) => {
	const { mutate: resend, isPending: isResending } = useResendRequest();
	const navigate = useNavigate();
	const [isClosing, setIsClosing] = React.useState(false);
	const isActionRunning = isResending || isClosing;

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
							resend({ chatId: roomId });
						}}
						className="button">
						{isResending ? (
							<>
								Resending <LoadingIndicator />
							</>
						) : (
							"Resend Request"
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
