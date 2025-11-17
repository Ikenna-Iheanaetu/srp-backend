/** @format */
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import React from "react";
import { CHATBOX_CONTAINER_ID } from "../../../constants";

const getChatboxContainer = () => document.getElementById(CHATBOX_CONTAINER_ID);
const ChatDrawer = ({
	container,
	defaultOpen = true,
	dismissible = false,
	modal = false,
	...props
}: React.ComponentProps<typeof Drawer>) => {
	// Hack to remove focus trap
	// See https://github.com/emilkowalski/vaul/issues/497#issuecomment-3540156203
	React.useEffect(() => {
		if (!modal && (props.open || defaultOpen)) {
			// Pushing the change to the end of the call stack
			const timer = setInterval(() => {
				document.body.style.pointerEvents = "";
			}, 10);

			return () => clearInterval(timer);
		}
	}, [defaultOpen, modal, props.open]);

	const [chatboxContainer, setChatboxContainer] = React.useState(
		() => container ?? getChatboxContainer(),
	);

	React.useEffect(() => {
		if (chatboxContainer) {
			return;
		}

		// See https://github.com/emilkowalski/vaul/issues/448#issuecomment-3398195517
		// NOTE: This workaround was initially the solution in the issue comment, but used polling instead to avoid duplication of rerender logic

		// Start polling for when chatbox container is rendered
		const pollInterval = 10;
		const maxPollCount = Math.floor(2000 / pollInterval); // stop  polling after 2 secs
		let pollCount = 0;
		const pollId = setInterval(() => {
			pollCount++;
			const container = getChatboxContainer();
			if (container) {
				clearInterval(pollId);
				setChatboxContainer(container);
			}

			if (pollCount >= maxPollCount) {
				clearInterval(pollId);
			}
		}, pollInterval);

		return () => clearInterval(pollId);
	}, [chatboxContainer]);

	return (
		<Drawer
			container={
				// NOTE: This is very important, for chat drawers to render under the chatbox's container
				chatboxContainer
			}
			defaultOpen={defaultOpen}
			dismissible={dismissible}
			modal={modal}
			{...props}
		/>
	);
};

const ChatDrawerContent = ({
	className,
	...props
}: React.ComponentProps<typeof DrawerContent>) => (
	<DrawerContent
		{...props}
		className={cn(
			// Position must be "absolute" to be positioned under chatbox container
			"absolute",
			className,
		)}
	/>
);

const ChatDrawerTitle = ({
	className,
	...props
}: React.ComponentProps<typeof DrawerTitle>) => (
	<DrawerTitle {...props} className={cn("text-center", className)} />
);

const ChatDrawerDescription = ({
	className,
	...props
}: React.ComponentProps<typeof DrawerDescription>) => (
	<DrawerDescription {...props} className={cn("text-center", className)} />
);

const ChatDrawerFooter = ({
	className,
	...props
}: React.ComponentProps<typeof DrawerFooter>) => (
	<DrawerFooter
		{...props}
		className={cn("justify-center sm:flex-row", className)}
	/>
);

export {
	ChatDrawer,
	ChatDrawerContent,
	ChatDrawerDescription,
	ChatDrawerFooter,
	ChatDrawerTitle,
};
