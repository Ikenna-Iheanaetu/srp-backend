/** @format */

import { AuthSuccess } from "@/lib/schemas/auth";
import { renderWithQueryClient } from "@/testing/utils";
import { waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import React from "react";
import { createRoutesStub } from "react-router";
import { ChatsList } from ".";
import {
	CHATS_LIST_ENDPOINT as MESSAGES_ENDPOINT,
	ChatsListApiResponse as ChatsApiResponse,
} from "../query-factory";
import { ChatsListSearchParams, STATUS_TABS } from "./schemas";
import { ChatItem } from "./types";

vi.mock("@/routes/auth/cookie-management/get-auth-status-helper", () => ({
	getAuthStatusFromCookies: () =>
		({
			isAuthenticated: true,
			cookies: {
				accessToken: "mock-access-token",
				refreshToken: "mock-refresh-token",
				userType: "player",
			},
		}) satisfies AuthSuccess,
}));

// vi.mock("react-router", async (importOriginal) => {
// 	const original = await importOriginal<typeof import("react-router")>();
// 	return {
// 		...original,
// 		useLocation: (() => ({
// 			pathname: "/messages",
// 			search: "",
// 			state: {},
// 			hash: "",
// 			key: "default",
// 		})) satisfies typeof useLocation,
// 	};
// });

const mockMessages: ChatItem[] = [
	{
		id: "msg-016",
		name: "Jessica Jones",
		avatar: "https://placehold.co/50x50/c0392b/FFFFFF/png?text=JJ",
		message: "Confirmed. I've updated my calendar.",
		timestamp: "2025-10-02T11:25:10Z",
		status: "READ",
	},
	{
		id: "msg-017",
		name: "Peter Parker",
		avatar: "https://placehold.co/50x50/16a085/FFFFFF/png?text=PP",
		message:
			"I found an issue with the mobile view on the homepage. Sending screenshots.",
		timestamp: "2025-10-02T11:30:25Z",
		status: "UNREAD",
		unreadCount: 2,
	},
	{
		id: "msg-018",
		name: "Diana Prince",
		avatar: "https://placehold.co/50x50/9b59b6/FFFFFF/png?text=DP",
		message: "Acknowledged. Thanks for spotting that.",
		timestamp: "2025-10-02T11:35:00Z",
		status: "READ",
	},
];

const renderMessagesList = (
	searchParams: Partial<ChatsListSearchParams> = {},
) => {
	const StubWrapper = createRoutesStub([
		{
			path: "/messages",
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			Component: ChatsList as React.ComponentType<any>,
		},
	]);

	return renderWithQueryClient({
		ui: <StubWrapper initialEntries={["/messages"]} />,
		options: {
			wrapper: withNuqsTestingAdapter({
				searchParams,
			}),
		},
	});
};

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Initial Content Loading & Display", () => {
	test("should successfully fetch and render the initial list of messages", async () => {
		server.use(
			http.get(`*${MESSAGES_ENDPOINT}`, () => {
				return HttpResponse.json({
					data: {
						data: mockMessages,
						meta: {
							total: mockMessages.length,
							page: 1,
							totalPages: 1,
							limit: mockMessages.length,
						},
					},
					success: true,
					message: "Fetched messages successfully",
				} satisfies ChatsApiResponse);
			}),
		);

		const { container } = renderMessagesList();

		// Wait for data to load and assert the first item appears
		const firstMessageName = new RegExp(mockMessages[0]?.name ?? "", "i");
		const firstMessageLink = await waitFor(() =>
			within(container).getByRole("link", { name: firstMessageName }),
		);
		expect(firstMessageLink).toBeInTheDocument();

		// Loop through all messages to assert their presence and details
		mockMessages.forEach((message) => {
			const messageNameRegex = new RegExp(message.name, "i");
			const messageLink = within(container).getByRole("link", {
				name: messageNameRegex,
			});

			const messageContent = within(messageLink);

			expect(
				messageContent.getByText(message.message),
			).toBeInTheDocument();

			const unreadBadgeName = new RegExp(
				`${message.unreadCount} unread messages`,
				"i",
			);
			if (message.unreadCount && message.unreadCount > 0) {
				expect(
					messageContent.getByRole("status", {
						name: unreadBadgeName,
					}),
				).toBeInTheDocument();
			} else {
				expect(
					messageContent.queryByRole("status", {
						name: unreadBadgeName,
					}),
				).not.toBeInTheDocument();
			}

			const formattedTime = dayjs(message.timestamp).format("hh:mm A");
			const timeIndicator = messageContent.getByRole("time", {
				name: new RegExp(`Time ${formattedTime}`, "i"),
			});
			expect(timeIndicator).toBeInTheDocument();
		});
	});
});

