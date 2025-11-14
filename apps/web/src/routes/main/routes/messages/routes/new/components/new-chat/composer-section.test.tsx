/** @format */

// prettier-ignore
/* eslint-disable testing-library/prefer-screen-queries */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { createRoutesStub, href } from "react-router";
import { render, RenderResult } from "vitest-browser-react";
import { Locator, userEvent } from "vitest/browser";
import {
	MAX_FILE_ATTACHMENTS,
	MAX_FILE_SIZE_BYTES,
	MAX_MESSAGE_LENGTH,
} from "../../../chat/chatbox/components/message-composer-section/form-schema";
import { ChatRecipient, ClientMessageStatus } from "../../../chat/types";
import { serializeNewChatSearchParams } from "../../search-params";
import { ComposerSection } from "./composer-section";
import { getDb } from "../../db";
import { QUICK_REPLIES } from "./constants";

const MOCK_RECIPIENT: ChatRecipient = {
	id: "p123",
	profileId: "fff",
	name: "John Doe",
	userType: "player",
	avatar: "https://picsum.photos/seed/johndoe/50/50",
	club: {
		id: "c456",
		name: "FC Test",
		avatar: "https://picsum.photos/seed/fctest/50/50",
	},
	location: "London, UK",
};

const renderComposer = (recipient = MOCK_RECIPIENT) => {
	const Stub = createRoutesStub([
		{
			path: href("/messages/new"),
			Component: () => <ComposerSection recipient={recipient} />,
		},
	]);
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	const NuqsProvider = withNuqsTestingAdapter({
		searchParams: serializeNewChatSearchParams({
			recipientId: recipient.id,
		}),
	});
	const Wrapper = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			<NuqsProvider>{children}</NuqsProvider>
		</QueryClientProvider>
	);
	return render(<Stub initialEntries={[href("/messages/new")]} />, {
		wrapper: Wrapper,
	});
};

const createMockFile = (name: string, size: number, mimeType: string) =>
	new File(["a".repeat(size)], name, { type: mimeType });

const getComposerForm = (getByRole: RenderResult["getByRole"]) =>
	getByRole("form", { name: /new message composer/i });

const getComposerTextbox = (form: Locator) =>
	form.getByRole("textbox", { name: /message text content/i });

const getSendButton = (form: Locator) =>
	form.getByRole("button", { name: /send new message/i });

const getAttachmentMenuTrigger = (form: Locator) =>
	form.getByRole("button", { name: /open attachments menu/i });

const getAttachmentMenu = (getByRole: RenderResult["getByRole"]) =>
	getByRole("menu");

const getFileInputLabel = (attachmentMenu: Locator) =>
	attachmentMenu.getByRole("menuitem", { name: /files/i });

const getFileInput = (fileInputLabel: Locator) =>
	fileInputLabel.getByLabelText(/files/i);

const getAttachmentControl = (name: string, form: Locator) => {
	return form.getByRole("listitem", {
		name: new RegExp(`control for attachment: ${name}`, "i"),
	});
};

const getAttachmentRemoveButton = (
	attachmentName: string,
	attachmentControl: Locator,
) => {
	return attachmentControl.getByRole("button", {
		name: new RegExp(`remove attachment: ${attachmentName}`, "i"),
	});
};

beforeEach(async () => {
	// This ensures Test A's pollution of the db is immediately dealt with before control passes to any subsequent test
	const db = getDb("mmmm" /* Initializes the db */);
	db.close();
	await db.delete();
	await db.open();
});

