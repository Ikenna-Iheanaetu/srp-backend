/** @format */

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
	MessageAttachmentsPicker,
	MessageAttachmentsPickerMenu,
} from "@/routes/main/routes/messages/components/chat/message-composer";
import React from "react";
import { useFormContext } from "react-hook-form";
import {
	COMPOSER_SET_VALUE_CONFIG,
	MAX_FILE_ATTACHMENTS,
	MessageForm,
} from "../form-schema";
import { FolderOpen } from "lucide-react";

export const AttachmentsPicker: React.FC<{ className?: string }> = ({
	className,
}) => {
	const { register, watch, getValues, setValue } =
		useFormContext<MessageForm>();
	React.useEffect(() => {
		register("attachments");
	}, [register]);

	const selectedAttachments = watch("attachments") ?? [];
	const canSelect = selectedAttachments.length < MAX_FILE_ATTACHMENTS;

	return (
		<MessageAttachmentsPickerMenu
			disabled={!canSelect}
			className={className}>
			<DropdownMenuItem>Contact card</DropdownMenuItem>
			<DropdownMenuItem asChild>
				<MessageAttachmentsPicker
					onChange={(e) => {
						const newFiles = e.target.files ?? [];
						const existingFiles = getValues("attachments") ?? [];
						if (newFiles.length > 0) {
							setValue(
								"attachments",
								[...existingFiles, ...newFiles],
								COMPOSER_SET_VALUE_CONFIG,
							);
						}
					}}>
					Files / Images <FolderOpen className="ml-auto" />
				</MessageAttachmentsPicker>
			</DropdownMenuItem>
		</MessageAttachmentsPickerMenu>
	);
};
