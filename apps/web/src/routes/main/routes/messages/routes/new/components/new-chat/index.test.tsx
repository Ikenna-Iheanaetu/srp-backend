/** @format */

// prettier-ignore
/* eslint-disable testing-library/prefer-screen-queries */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { createRoutesStub, href } from "react-router";
import { render } from "vitest-browser-react";
import { NewChat } from ".";
import { ChatRecipient } from "../../../chat/types";
import { serializeNewChatSearchParams } from "../../search-params";

const MOCK_RECIPIENT: ChatRecipient = {
	id: "p123",
	profileId: "dfdf",
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

const renderNewChat = (recipient = MOCK_RECIPIENT) => {
	const Stub = createRoutesStub([
		{
			path: href("/messages/new"),
			Component: () => <NewChat recipient={recipient} />,
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

describe("Recipient info display", () => {
	it("renders recipient name and avatar inside the correct navigation link", async () => {
		const { getByRole } = await renderNewChat(MOCK_RECIPIENT);
		const recipientLink = getByRole("link");

		// Assert correct link href
		const expectedHref = href("/:userType/:id", {
			userType: MOCK_RECIPIENT.userType,
			id: MOCK_RECIPIENT.id,
		});
		expect(recipientLink).toHaveAttribute("href", expectedHref);

		// Assert recipient name
		const nameElement = recipientLink.getByText(MOCK_RECIPIENT.name);
		expect(nameElement).toBeInTheDocument();

		// Assert recipient avatar
		const avatarElement = recipientLink.getByRole("img", {
			name: new RegExp(MOCK_RECIPIENT.name, "i"),
		});
		await expect
			.element(avatarElement)
			.toHaveAttribute("src", MOCK_RECIPIENT.avatar);
	});
});
