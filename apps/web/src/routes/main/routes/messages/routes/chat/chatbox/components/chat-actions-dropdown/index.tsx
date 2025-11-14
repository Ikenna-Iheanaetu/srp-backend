/** @format */

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { cn } from "@/lib/utils";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { EntityProfileParams } from "@/routes/main/routes/entity/schemas";
import { MoreVertical } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import React from "react";
import { href, Link, LinkProps, useLocation } from "react-router";
import { useChatDetails } from "../../../hooks/use-chat-details";
import { RecipientProfileCard } from "./components/recipient-profile-card";
import { PlayerHireForm } from "./components/player-hire-form";
import { useEndChat } from "./hooks/use-end-chat";
import { useChatRoom } from "../../../chat-room-context";
import { toast } from "sonner";
import { LoadingIndicator } from "@/components/common/loading-indicator";

export const ChatActionsDropdown = ({ className }: { className?: string }) => {
	const { data: chatDetails } = useChatDetails();
	const recipient = chatDetails?.recipient;

	const currentLocation = useLocation();

	const [hireModal, setHireModal] = useQueryState(
		"modal",
		parseAsStringEnum(["hire"]).withOptions({
			history: "push", // Allow using search params navigation to open the hire dialog
		}),
	);

	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: ["player", "supporter", "company"],
	});
	const currentUserType = cookies.userType;

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

	const { mutate: endChat, isPending: isEndingChat } = useEndChat();
	const { roomId } = useChatRoom();
	const isChatActive = chatDetails?.status === "ACCEPTED";

	return (
		<Dialog
			open={currentUserType === "company" && hireModal === "hire"}
			onOpenChange={(isOpen) => {
				if (currentUserType === "company") {
					void setHireModal(isOpen ? "hire" : null);
				}
			}}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="text-muted-foreground"
						aria-label="More options">
						<MoreVertical className={cn("size-5", className)} />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end">
					<DropdownMenuItem asChild>
						<Link
							{...recipientProfileOptions}
							className="cursor-pointer">
							View Profile
						</Link>
					</DropdownMenuItem>

					{currentUserType === "company" && (
						<DialogTrigger asChild>
							<DropdownMenuItem className="capitalize">
								Hire {recipient?.userType}
							</DropdownMenuItem>
						</DialogTrigger>
					)}

					<DropdownMenuItem
						disabled={!isChatActive || isEndingChat}
						onClick={() => {
							if (!roomId) {
								toast.error("Chat room not ready");
								return;
							}
							endChat({ chatId: roomId });
						}}>
						{isEndingChat ? (
							<>
								Ending <LoadingIndicator />
							</>
						) : (
							"End Chat"
						)}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{currentUserType === "company" && (
				<DialogContent className="max-h-[80dvh] gap-6 overflow-y-auto tw-scrollbar">
					<DialogHeader className="gap-6 space-y-0">
						<DialogTitle className="self-start capitalize">
							Hire {recipient?.userType}
						</DialogTitle>
						<DialogDescription className="sr-only">
							Use this dialog to hire the {recipient?.userType}.
						</DialogDescription>
						<Separator />

						{recipient && <RecipientProfileCard {...recipient} />}
					</DialogHeader>

					<PlayerHireForm
						onCancel={() => void setHireModal(null)}
						onHireSuccess={() => void setHireModal(null)}
					/>
				</DialogContent>
			)}
		</Dialog>
	);
};