describe("Form interaction and validation", () => {
	it("disables the Send button when the form is initially empty", async () => {
		const { getByRole } = await renderComposer();
		const form = getComposerForm(getByRole);
		const sendButton = getSendButton(form);

		// must be initially disabled
		expect(sendButton).toBeDisabled();
	});

	it("displays validation message on error and hides it on fix", async () => {
		const { getByRole } = await renderComposer();
		const form = getComposerForm(getByRole);
		const textbox = getComposerTextbox(form);
		const user = userEvent.setup();

		// Enter content that exceeds max length and confirm error message is shown
		const longMessage = "a".repeat(MAX_MESSAGE_LENGTH + 1);
		await user.fill(textbox, longMessage);
		const errorMessageRegex = new RegExp(
			`Message shouldn't exceed ${MAX_MESSAGE_LENGTH} characters`,
			"i",
		);
		const errorMessageAlert = form
			.getByRole("alert")
			.getByText(errorMessageRegex);
		expect(errorMessageAlert).toBeInTheDocument();

		// fix error by entering a valid text content
		const validMessage = "a";
		await user.clear(textbox);
		await user.fill(textbox, validMessage);

		// error message alert should be gone
		expect(errorMessageAlert).not.toBeInTheDocument();
	});

	describe("text content only (no attachments)", () => {
		it("enables the Send button for valid content", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);

			// send button must initially be disabled
			expect(sendButton).toBeDisabled();

			const textbox = getComposerTextbox(form);
			const user = userEvent.setup();

			const validMessage = "message";
			await user.fill(textbox, validMessage);

			// send button must now be enabled
			expect(sendButton).toBeEnabled();
		});

		it("disables the Send button for content that fails min/max length", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);
			const textbox = getComposerTextbox(form);

			// make send button enabled
			const user = userEvent.setup();
			await user.fill(textbox, "message");
			expect(sendButton).toBeEnabled();

			// should disable send button on less than min length
			await user.fill(textbox, "");
			expect(sendButton).toBeDisabled();

			await user.clear(textbox);

			// should disable send button on whitespace only content
			await user.fill(textbox, "    ");
			expect(sendButton).toBeDisabled();

			await user.clear(textbox);

			// should disable send button on max length exceeded
			const longMessage = "a".repeat(MAX_MESSAGE_LENGTH + 1);
			await user.fill(textbox, longMessage);
			expect(sendButton).toBeDisabled();
		});
	});

	describe("attachments only (empty text content)", () => {
		// NOTE: Tests selecting attachment menu requires modal={false} on the  DropdownMenu component to pass.
		// See https://github.com/vitest-dev/vitest/issues/8810

		it("enables the Send button for valid attachments only (empty text content)", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);

			// Send button must initially be disabled (empty form)
			expect(sendButton).toBeDisabled();

			// should enable send button on valid attachment added
			const menuTrigger = getAttachmentMenuTrigger(form);
			const user = userEvent.setup();
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			const fileInputLabel = attachmentMenu.getByRole("menuitem", {
				name: /files/i,
			});
			const fileInput = getFileInput(fileInputLabel);
			await user.click(fileInputLabel);
			const validFile = createMockFile(
				"document.pdf",
				100,
				"application/pdf",
			);
			await user.upload(fileInput, validFile);

			expect(sendButton).toBeEnabled();
		});

		it("disables the Send button for invalid attachment type", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);
			const menuTrigger = getAttachmentMenuTrigger(form);
			const user = userEvent.setup();

			// send button must be initially enabled, use a valid attachment to enable
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			// find the file input label and click it to simulate actual user follow
			const fileInputLabel = getFileInputLabel(attachmentMenu);
			await user.click(fileInputLabel);
			const fileInput = getFileInput(fileInputLabel);
			const validFile = createMockFile(
				"document.pdf",
				100,
				"application/pdf",
			);
			await user.upload(fileInput, validFile);
			// menu should now be closed
			expect(attachmentMenu).not.toBeInTheDocument();
			expect(sendButton).toBeEnabled();

			// send button must be disabled when invalid attachment is added
			await user.click(menuTrigger);
			const ReOpenedAttachmentMenu = getByRole("menu");
			const newFileInputLabel = ReOpenedAttachmentMenu.getByRole(
				"menuitem",
				{
					name: /files/i,
				},
			);
			await user.click(newFileInputLabel);
			const newFileInput = newFileInputLabel.getByLabelText(/files/i);
			const invalidFile = createMockFile("page.html", 100, "text/html");
			await user.upload(newFileInput, invalidFile);
			// menu should now be closed
			expect(ReOpenedAttachmentMenu).not.toBeInTheDocument();
			expect(sendButton).toBeDisabled();
		});

		it("disables the Send button for invalid attachment size", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);
			const menuTrigger = getAttachmentMenuTrigger(form);
			const user = userEvent.setup();

			// send button must be initially enabled, use a valid attachment to enable
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			// find the file input label and click it to simulate actual user follow
			const fileInputLabel = getFileInputLabel(attachmentMenu);
			await user.click(fileInputLabel);
			const fileInput = getFileInput(fileInputLabel);
			const validFile = createMockFile(
				"document.pdf",
				100,
				"application/pdf",
			);
			await user.upload(fileInput, validFile);
			// menu should now be closed
			expect(attachmentMenu).not.toBeInTheDocument();
			expect(sendButton).toBeEnabled();

			// send button must be disabled when attachment that exceeds max size is added
			await user.click(menuTrigger);
			const ReOpenedAttachmentMenu = getByRole("menu");
			const newFileInputLabel = ReOpenedAttachmentMenu.getByRole(
				"menuitem",
				{
					name: /files/i,
				},
			);
			await user.click(newFileInputLabel);
			const newFileInput = newFileInputLabel.getByLabelText(/files/i);
			const invalidFile = createMockFile(
				"document.pdf",
				MAX_FILE_SIZE_BYTES + 1,
				"application/pdf",
			);
			await user.upload(newFileInput, invalidFile);
			// menu should now be closed and send button disabled
			expect(ReOpenedAttachmentMenu).not.toBeInTheDocument();
			expect(sendButton).toBeDisabled();
		});

		it("disables the attachments menu trigger when max attachment count is reached/exceeded", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const menuTrigger = getAttachmentMenuTrigger(form);

			// menuTrigger must be disabled when max is reached
			const user = userEvent.setup();
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			const fileInputLabel = getFileInputLabel(attachmentMenu);
			const fileInput = getFileInput(fileInputLabel);
			await user.click(fileInputLabel);
			const validFilesAtMaxCount = Array.from(
				{ length: MAX_FILE_ATTACHMENTS },
				(_, i) => createMockFile(`file${i + 1}.txt`, 10, "text/plain"),
			);
			await user.upload(fileInput, validFilesAtMaxCount);
			// Menu should close, button menu trigger should now be disabled
			expect(attachmentMenu).not.toBeInTheDocument();
			expect(menuTrigger).toBeDisabled();
		});

		it("disables the Send button for exceeding max attachment count", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);
			const menuTrigger = getAttachmentMenuTrigger(form);

			// first enable send button using a valid number of attachments
			const user = userEvent.setup();
			await user.click(menuTrigger);
			let attachmentMenu = getByRole("menu");
			let fileInputLabel = getFileInputLabel(attachmentMenu);
			let fileInput = fileInputLabel.getByLabelText(/files/i);
			await user.click(fileInputLabel);
			const validFilesBelowMaxCount = Array.from(
				{ length: MAX_FILE_ATTACHMENTS - 1 },
				(_, i) => createMockFile(`file${i + 1}.txt`, 10, "text/plain"),
			);
			await user.upload(fileInput, validFilesBelowMaxCount);
			// Menu should close, button should be enabled
			expect(attachmentMenu).not.toBeInTheDocument();
			expect(sendButton).toBeEnabled();

			// send button must be disabled when max is exceeded
			await user.click(menuTrigger);
			attachmentMenu = getByRole("menu");
			fileInputLabel = getFileInputLabel(attachmentMenu);
			const numToExceedMax =
				MAX_FILE_ATTACHMENTS -
				validFilesBelowMaxCount.length +
				/* any bigger number allowed */ 1;
			const extraFilesToExceedMax = Array.from(
				{ length: numToExceedMax },
				(_, i) => createMockFile(`file${i + 1}.txt`, 10, "text/plain"),
			);
			await user.click(fileInputLabel);
			fileInput = fileInputLabel.getByLabelText(/files/i);
			await user.upload(
				fileInputLabel.getByLabelText(/files/i),
				extraFilesToExceedMax,
			);
			// menu should now be closed and send button disabled
			expect(attachmentMenu).not.toBeInTheDocument();
			expect(sendButton).toBeDisabled();
		});

		it("displays all uploaded attachments up to max limit", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const menuTrigger = getAttachmentMenuTrigger(form);
			const user = userEvent.setup();

			// Prepare multiple valid files
			const validFilesUptoMax = Array.from(
				{ length: MAX_FILE_ATTACHMENTS },
				(_, i) => createMockFile(`file${i + 1}.txt`, 10, "text/plain"),
			);

			// Upload all files
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			const fileInputLabel = getFileInputLabel(attachmentMenu);
			await user.click(fileInputLabel);
			const fileInput = getFileInput(fileInputLabel);
			await user.upload(fileInput, validFilesUptoMax);
			expect(attachmentMenu).not.toBeInTheDocument();

			// All attachment controls must be displayed
			for (const file of validFilesUptoMax) {
				const attachmentControl = getAttachmentControl(file.name, form);
				expect(attachmentControl).toBeInTheDocument();
			}
		});

		it("should be able to remove a valid attachment", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const menuTrigger = getAttachmentMenuTrigger(form);
			const user = userEvent.setup();

			// Upload a valid file and confirm it's shown
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			const fileInputLabel = getFileInputLabel(attachmentMenu);
			const fileInput = getFileInput(fileInputLabel);
			await user.click(fileInputLabel);
			const validFileName = "document.pdf";
			const validFile = createMockFile(
				validFileName,
				100,
				"application/pdf",
			);
			await user.upload(fileInput, validFile);
			expect(attachmentMenu).not.toBeInTheDocument();
			const attachmentControl = getAttachmentControl(
				validFile.name,
				form,
			);
			expect(attachmentControl).toBeInTheDocument();

			// clicking the control's remove button should remove the control entirely, including the button.
			const removeButton = getAttachmentRemoveButton(
				validFile.name,
				attachmentControl,
			);
			await user.click(removeButton);
			// control and it's remove button should be gone
			expect(attachmentControl).not.toBeInTheDocument();
			expect(removeButton).not.toBeInTheDocument();
		});

		it("shows error indicator on an invalid attachment and should be able to remove the attachment", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const menuTrigger = getAttachmentMenuTrigger(form);
			const user = userEvent.setup();

			// Upload an invalid file
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			const fileInputLabel = getFileInputLabel(attachmentMenu);
			const fileInput = getFileInput(fileInputLabel);
			await user.click(fileInputLabel);
			const invalidFile = createMockFile(
				"document.pdf",
				MAX_FILE_SIZE_BYTES + 1,
				"application/pdf",
			);
			await user.upload(fileInput, invalidFile);
			expect(attachmentMenu).not.toBeInTheDocument();

			// attachment control should be shown and indicates an error
			const attachmentControl = getAttachmentControl(
				invalidFile.name,
				form,
			);
			expect(attachmentControl).toBeInTheDocument();
			expect(attachmentControl).toBeInvalid();

			// clicking the invalid attachment's control's remove button should remove the control entirely, including the button.
			const removeButton = getAttachmentRemoveButton(
				invalidFile.name,
				attachmentControl,
			);
			await user.click(removeButton);
			// control and it's remove button should be gone
			expect(attachmentControl).not.toBeInTheDocument();
			expect(removeButton).not.toBeInTheDocument();
		});
	});

	describe("mixed content (text content + attachments)", () => {
		it("disables the Send button for valid content + invalid attachment", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);
			const menuTrigger = getAttachmentMenuTrigger(form);
			const textbox = getComposerTextbox(form);
			const user = userEvent.setup();

			// send button must initially be disabled (empty form)
			expect(sendButton).toBeDisabled();

			// Add valid text content to enable send button
			const validText = "Valid message content.";
			await user.fill(textbox, validText);
			expect(sendButton).toBeEnabled();

			// Add an invalid attachment
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			const fileInputLabel = getFileInputLabel(attachmentMenu);
			const fileInput = getFileInput(fileInputLabel);
			await user.click(fileInputLabel);
			const invalidFile = createMockFile(
				"document.pdf",
				MAX_FILE_SIZE_BYTES + 1,
				"application/pdf",
			);
			await user.upload(fileInput, invalidFile);
			expect(attachmentMenu).not.toBeInTheDocument();

			// send button must now be disabled
			expect(sendButton).toBeDisabled();
		});

		it("disables the Send button for valid attachment + invalid text", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);
			const menuTrigger = getAttachmentMenuTrigger(form);
			const textbox = getComposerTextbox(form);
			const user = userEvent.setup();

			// send button must initially be disabled (empty form)
			expect(sendButton).toBeDisabled();

			// Add a valid attachment to enable send button
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			const fileInputLabel = getFileInputLabel(attachmentMenu);
			const fileInput = getFileInput(fileInputLabel);
			await user.click(fileInputLabel);
			const validFile = createMockFile(
				"document.pdf",
				5,
				"application/pdf",
			);
			await user.upload(fileInput, validFile);
			expect(attachmentMenu).not.toBeInTheDocument();
			expect(sendButton).toBeEnabled();

			// Add invalid text content
			const invalidText = "      ";
			await user.fill(textbox, invalidText);

			// send button must now be disabled
			expect(sendButton).toBeDisabled();
		});

		it("Enables the Send button for valid attachment + valid text", async () => {
			const { getByRole } = await renderComposer();
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);
			const menuTrigger = getAttachmentMenuTrigger(form);
			const textbox = getComposerTextbox(form);
			const user = userEvent.setup();

			// send button must initially be disabled (empty form)
			expect(sendButton).toBeDisabled();

			// Add a valid attachment
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			const fileInputLabel = getFileInputLabel(attachmentMenu);
			const fileInput = getFileInput(fileInputLabel);
			await user.click(fileInputLabel);
			const validFile = createMockFile(
				"document.pdf",
				5,
				"application/pdf",
			);
			await user.upload(fileInput, validFile);
			expect(attachmentMenu).not.toBeInTheDocument();
			expect(sendButton).toBeEnabled();

			// Add a valid text content
			const validText = "message";
			await user.fill(textbox, validText);

			// send button must now be enabled
			expect(sendButton).toBeEnabled();
		});
	});

	describe("Quick Replies", () => {
		const getReplyBtn = (form: Locator, reply: string) =>
			form.getByRole("button", {
				name: new RegExp(reply, "i"),
			});

		it("should render all quick replies when no unsent message exists", async () => {
			const { getByRole } = await renderComposer(MOCK_RECIPIENT);
			const form = getComposerForm(getByRole);

			// first ensure no unsent messages are in db for this recipient
			const db = getDb();
			await db.deleteRecipientMessages(MOCK_RECIPIENT.id);

			// each quick reply must be rendered
			for (const reply of QUICK_REPLIES) {
				const replyButton = getReplyBtn(form, reply);
				expect(replyButton).toBeInTheDocument();
			}
		});

		it("should populate the textbox and enable the send button when any quick reply is clicked", async () => {
			const { getByRole } = await renderComposer(MOCK_RECIPIENT);
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);
			const textbox = getComposerTextbox(form);
			const user = userEvent.setup();

			// first ensure no unsent messages are in db for this recipient
			const db = getDb();
			await db.deleteRecipientMessages(MOCK_RECIPIENT.id);

			// each quick reply must be able to populate textbox and enable send button
			for (const reply of QUICK_REPLIES) {
				// initially, textbox must be empty and send button disabled
				await user.clear(textbox);
				expect(sendButton).toBeDisabled();

				const replyButton = getReplyBtn(form, reply);
				await user.click(replyButton);

				// textbox must now be populated and send button enabled
				expect(textbox).toHaveValue(reply);
				expect(sendButton).toBeEnabled();
			}
		});

		it("should not render quick replies when an unsent message exists in the database", async () => {
			const { getByRole } = await renderComposer(MOCK_RECIPIENT);
			const form = getComposerForm(getByRole);

			// first ensure an unsent message is in db
			const db = getDb();
			await db.addMessage(
				{
					content: "Failed message",
					status: "FAILED",
				},
				MOCK_RECIPIENT.id,
			);

			// Verify the quick reply buttons are NOT in the document
			for (const reply of QUICK_REPLIES) {
				const replyButton = getReplyBtn(form, reply);
				expect(replyButton).not.toBeInTheDocument();
			}
		});
	});
});

