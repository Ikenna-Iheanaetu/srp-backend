/** @format */
import { SetValueConfig } from "react-hook-form";
import { z } from "zod/v4";

const MAX_FILE_ATTACHMENTS = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_MIME_TYPES = [
	// Images
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
	// Documents
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"text/plain",
];
const MAX_MESSAGE_LENGTH = 1000;

const ContentSchema = z
	.string()
	.trim()
	.min(1, "Message is required")
	.max(
		MAX_MESSAGE_LENGTH,
		`Message shouldn't exceed ${MAX_MESSAGE_LENGTH} characters`,
	);

const AttachmentsSchema = z
	.array(
		z
			.file({
				error: "Should be image or document",
			})
			.max(MAX_FILE_SIZE_BYTES, `Size: limit: ${MAX_FILE_SIZE_MB}`)
			.mime(ACCEPTED_MIME_TYPES, `Only images/documents are allowed`),
		{
			error: "Should be an array of files",
		},
	)
	.max(MAX_FILE_ATTACHMENTS, `Max: ${MAX_FILE_ATTACHMENTS} attachments`);

const MessageFormSchema = z.union([
	// when only content is present is allowed
	z.object({
		content: ContentSchema,
		attachments: AttachmentsSchema.optional(),
	}),
	// when only attachments is present is allowed
	z.object({
		content: ContentSchema.or(
			// allow an empty string in this case
			z.literal(""),
		).optional(),
		attachments: AttachmentsSchema,
	}),
	// when both are present is allowed
	z.object({
		content: ContentSchema,
		attachments: AttachmentsSchema,
	}),
	// Note that when both are absent is not allowed
]);

type MessageForm = z.infer<typeof MessageFormSchema>;

type ComposerSetValueConfig = AssertSubtype<
	SetValueConfig,
	{
		shouldDirty: true;
		shouldValidate: true;
	}
>;

/**These options forces form.setValue to trigger a rerender after value change. Especially for places where `isDirty` and `isValid` are used.*/
const COMPOSER_SET_VALUE_CONFIG: ComposerSetValueConfig = {
	shouldDirty: true,
	shouldValidate: true,
};

export {
	ACCEPTED_MIME_TYPES,
	COMPOSER_SET_VALUE_CONFIG,
	MAX_FILE_ATTACHMENTS,
	MAX_FILE_SIZE_BYTES,
	MAX_MESSAGE_LENGTH,
	MessageFormSchema,
};
export type { ComposerSetValueConfig, MessageForm };
