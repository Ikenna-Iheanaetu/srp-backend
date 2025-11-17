/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@repo/shared";
import React from "react";
import { ExternalToast } from "sonner";

const ChatToast = ({ className, ...props }: React.ComponentProps<"div">) => (
	<div
		{...props}
		className={cn("flex items-center justify-between gap-3", className)}
	/>
);

const ChatToastContent = ({
	className,
	...props
}: React.ComponentProps<"div">) => (
	<div {...props} className={cn("flex items-center gap-3", className)} />
);

const ChatToastAvatar = ({
	className,
	...props
}: React.ComponentProps<typeof Avatar>) => (
	<Avatar {...props} className={cn("size-10", className)} />
);

const ChatToastDetails = ({
	className,
	...props
}: React.ComponentProps<"div">) => (
	<div {...props} className={cn("flex flex-col", className)} />
);

const ChatToastTitle = ({
	className,
	...props
}: React.ComponentProps<"h3">) => (
	<h3 {...props} className={cn("font-semibold", className)} />
);

const ChatToastDescription = ({
	className,
	...props
}: React.ComponentProps<"p">) => (
	<p {...props} className={cn("text-sm text-slate-500", className)} />
);

const ChatToastLinkAction = ({
	className,
	...props
}: React.ComponentProps<typeof LinkButton>) => (
	<LinkButton {...props} className={cn("!p-2", className)} />
);

const CHAT_TOAST_CONFIG = {
	position: "top-center",
	duration: 8000,
} as const satisfies ExternalToast;

export {
	CHAT_TOAST_CONFIG,
	ChatToast,
	ChatToastAvatar,
	ChatToastContent,
	ChatToastDescription,
	ChatToastDetails,
	ChatToastLinkAction,
	ChatToastTitle,
};
