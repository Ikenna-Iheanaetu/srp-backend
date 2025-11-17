/** @format */

// prettier-ignore
/* eslint-disable no-useless-escape */

import { Button, ButtonProps } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ItemGroup } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { LabelProps } from "@radix-ui/react-label";
import { ArrowUp, Paperclip, X } from "lucide-react";
import React from "react";
import {
	MessageDocumentAttachment,
	MessageDocumentAttachmentProps,
	MessageImageAttachment,
	MessageImageAttachmentProps,
} from ".";
import { ACCEPTED_MIME_TYPES } from "../../routes/chat/chatbox/components/message-composer-section/form-schema";
import { MessageAttachment } from "../../routes/chat/types";

const MessageComposer: React.FC<React.ComponentProps<"form">> = ({
	className,
	...props
}) => (
	<form
		role="form"
		aria-label="new message composer"
		{...props}
		className={cn("grid grid-cols-1 gap-4", className)}
	/>
);

const MessageQuickReplies: React.FC<React.ComponentProps<typeof ItemGroup>> = ({
	className,
	...props
}) => (
	<ItemGroup
		{...props}
		className={cn(
			"flex-row gap-2 overflow-x-auto py-2 tw-scrollbar",
			className,
		)}
	/>
);

interface MessageQuickReplyProps
	extends SafeOmit<React.ComponentProps<typeof Button>, "children"> {
	reply: string;
}
const MessageQuickReply: React.FC<MessageQuickReplyProps> = ({
	className,
	reply,
	...props
}) => (
	<Button
		type="button"
		{...props}
		className={cn(
			"group flex h-36 min-w-56 cursor-pointer flex-col flex-nowrap items-start justify-between gap-0 rounded-2xl border-slate-100 bg-slate-50 p-3 shadow-none transition-colors hover:bg-slate-100 active:scale-95",
			className,
		)}>
		<span className="line-clamp-3 block min-h-[28%] w-full whitespace-normal text-left text-xs leading-relaxed text-slate-500">
			{reply}
		</span>
		<span className="flex items-center gap-2 p-2">
			<span className="flex size-6 items-center justify-center rounded-full bg-slate-300 transition-colors group-hover:bg-lime-400 group-active:bg-lime-400">
				<ArrowUp className="text-white" size={16} />
			</span>

			<span className="text-xs font-medium text-slate-600">
				Click to send
			</span>
		</span>
	</Button>
);

const MessageInputArea: React.FC<React.ComponentProps<"div">> = ({
	className,
	...props
}) => (
	<div
		{...props}
		className={cn(
			"transition-[height flex w-full flex-col rounded-2xl bg-slate-50 p-2 pt-3 shadow-sm focus-within:ring-1",
			className,
		)}
	/>
);

const MessageAttachmentsPreview: React.FC<
	React.ComponentProps<typeof ItemGroup>
> = ({ className, ...props }) => (
	<ItemGroup
		{...props}
		className={cn(
			"flex-row gap-2 overflow-x-auto pb-3 tw-scrollbar",
			className,
		)}
	/>
);

interface MessageAttachmentControlProps extends React.ComponentProps<"div"> {
	onRemove: () => void;
	attachment: MessageAttachment;
	isValid: boolean;
}
const MessageAttachmentControl: React.FC<MessageAttachmentControlProps> = ({
	className,
	attachment,
	onRemove,
	children,
	isValid,
	...props
}) => {
	const isInvalid = !isValid;

	const handleRemove = () => {
		onRemove();
		// To improve performance, clear the preview url when this item is removed.
		// NOTE: Don't refactor this to revoke on unmount, because even if this component is removed from the UI, it doesn't mean the attachment is not being used elsewhere/anymore
		URL.revokeObjectURL(attachment.url);
	};

	return (
		<div
			role="listitem"
			aria-label={`Control for attachment: ${attachment.name}`}
			aria-invalid={isInvalid}
			{...props}
			className={cn("relative size-fit pr-1 pt-1", className)}>
			<div
				className={cn(
					"rounded-lg border-2 border-dashed border-transparent",
					isInvalid && "border-red-500",
				)}>
				{children}
			</div>
			<Button
				variant={"ghost"}
				size={"icon"}
				onClick={handleRemove}
				type="button"
				aria-label={`Remove attachment: ${attachment.name}`}
				className={cn(
					"absolute right-0 top-0 flex size-5 items-center justify-center rounded-full active:scale-95",
					isInvalid
						? "bg-red-500 hover:bg-red-600"
						: "bg-slate-700 hover:bg-slate-600",
				)}>
				<X size={10} className="text-white" />
			</Button>
		</div>
	);
};

const MessageDocumentAttachmentPreview = ({
	className,
	...props
}: MessageDocumentAttachmentProps) => {
	return (
		<MessageDocumentAttachment
			aria-label={`preview for attachment: ${props.attachment.name}`}
			{...props}
			className={cn("bg-slate-100", className)}
		/>
	);
};

const MessageImageAttachmentPreview = ({
	className,
	...props
}: MessageImageAttachmentProps) => {
	return (
		<MessageImageAttachment
			aria-label={`preview for attachment: ${props.attachment.name}`}
			{...props}
			className={cn("bg-slate-100", className)}
		/>
	);
};

