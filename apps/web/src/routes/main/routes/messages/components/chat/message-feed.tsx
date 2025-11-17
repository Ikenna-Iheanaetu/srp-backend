/** @format */

import { Badge } from "@/components/ui/badge";
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
import { ItemGroup } from "@/components/ui/item";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
	DropdownMenuItemProps,
	DropdownMenuTriggerProps,
} from "@radix-ui/react-dropdown-menu";
import dayjs from "dayjs";
import { Check, CheckCheck, CircleAlert, Clock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { VList } from "virtua";
import {
	MessageDocumentAttachment,
	MessageDocumentAttachmentProps,
	MessageImageAttachment,
	MessageImageAttachmentProps,
} from ".";
import {
	AttachmentCategory,
	MessageAttachment,
	RenderableChatMessage,
} from "../../routes/chat/types";
import { isClientOnlyMessage } from "../../routes/chat/utils";
import "./typing-indicator.css";
import { useLongPress } from "./use-long-press";

const MessageFeedArea: React.FC<React.ComponentProps<"div">> = ({
	className,
	...props
}) => (
	<div
		{...props}
		className={cn("relative flex flex-1 flex-col gap-2 pb-3", className)}
	/>
);

const MessageFeed: React.FC<React.ComponentProps<typeof VList>> = ({
	className,
	...props
}) => (
	<VList
		role="log" // don't use "list", because this list gets live updates
		reverse
		{...props}
		className={cn("flex-1 pr-2 tw-scrollbar", className)}
	/>
);

export interface MessageItemContextType {
	isLastInBlock: boolean;
	message: RenderableChatMessage;
}
const MessageItemContext = React.createContext<MessageItemContextType | null>(
	null,
);
const useMessageItem = () => {
	const ctx = React.use(MessageItemContext);
	if (!ctx) {
		throw new Error(
			"useMessageItem must be used within a MessageItemContext.",
		);
	}
	return ctx;
};

type MessageItemProps = React.ComponentProps<"div"> & MessageItemContextType;
const MessageItem: React.FC<MessageItemProps> = ({
	isLastInBlock,
	message,
	className,
	...props
}) => {
	React.useEffect(() => {
		return () => {
			if (isClientOnlyMessage(message)) {
				// All attachments urls were generated client-side, so revoke them on unmount to release memory
				message.attachments?.forEach(({ url }) => {
					URL.revokeObjectURL(url);
				});
			}
		};
	}, [message]);

	const ctxValue: MessageItemContextType = React.useMemo(
		() => ({
			isLastInBlock,
			message,
		}),
		[isLastInBlock, message],
	);

	const isFromMe = message.from === "ME";

	return (
		<MessageItemContext value={ctxValue}>
			<div
				role="listitem"
				aria-label={
					isFromMe ? "Message sent by you" : "Message from recipient"
				}
				{...props}
				className={cn(
					"my-1 flex w-fit max-w-[80%] flex-col gap-1",
					isFromMe ? "ml-auto" : "mr-auto",
					isLastInBlock && "mb-4",
					className,
				)}
			/>
		</MessageItemContext>
	);
};

/**
 * Show control menu options for when a message failed to send.
 */
const MessageFailedControlMenu = ({
	children,
	menuTrigger,
	message,
	...triggerProps
}: DropdownMenuTriggerProps & {
	/**These should be ${@link MessageFailedControlItem} components */
	children: React.ReactNode;
	/**Intended to be {@link MessageItem}*/
	menuTrigger: React.ReactElement;
	message: RenderableChatMessage;
}) => {
	const [isMenuOpen, setIsMenuOpen] = React.useState(false);
	const failedToSend = message.status === "FAILED";

	const longPressHandlers = useLongPress(() => {
		if (failedToSend) {
			setIsMenuOpen(true);
		}
	});

	const longPressId = React.useId();

	const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);

	return (
		<DropdownMenu
			open={isMenuOpen}
			onOpenChange={(toOpen) => {
				if (toOpen && failedToSend) {
					setIsMenuOpen(true);
				} else {
					setIsMenuOpen(false);
				}
			}}>
			<TooltipProvider>
				<Tooltip
					open={isTooltipOpen}
					onOpenChange={(toOpen) => {
						if (toOpen && failedToSend) {
							setIsTooltipOpen(true);
						} else {
							setIsTooltipOpen(false);
						}
					}}>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger
							disabled // this is crucial for long press to work
							asChild // also crucial for long press
							aria-describedby={longPressId}
							{...triggerProps}
							{...longPressHandlers}>
							{menuTrigger}
						</DropdownMenuTrigger>
					</TooltipTrigger>

					<TooltipContent>
						<p id={longPressId}>Press and hold to show options</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<DropdownMenuContent side="bottom" align="end">
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

interface MessageFailedControlItemProps
	extends SafeOmit<DropdownMenuItemProps, "children"> {
	children: React.ReactNode;
}
const MessageFailedControlItem = ({
	children,
	className,
	...props
}: MessageFailedControlItemProps) => {
	return (
		<DropdownMenuItem
			{...props}
			className={cn("text-slate-950 [&_svg]:text-slate-950", className)}>
			{children}
		</DropdownMenuItem>
	);
};

const MessageBubble: React.FC<
	SafeOmit<React.ComponentProps<"p">, "children">
> = ({ className, ...props }) => {
	const { message } = useMessageItem();
	const failedToSend = message.status === "FAILED";
	const hasTxtContent =
		typeof message.content === "string" && message.content !== "";
	return (
		hasTxtContent && (
			<p
				{...props}
				className={cn(
					"break-words rounded-2xl border px-5 py-4 text-xs font-medium",
					failedToSend
						? "border-red-500 bg-red-50 text-red-800"
						: "bg-slate-50 text-slate-700",
					className,
				)}>
				{message.content}
			</p>
		)
	);
};

type MessageAttachmentsListProps<
	TCategory extends AttachmentCategory = AttachmentCategory,
> = SafeOmit<React.ComponentProps<typeof ItemGroup>, "children"> & {
	children: (
		attachments: (MessageAttachment & { category: TCategory })[],
	) => React.ReactNode;
	category?: TCategory;
};
const MessageAttachmentsList = <TCategory extends AttachmentCategory>({
	className,
	children,
	category,
	...props
}: MessageAttachmentsListProps<TCategory>) => {
	const { message } = useMessageItem();
	const isFromMe = message.from === "ME";

	const filteredAttachments = React.useMemo(
		() =>
			(message.attachments?.filter(
				(attachment) => attachment.category === category,
			) as (MessageAttachment & { category: TCategory })[]) ?? [],
		[category, message.attachments],
	);

	return (
		filteredAttachments.length > 0 && (
			<ItemGroup
				{...props}
				className={cn(
					"flex-row gap-2 overflow-x-auto pb-3 tw-scrollbar",
					// align items to the right when from me
					// using justify start/end prevents scroll
					isFromMe && "[&>:first-child]:ml-auto",
					className,
				)}>
				{children(filteredAttachments)}
			</ItemGroup>
		)
	);
};

const MessageDocumentAttachmentDisplay = ({
	className,
	attachment,
	...props
}: MessageDocumentAttachmentProps) => {
	return (
		<a href={attachment.url} download={attachment.name} target="_blank">
			<MessageDocumentAttachment
				{...props}
				attachment={attachment}
				className={cn("bg-slate-50", className)}
			/>
		</a>
	);
};

const MessageImageAttachmentDisplay = ({
	className,
	attachment,
	...props
}: MessageImageAttachmentProps) => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<a /* I didn't use <button> because div can't be a child */
					href="#"
					role="button"
					aria-label={`View full image: ${attachment.name}`}>
					<MessageImageAttachment
						{...props}
						attachment={attachment}
						className={cn("bg-slate-50", className)}
					/>
				</a>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>{attachment.name}</DialogTitle>
					<DialogDescription className="sr-only">
						Full view of the image attachment.
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[60dvh] flex-1">
					<img
						src={attachment.url}
						alt={attachment.name}
						className="size-full rounded-xl object-contain"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const MessageFooter: React.FC<React.ComponentProps<"div">> = ({
	className,
	...props
}) => {
	const { message, isLastInBlock } = useMessageItem();
	return (
		isLastInBlock && (
			<div
				{...props}
				className={cn(
					"flex items-center gap-3",
					message.from === "ME" ? "justify-end" : "justify-start",
					className,
				)}
			/>
		)
	);
};

const MessageTimestamp: React.FC<
	SafeOmit<React.ComponentProps<"time">, "children" | "dateTime">
> = ({ className, ...props }) => {
	const { message } = useMessageItem();
	const failedToSend = message.status === "FAILED";
	return (
		<time
			{...props}
			dateTime={message.timestamp}
			className={cn(
				"text-xs",
				failedToSend ? "text-red-500" : "text-slate-500",
				className,
			)}>
			{dayjs(message.timestamp).format("hh:mm A")}
		</time>
	);
};

const MessageDeliveryStatus: React.FC<
	SafeOmit<React.ComponentProps<typeof Badge>, "children">
> = ({ className, ...props }) => {
	const { message } = useMessageItem();
	return (
		message.from === "ME" && (
			<Badge
				role="status"
				aria-label={`Delivery status: ${message.status.toLowerCase()}`}
				{...props}
				className={cn(
					"bg-transparent p-0 text-xs shadow-none",
					className,
				)}>
				{(() => {
					switch (message.status) {
						case "SENDING":
							return (
								<Clock size={16} className="text-slate-400" />
							);

						case "FAILED":
							return (
								<CircleAlert
									size={16}
									className="text-red-500"
								/>
							);

						case "SENT":
							return (
								<Check size={16} className="text-slate-400" />
							);

						case "DELIVERED":
							return (
								<CheckCheck
									size={16}
									className={"text-slate-400"}
								/>
							);

						case "READ":
							return (
								<CheckCheck
									size={16}
									className={"text-blue-700"}
								/>
							);

						default:
							break;
					}
				})()}
			</Badge>
		)
	);
};

function MessageTypingIndicator({
	className,
	isTyping,
}: {
	className?: string;
	isTyping: boolean;
}) {
	// NOTE: Make sure the typing-indicator.css file is imported in this file
	return (
		<AnimatePresence>
			{isTyping && (
				<motion.div
					key="typing-indicator" // Required for AnimatePresence
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 10 }}
					transition={{ duration: 0.3 }}
					className={cn(
						"inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-200 p-3 dark:bg-slate-700",
						className,
					)}>
					{[0, 0.2, 0.4].map((delay) => (
						<div
							key={delay}
							className="typing-dot size-2 rounded-full bg-slate-400 dark:bg-slate-500"
							style={{ animationDelay: delay + "s" }}
						/>
					))}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export {
	MessageAttachmentsList,
	MessageBubble,
	MessageDeliveryStatus,
	MessageDocumentAttachmentDisplay,
	MessageFailedControlItem,
	MessageFailedControlMenu,
	MessageFeed,
	MessageFeedArea,
	MessageFooter,
	MessageImageAttachmentDisplay,
	MessageItem,
	MessageTimestamp,
	MessageTypingIndicator,
};