describe("Server-Side Filtering", () => {
	test("should filter messages based on user search input", async () => {
		const user = userEvent.setup();

		server.use(
			http.get(`*${MESSAGES_ENDPOINT}`, ({ request }) => {
				const url = new URL(request.url);
				const searchParam = url.searchParams.get("search");

				// Determine which messages to return based on the 'search' query param
				const filterValue = searchParam || "";

				const filteredMessages = mockMessages.filter((m) =>
					filterValue
						? m.name
								.toLowerCase()
								.includes(filterValue.toLowerCase())
						: true,
				);

				return HttpResponse.json({
					data: {
						data: filteredMessages,
						meta: {
							total: filteredMessages.length,
							page: 1,
							totalPages: 1,
							limit: filteredMessages.length,
						},
					},
					success: true,
					message: "Fetched filtered messages successfully",
				} satisfies ChatsApiResponse);
			}),
		);

		const { container } = renderMessagesList();

		// Wait for initial load to ensure the search input is present
		const searchInput = await waitFor(() =>
			within(container).getByPlaceholderText(/search messages/i),
		);
		expect(searchInput).toHaveRole("searchbox");

		const messageToSearch = mockMessages[1];

		const searchTerm = messageToSearch?.name ?? "";

		await user.type(searchInput, searchTerm);

		await waitFor(() => {
			mockMessages.forEach((message) => {
				const isExpectedMessage = message.name.includes(searchTerm);
				const messageNameRegex = new RegExp(message.name, "i");
				if (isExpectedMessage) {
					expect(
						within(container).getByRole("link", {
							name: messageNameRegex,
						}),
					).toBeInTheDocument();
				} else {
					// NOTE: This block passes when use useState, but fails when I use nuqs. Can't determine why
					expect(
						within(container).queryByRole("link", {
							name: messageNameRegex,
						}),
					).not.toBeInTheDocument();
				}
			});
		});
	});

	test("should filter messages based on status tab selection and update list", async () => {
		const user = userEvent.setup();

		server.use(
			http.get(`*${MESSAGES_ENDPOINT}`, ({ request }) => {
				const url = new URL(request.url);
				const statusParam = url.searchParams.get("status");

				// Determine which messages to return based on the 'status' query param
				const filterValue = statusParam || STATUS_TABS.ALL;

				const filteredMessages = mockMessages.filter((m) =>
					filterValue === STATUS_TABS.ALL
						? true
						: m.status === filterValue,
				);

				return HttpResponse.json({
					data: {
						data: filteredMessages,
						meta: {
							total: filteredMessages.length,
							page: 1,
							totalPages: 1,
							limit: filteredMessages.length,
						},
					},
					success: true,
					message: "Fetched filtered messages successfully",
				} satisfies ChatsApiResponse);
			}),
		);

		const { container } = renderMessagesList();

		const tabList = await waitFor(() =>
			within(container).getByRole("tablist", {
				name: new RegExp("Messages status tabs", "i"),
			}),
		);

		// should initial show all status
		const allTab = within(tabList).getByRole("tab", {
			name: /All Conversations/i,
		});
		expect(allTab).toHaveAttribute("aria-selected", "true");

		// unread tab shouldn't be Initially active
		const unreadTab = within(tabList).getByRole("tab", {
			name: /Unread Conversations/i,
		});
		expect(unreadTab).not.toHaveAttribute("aria-selected", "true");

		await user.click(unreadTab);

		await waitFor(() =>
			expect(unreadTab).toHaveAttribute("aria-selected", "true"),
		);

		await waitFor(() => {
			mockMessages.forEach((message) => {
				const isExpectedMessage = message.status === STATUS_TABS.UNREAD;
				const messageNameRegex = new RegExp(message.name, "i");
				if (isExpectedMessage) {
					const messageLink = within(container).getByRole("link", {
						name: messageNameRegex,
					});
					expect(messageLink).toBeInTheDocument();

					// ensure unreadBadge is present
					const unreadBadgeName = new RegExp(
						`${message.unreadCount} unread messages`,
						"i",
					);

					expect(
						within(messageLink).getByRole("status", {
							name: unreadBadgeName,
						}),
					).toBeInTheDocument();
				} else {
					// NOTE: This block passes when use useState, but fails when I use nuqs. Can't determine why
					expect(
						within(container).queryByRole("link", {
							name: messageNameRegex,
						}),
					).not.toBeInTheDocument();
				}
			});
		});
	});
});
