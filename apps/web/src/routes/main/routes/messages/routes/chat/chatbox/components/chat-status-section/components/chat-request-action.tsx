/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { DrawerHeader } from "@/components/ui/drawer";
import React from "react";
import { toast } from "sonner";
import { useChatRoom } from "../../../../chat-room-context";
import {
	useAcceptRequest,
	useDeclineRequest,
} from "../hooks/use-request-action";
import {
	ChatDrawer,
	ChatDrawerContent,
	ChatDrawerDescription,
	ChatDrawerFooter,
	ChatDrawerTitle,
} from "./chat-drawer";

interface ChatRequestActionProps {
	title: string;
	description?: string;
}

export const ChatRequestedAction: React.FC<ChatRequestActionProps> = ({
	title,
	description,
}) => {
	const { mutate: accept, isPending: isAccepting } = useAcceptRequest();
	const { mutate: decline, isPending: isDeclining } = useDeclineRequest();
	const isActionRunning = isAccepting || isDeclining;

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
							accept({ chatId: roomId });
						}}
						className="button">
						{isAccepting ? (
							<>
								Accepting <LoadingIndicator />
							</>
						) : (
							"Accept Request"
						)}
					</Button>
					<Button
						disabled={isActionRunning}
						onClick={() => {
							if (!isChatRoomReady) {
								toast.error("Chat Room not ready");
								return;
							}
							decline({ chatId: roomId });
						}}
						variant={"destructive"}>
						{isDeclining ? (
							<>
								Declining <LoadingIndicator />
							</>
						) : (
							"Decline Request"
						)}
					</Button>
				</ChatDrawerFooter>
			</ChatDrawerContent>
		</ChatDrawer>
	);
};
