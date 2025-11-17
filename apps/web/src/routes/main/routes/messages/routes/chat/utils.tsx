/**
 * @format
 */

import { apiAxiosInstance } from "@/lib/axios-instance";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";
import axios from "axios";
import dayjs from "dayjs";
import React from "react";
import { MessageItemContextType } from "../../components/chat/message-feed";
import { CLIENT_ONLY_MESSAGE_FLAG } from "./constants";
import {
	AttachmentCategory,
	ChatMessage,
	ClientChatMessage,
	MessageAttachment,
	RenderableChatMessage,
} from "./types";

/**
 * Converts a MIME type string into a common, display-friendly attachment type label.
 */
function getMIMETypeLabel(mimeType: string) {
	if (!mimeType) return "Unknown File";

	const normalizedMime = mimeType.toLowerCase().trim();

	// Handle specific application types first
	if (normalizedMime.includes("pdf")) {
		return "PDF";
	}
	if (normalizedMime.includes("word") || normalizedMime.includes("msword")) {
		return "Word Document";
	}
	if (
		normalizedMime.includes("excel") ||
		normalizedMime.includes("spreadsheetml")
	) {
		return "Spreadsheet";
	}
	if (normalizedMime.includes("zip") || normalizedMime.includes("rar")) {
		return "Archive";
	}
	if (normalizedMime.includes("powerpoint")) {
		return "Presentation";
	}

	// Handle general categories using the main media type
	const [mediaType] = normalizedMime.split("/");

	switch (mediaType) {
		case "image":
			return "Image";
		case "video":
			return "Video";
		case "audio":
			return "Audio";
		case "text":
			return "Text File";
		case "application":
			// Fallback for general application types not specifically caught above
			return "Document";
		default:
			return "Unknown File";
	}
}

/**
 * Maps a MIME type string to a very generic attachment category.
 */
function getMIMECategory(mimeType: string): AttachmentCategory {
	if (!mimeType) return "DOCUMENT";

	// 1. Normalize and get the main media type
	const [mediaType] = mimeType.toLowerCase().trim().split("/");

	// 2. Map to the broad media types
	switch (mediaType) {
		case "image":
			return "IMAGE";
		case "audio":
			return "AUDIO";
		case "video":
			return "VIDEO";
		case "text":
			return "DOCUMENT";
		case "application":
			// This covers PDF, Word, Excel, ZIP, etc.
			return "DOCUMENT";
		default:
			// Fallback for anything unlisted
			return "DOCUMENT";
	}
}

const isClientOnlyMessage = (
	message: ChatMessage,
): message is ClientChatMessage =>
	message.id.endsWith(CLIENT_ONLY_MESSAGE_FLAG);

const getItemReversedIndex = (arrayLength: number, actualIndex: number) =>
	arrayLength - 1 - actualIndex;

const renderMessagesReversed = (
	messages: RenderableChatMessage[],
	renderItem: (
		context: MessageItemContextType & {
			actualIndex: number;
			reversedIndex: number;
		},
	) => React.ReactNode,
) =>
	messages.map((_, actualIndex) => {
		// Reverse map to render conversation bottom-up (newest messages at the bottom); avoids toReversed() array copy.
		const reversedIndex = getItemReversedIndex(
			messages.length,
			actualIndex,
		);

		const message = messages[reversedIndex];
		if (message) {
			const isFromMe = message.from === "ME";

			const isNextMessageFromMe =
				messages[reversedIndex - 1]?.from === "ME";

			// The message at array index 0 is always the visually last message at the bottom of the thread.
			const isVisuallyLastMessage = actualIndex === 0;

			const isLeavingMyBlock = isFromMe && !isNextMessageFromMe;

			const isLeavingTheirBlock =
				!isFromMe && (isNextMessageFromMe || isVisuallyLastMessage);

			const isLastInBlock = isLeavingMyBlock || isLeavingTheirBlock;
			return (
				<React.Fragment key={message.renderKey}>
					{renderItem({
						message,
						isLastInBlock,
						actualIndex,
						reversedIndex,
					})}
				</React.Fragment>
			);
		}
	});

const generateClientMessageId = (): ClientChatMessage["id"] =>
	`${crypto.randomUUID()}${CLIENT_ONLY_MESSAGE_FLAG}`;

const getMessageDateGroup = (createdAt: string): string => {
	const messageDate = dayjs(createdAt);
	const now = dayjs();
	const today = now.startOf("day");
	const yesterday = today.subtract(1, "day");
	const lastWeekThreshold = today.subtract(7, "day");
	const lastMonthThreshold = today.subtract(30, "day");

	if (messageDate.isSame(today, "day")) {
		return "Today";
	}

	if (messageDate.isSame(yesterday, "day")) {
		return "Yesterday";
	}

	// Last Week (2 to 7 days ago)
	if (messageDate.isAfter(lastWeekThreshold, "day")) {
		return "Last Week";
	}

	// Older (within the past month) (8 to 30 days ago)
	if (messageDate.isAfter(lastMonthThreshold, "day")) {
		return "Older (within the past month)";
	}

	// Older (Organized by Active Months)
	return messageDate.format("MMMM YYYY");
};

interface PresignedUrlInfo {
	fileName: string;
	uploadUrl: string;
	fileKey: string;
	publicUrl: string;
}

interface PresignedUrlsResponseData {
	files: PresignedUrlInfo[];
	expirySeconds: number;
}

const processAttachmentsToSend = async (
	files: File[],
): Promise<MessageAttachment[]> => {
	if (files.length === 0) {
		return [];
	}
	const getAttachmentUploadUrls = async (
		fileNames: string[],
	): Promise<PresignedUrlInfo[]> => {
		const response = await apiAxiosInstance.post<
			ApiSuccessResponse<{ data: PresignedUrlsResponseData }>
		>(
			"/chats/attachments/upload-url",
			{
				fileNames,
			},
			{
				skipUserTypePrefix: true,
			},
		);

		return response.data.data.files;
	};

	const uploadAttachmentsToStorage = async (
		filesToUpload: { file: File; uploadUrl: string }[],
	) => {
		const uploadPromises = filesToUpload.map(({ file, uploadUrl }) => {
			return axios.put(uploadUrl, file);
		});

		await Promise.all(uploadPromises);
	};

	const presignedUrlsInfo = await getAttachmentUploadUrls(
		files.map((file) => file.name),
	);

	await uploadAttachmentsToStorage(
		files.map((file) => {
			const presignedInfo = presignedUrlsInfo.find(
				(info) => info.fileName === file.name,
			);
			if (!presignedInfo) {
				throw new Error(
					`No presigned URL info found for file: ${file.name}`,
				);
			}
			return {
				file,
				uploadUrl: presignedInfo.uploadUrl,
			};
		}),
	);

	const processedAttachments: MessageAttachment[] = files.map((file) => {
		const presignedInfo = presignedUrlsInfo.find(
			(info) => info.fileName === file.name,
		);
		if (!presignedInfo) {
			throw new Error(
				`No presigned URL info found for file: ${file.name}`,
			);
		}
		return {
			name: file.name,
			url: presignedInfo.publicUrl,
			mimeType: file.type,
			category: getMIMECategory(file.type),
			size: file.size,
		};
	});

	return processedAttachments;
};

export {
	generateClientMessageId,
	getItemReversedIndex,
	getMessageDateGroup,
	getMIMECategory,
	getMIMETypeLabel,
	isClientOnlyMessage,
	processAttachmentsToSend,
	renderMessagesReversed,
};
