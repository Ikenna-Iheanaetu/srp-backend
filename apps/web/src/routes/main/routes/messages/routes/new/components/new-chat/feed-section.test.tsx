/** @format */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { createRoutesStub, href } from "react-router";
import { render, RenderResult } from "vitest-browser-react";
import { ChatRecipient, ClientMessageStatus } from "../../../chat/types";
import { getDb } from "../../db";
import { FeedSection } from "./feed-section";

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

const renderFeedSection = (recipient: ChatRecipient) => {
	const Stub = createRoutesStub([
		{
			path: href("/messages/new"),
			Component: () => <FeedSection recipient={recipient} />,
		},
	]);

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	const NuqsProvider = withNuqsTestingAdapter({});

	const Wrapper = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			<NuqsProvider>{children}</NuqsProvider>
		</QueryClientProvider>
	);

	return render(<Stub initialEntries={[href("/messages/new")]} />, {
		wrapper: Wrapper,
	});
};

const getMsgItem = (getByRole: RenderResult["getByRole"]) =>
	getByRole("listitem", { name: /message sent by you/i });

beforeEach(async () => {
	const db = getDb("mmmm");
	db.close();
	await db.delete();
	await db.open();
});

it("should render nothing when no unsent message exists", async () => {
	// ensure no message is in db
	const db = getDb();
	await db.deleteRecipientMessages(MOCK_RECIPIENT.id);

	const { getByRole } = await renderFeedSection(MOCK_RECIPIENT);

	const messageItem = getMsgItem(getByRole);
	await expect.element(messageItem).not.toBeInTheDocument();
});

it.each(["SENDING", "FAILED"] satisfies ClientMessageStatus[])(
	"should display unsent message with status: %s",
	async (status) => {
		const db = getDb();
		const messageContent = "Hello, this is my first message!";
		const docFile = new File(["content"], "document.pdf", {
			type: "application/pdf",
		});
		const imgFile = new File(["image"], "photo.jpg", {
			type: "image/jpeg",
		});

		const addedMessage = await db.addMessage(
			{
				content: messageContent,
				status,
				attachments: [docFile, imgFile],
			},
			MOCK_RECIPIENT.id,
		);

		const { getByRole } = await renderFeedSection(MOCK_RECIPIENT);

		// Verify message item exists
		const messageItem = getMsgItem(getByRole);
		await expect.element(messageItem).toBeInTheDocument();

		// Verify content
		expect(messageItem).toHaveTextContent(messageContent);

		// Verify delivery status
		const deliveryStatus = getByRole("status", {
			name: new RegExp(`delivery status: ${status}`, "i"),
		});
		expect(deliveryStatus).toBeInTheDocument();

		// Verify timestamp is displayed
		const formattedTime = dayjs(addedMessage.timestamp).format("hh:mm A");
		const timestamp = messageItem
			.getByRole("time")
			.getByText(formattedTime);
		expect(timestamp).toBeInTheDocument();

		// Verify document attachment (link accessible name includes filename)
		const docAttachment = getByRole("link", {
			name: new RegExp(docFile.name, "i"),
		});
		expect(docAttachment).toBeInTheDocument();

		// Verify image attachment
		const imgAttachment = getByRole("button", {
			name: new RegExp(`view full image: ${imgFile.name}`, "i"),
		});
		expect(imgAttachment).toBeInTheDocument();
	},
);

describe("Failed message controls", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	it("should remove failed message when user deletes it", async () => {
		const db = getDb();
		const messageContent = "This message will be deleted";

		await db.addMessage(
			{
				content: messageContent,
				status: "FAILED",
			},
			MOCK_RECIPIENT.id,
		);

		const { getByRole } = await renderFeedSection(MOCK_RECIPIENT);

		// Run pending timers to allow component to render
		await vi.runAllTimersAsync();

		// Verify message exists initially
		const messageItem = getMsgItem(getByRole);
		await expect.element(messageItem).toBeInTheDocument();
		expect(messageItem).toHaveTextContent(messageContent);

		// Simulate long press to open menu
		const messageElement = messageItem.element();
		messageElement.dispatchEvent(
			new MouseEvent("mousedown", {
				bubbles: true,
				buttons: 1,
			}),
		);

		// Advance timers to trigger long press (default threshold is 400ms)
		vi.advanceTimersByTime(400);

		// Click delete menu item
		const menu = getByRole("menu");
		const deleteMenuItem = menu.getByRole("menuitem", { name: /delete/i });
		await deleteMenuItem.click();

		// Run pending timers to allow delete operation to complete
		await vi.runAllTimersAsync();

		// Verify message is deleted from database
		const messagesInDb = await db.getRecipientMessages(MOCK_RECIPIENT.id);
		expect(messagesInDb).toHaveLength(0);

		// Verify message is removed from UI
		await expect.element(messageItem).not.toBeInTheDocument();
	});

	// TODO: Test for resend message
});