const isMobileOrTablet = function () {
	let check = false;
	(function (a: string) {
		if (
			/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
				a,
			) ||
			/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
				a.substring(0, 5),
			)
		)
			check = true;
	})(
		navigator.userAgent ||
			navigator.vendor ||
			("opera" in window &&
				typeof window.opera === "string" &&
				window.opera) ||
			"",
	);
	return check;
};
const MessageTextBox: React.FC<React.ComponentProps<typeof Textarea>> = ({
	className,
	...props
}) => {
	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (isMobileOrTablet()) {
			return;
		}

		if (event.key === "Enter") {
			event.preventDefault();

			if (event.shiftKey) {
				// SHIFT + ENTER: Insert a newline
				const textarea = event.currentTarget;
				const { selectionStart, selectionEnd, value } = textarea;

				// Calculate and update the DOM value with the newline
				const newValue =
					value.substring(0, selectionStart) +
					"\n" +
					value.substring(selectionEnd);
				textarea.value = newValue;

				// Manually dispatch 'input' event to notify React's onChange/onInput
				// This ensures state updates for controlled components.
				textarea.dispatchEvent(
					new InputEvent("input", { bubbles: true }),
				);

				// Reset the cursor position one character past the inserted newline
				textarea.selectionStart = selectionStart + 1;
				textarea.selectionEnd = selectionStart + 1;
			} else {
				// ENTER (no Shift): Submit the form
				const form = event.currentTarget.form;
				if (form) {
					// form.submit() will reload the page
					form.dispatchEvent(
						new Event("submit", {
							bubbles: true,
							cancelable: true,
						}),
					);
				}
			}
		}
	};
	return (
		<Textarea
			placeholder="Type a message..."
			aria-label="message text content"
			{...props}
			onKeyDown={(e) => {
				handleKeyDown(e);
				props.onKeyDown?.(e);
			}}
			className={cn(
				"flex-1 resize-none border-0 shadow-none !ring-0 tw-scrollbar",
				className,
			)}
		/>
	);
};

const MessageInputFooter: React.FC<React.ComponentProps<"div">> = ({
	className,
	...props
}) => (
	<div
		{...props}
		className={cn("flex w-full items-center justify-between", className)}
	/>
);

type MessageAttachmentsPickerProps = SafeOmit<
	React.ComponentProps<typeof Input>,
	"type"
>;

/**
 * To be used under {@link DropdownMenuItem}, if you're placing it under {@link MessageAttachmentsPickerMenu}.
 *
 * **NOTE**: on change events, `e.target.value` is reset after calling `props.onChange`. This is to fix files being added twice.
 */
const MessageAttachmentsPicker: React.FC<MessageAttachmentsPickerProps> = ({
	className,
	children,
	onClick,
	style,
	role,
	"aria-label": ariaLabel,
	...props
}) => {
	// Ref to store the onClick event for DropdownMenuItem's onClick handler.
	// This is necessary to DEFER the menu-closing logic, as immediate
	// execution of Radix's handler causes the file input to lose focus.
	const pendingClickEventRef =
		React.useRef<React.MouseEvent<HTMLInputElement, MouseEvent>>(null);

	return (
		<Label
			role={role}
			aria-label={ariaLabel}
			{...(props as LabelProps)} // most props need to be passed
			className={cn("font-normal", className)}
			style={style}
			onClick={(e) => {
				// We capture the event and store it instead of letting it execute.
				// Executing it here would cause the hidden file input to blur,
				// preventing its `onChange` from ever firing after file selection.
				pendingClickEventRef.current = e as unknown as React.MouseEvent<
					HTMLInputElement,
					MouseEvent
				>;
			}}>
			{children}
			<Input
				multiple
				accept={ACCEPTED_MIME_TYPES.join(", ")}
				className="sr-only"
				{...props}
				type="file"
				onChange={(e) => {
					props.onChange?.(e);

					// Now that the file selection and form update are complete,
					// we manually execute the deferred menu-closing onClick
					// provided by the DropdownMenuItem.
					if (pendingClickEventRef.current) {
						onClick?.(pendingClickEventRef.current);
						pendingClickEventRef.current = null;
					}

					// This prevents adding the files twice, because the onChange event gets refired after pendingClickEvent is executed
					e.target.value = "";
				}}
			/>
		</Label>
	);
};

/**`props.children` should be components you use under {@link DropdownMenuContent} */
const MessageAttachmentsPickerMenu: React.FC<ButtonProps> = ({
	className,
	children,
	...props
}) => {
	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button
					variant={"ghost"}
					size={"icon"}
					type="button"
					aria-label="open attachments menu"
					{...props}
					className={cn("", className)}>
					<Paperclip />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start">{children}</DropdownMenuContent>
		</DropdownMenu>
	);
};

const MessageSendArea: React.FC<React.ComponentProps<"div">> = ({
	className,
	...props
}) => (
	<div
		{...props}
		className={cn(
			"flex max-w-[80%] flex-1 items-center justify-end gap-2",
			className,
		)}
	/>
);

const MessageValidationError: React.FC<React.ComponentProps<"p">> = ({
	className,
	...props
}) => (
	<p
		role="alert"
		{...props}
		className={cn(
			"max-w-[80%] truncate text-xs font-medium text-red-600",
			className,
		)}
	/>
);

const MessageSendButton: React.FC<SafeOmit<ButtonProps, "children">> = ({
	className,
	...props
}) => (
	<Button
		variant={"ghost"}
		size={"icon"}
		type="submit"
		aria-label="send new message"
		{...props}
		className={cn(
			"rounded-full bg-lime-400 hover:bg-lime-500 active:scale-95",
			className,
		)}>
		<ArrowUp className="text-white" />
	</Button>
);

export {
	MessageAttachmentControl,
	MessageAttachmentsPicker,
	MessageAttachmentsPickerMenu,
	MessageAttachmentsPreview,
	MessageComposer,
	MessageDocumentAttachmentPreview,
	MessageImageAttachmentPreview,
	MessageInputArea,
	MessageInputFooter,
	MessageQuickReplies,
	MessageQuickReply,
	MessageSendArea,
	MessageSendButton,
	MessageTextBox,
	MessageValidationError,
};