describe("Form submisson", () => {
	it("should clear form state and add a message with SENDING status to DB upon submission", async () => {
		const { getByRole } = await renderComposer(MOCK_RECIPIENT);
		const form = getComposerForm(getByRole);
		const sendButton = getSendButton(form);
		const textbox = getComposerTextbox(form);
		const menuTrigger = getAttachmentMenuTrigger(form);
		const user = userEvent.setup();

		// send button must be initially disabled
		expect(sendButton).toBeDisabled();

		// first fill form with text content and an attachment
		const textContent = "Hello! Let's chat.";
		await user.fill(textbox, textContent);
		expect(textbox).toHaveValue(textContent); // text content added

		await user.click(menuTrigger);
		const attachmentMenu = getAttachmentMenu(getByRole);
		const fileInputLabel = getFileInputLabel(attachmentMenu);
		await user.click(fileInputLabel);
		const fileInput = getFileInput(fileInputLabel);
		const file = createMockFile("document.pdf", 22, "application/pdf");
		await user.upload(fileInput, file);
		expect(attachmentMenu).not.toBeInTheDocument();
		const attachmentControl = getAttachmentControl(file.name, form);
		expect(attachmentControl).toBeInTheDocument(); // attachment added

		// send button must now be enabled
		expect(sendButton).toBeEnabled();

		// submit the form
		await user.click(sendButton);

		// form state must now be cleared
		expect(textbox).toHaveValue("");
		expect(attachmentControl).not.toBeInTheDocument();

		// new message with sending status should now be in the db
		const db = getDb();
		const recievedMsgs = await db.getRecipientMessages(MOCK_RECIPIENT.id);
		expect(recievedMsgs).toHaveLength(1);
		const storedMessage = recievedMsgs[0]!;
		const expectedStatuses = [
			"SENDING",
			"FAILED",
		] satisfies ClientMessageStatus[]; // we're not mocking the network requests for sending the message
		expect(expectedStatuses).toContain(storedMessage.status);

		// text content must match
		const storedTextContent = storedMessage.content;
		expect(storedTextContent).toBe(textContent);

		// the stored file must match added file
		const recievedFiles = storedMessage.attachments!;
		expect(recievedFiles).toHaveLength(1);
		const storedFile = recievedFiles[0]!;
		expect(storedFile.name).toBe(file.name);
		expect(storedFile.type).toBe(file.type);
		const [actualSize, dbOverhead] = [
			file.size,
			// I've noticed fetching back the file, 19 bytes is added to the actual size
			file.size + 19,
		];
		expect(storedFile.size).toBeGreaterThanOrEqual(actualSize);
		expect(storedFile.size).toBeLessThanOrEqual(dbOverhead);
	});

	it.each(["SENDING", "FAILED"] satisfies ClientMessageStatus[])(
		"should disable send button and prevent form submission when an unsent message with %s status exists in database",
		async (status) => {
			// Add pending message BEFORE rendering
			const db = getDb();
			const pendingMsgText = "Pending message";
			await db.addMessage(
				{
					content: pendingMsgText,
					status,
				},
				MOCK_RECIPIENT.id,
			);

			// Render composer
			const { getByRole } = await renderComposer(MOCK_RECIPIENT);
			const form = getComposerForm(getByRole);
			const sendButton = getSendButton(form);
			const textbox = getComposerTextbox(form);
			const user = userEvent.setup();

			// Send button disabled on render
			expect(sendButton).toBeDisabled();

			// User tries to compose new message with text and attachment
			const userMessage = "Trying to send another message";
			await user.fill(textbox, userMessage);

			// Add attachment following actual user flow
			const menuTrigger = getAttachmentMenuTrigger(form);
			await user.click(menuTrigger);
			const attachmentMenu = getAttachmentMenu(getByRole);
			const fileInputLabel = getFileInputLabel(attachmentMenu);
			await user.click(fileInputLabel);
			const fileInput = getFileInput(fileInputLabel);
			const file = createMockFile("test.png", 1000, "image/png");
			await user.upload(fileInput, file);

			// Menu should close after file selection
			expect(attachmentMenu).not.toBeInTheDocument();

			const attachmentControl = getAttachmentControl(file.name, form);
			expect(attachmentControl).toBeInTheDocument();

			// Button still disabled despite valid content
			expect(sendButton).toBeDisabled();

			// Try to submit form (bypassing disabled button)
			form.element().dispatchEvent(
				new Event("submit", { bubbles: true, cancelable: true }),
			);

			// USER PERSPECTIVE: Form content remains unchanged
			expect(textbox).toHaveValue(userMessage);
			expect(attachmentControl).toBeInTheDocument();

			// VERIFY: No new message was added to DB
			// (Since rendering messages is outside composer-section's scope,
			// this is the only way to verify the message wasn't sent)
			const messages = await db.getRecipientMessages(MOCK_RECIPIENT.id);
			expect(messages).toHaveLength(1); // Still only the pending message
			expect(messages[0]?.status).toBe(status);
			expect(messages[0]?.content).toBe(pendingMsgText);
		},
	);
});
