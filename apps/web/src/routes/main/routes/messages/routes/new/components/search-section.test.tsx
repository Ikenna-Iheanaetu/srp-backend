/** @format */

import { AuthSuccess } from "@/lib/schemas/auth";
import { renderWithQueryClient } from "@/testing/utils";
import { waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { ChatRecipient } from "../../chat/types";
import {
	NEW_RECIPIENTS_ENDPOINT,
	RecipientsApiResponse,
} from "../query-factory";
import { getCompanyOptionMatcher } from "../testing-utils";
import { SearchSection, SearchSectionProps } from "./search-section";

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

const mockCompanies: ChatRecipient[] = [
	{ id: "c1", name: "Alpha Dynamics", location: "123 Main St" },
	{ id: "c2", name: "Beta Solutions", location: "456 Oak Ave" },
	{ id: "c3", name: "Gamma Corp", location: "789 Pine Ln" },
	{ id: "c4", name: "Delta Works", location: "101 Elm Blvd" },
] as ChatRecipient[];

type MockOnSelectCompany = SearchSectionProps["onSelectRecipient"];
const mockOnSelectCompany = vi.fn<MockOnSelectCompany>();

// Create a server to handle mocked API requests
const server = setupServer();

const renderSearchSection = (
	searchParams: string | Record<string, string> | URLSearchParams = "",
) => {
	return renderWithQueryClient({
		ui: <SearchSection onSelectRecipient={mockOnSelectCompany} />,
		options: {
			wrapper: withNuqsTestingAdapter({
				searchParams,
			}),
		},
	});
};

// const sleep = (ms: number): Promise<void> => {
// 	return new Promise((resolve) => {
// 		setTimeout(resolve, ms);
// 	});
// };

afterEach(() => {
	mockOnSelectCompany.mockClear();
});

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Server-side Search", () => {
	it("should filter companies based on user search input", async () => {
		const user = userEvent.setup();
		const spyOnRequest = vi.fn();

		server.use(
			http.get(`*${NEW_RECIPIENTS_ENDPOINT}`, ({ request }) => {
				const url = new URL(request.url);
				const search = url.searchParams.get("search");

				spyOnRequest(search);

				const filteredCompanies = mockCompanies.filter((company) =>
					search
						? company.name
								.toLowerCase()
								.includes(search.toLowerCase())
						: true,
				);

				const response = {
					success: true,
					message: "yeah",
					data: {
						data: filteredCompanies,
						meta: {
							total: filteredCompanies.length,
							page: 1,
							totalPages: 1,
							limit: 10,
						},
					},
				} satisfies RecipientsApiResponse;

				return HttpResponse.json(response);
			}),
		);

		const { container } = renderSearchSection(
			// render with an initial empty search param
			"",
		);

		// Wait for the initial, unfiltered list to load (search: "")
		const companyOption = await within(container).findByRole("option", {
			name: getCompanyOptionMatcher(mockCompanies[0]?.name ?? ""),
		});
		expect(companyOption).toBeInTheDocument();

		const searchInput =
			within(container).getByPlaceholderText(/type a company name/i);
		expect(searchInput).toHaveRole("combobox");

		const companyToSearch = mockCompanies[1];
		await user.type(searchInput, companyToSearch?.name ?? "");

		// Assert that the network request was made with the correct search query
		await waitFor(() => {
			expect(spyOnRequest).toHaveBeenCalledWith(companyToSearch?.name);
		});

		// Assert that the matching company is rendered
		const searchedCompanyItem = await within(container).findByRole(
			"option",
			{
				name: getCompanyOptionMatcher(companyToSearch?.name ?? ""),
			},
		);
		expect(searchedCompanyItem).toBeInTheDocument();

		// Check that other companies are not rendered
		// NOTE: This test fails here but the implementation works as expected.
		// It fails even when I removed the debounced search and also not use nuqs but useState
		await waitFor(() => {
			mockCompanies.forEach((company) => {
				expect(
					within(container).queryByRole("option", {
						name: getCompanyOptionMatcher(company.name),
					}),
				).not.toBeInTheDocument();
			});
		});
	});

	it('should display "No companies found" for an empty search result', async () => {
		const user = userEvent.setup();

		server.use(
			http.get(`*${NEW_RECIPIENTS_ENDPOINT}`, () => {
				const response = {
					success: true,
					message: "empty result",
					data: {
						data: [],
						meta: {
							total: 0,
							page: 1,
							totalPages: 1,
							limit: 10,
						},
					},
				} satisfies RecipientsApiResponse;
				return HttpResponse.json(response);
			}),
		);

		const { container } = renderSearchSection();

		const searchInput =
			within(container).getByPlaceholderText(/type a company name/i);
		expect(searchInput).toHaveRole("combobox");

		await user.type(searchInput, "non-existent company");

		await waitFor(() => {
			mockCompanies.forEach((company) => {
				expect(
					within(container).queryByRole("option", {
						name: getCompanyOptionMatcher(company.name),
					}),
				).not.toBeInTheDocument();
			});
		});

		await waitFor(() => {
			expect(
				within(container).getByText(/no companies found/i),
			).toBeInTheDocument();
		});
	});
});

describe("Company Selection", () => {
	const FullCompanyListResponse = {
		success: true,
		message: "success",
		data: {
			data: mockCompanies,
			meta: {
				total: mockCompanies.length,
				page: 1,
				totalPages: 1,
				limit: 10,
			},
		},
	} satisfies RecipientsApiResponse;

	it("should call onSelectCompany with the correct ID when a company is clicked", async () => {
		const user = userEvent.setup();
		const companyToSelect = mockCompanies[2]; // e.g., "Gamma Corp"

		// Arrange: Mock the initial API response to return the full list
		server.use(
			http.get(`*${NEW_RECIPIENTS_ENDPOINT}`, () => {
				return HttpResponse.json(FullCompanyListResponse);
			}),
		);

		const { container } = renderSearchSection();

		const companyOption = await within(container).findByRole("option", {
			name: getCompanyOptionMatcher(companyToSelect?.name ?? ""),
		});

		await user.click(companyOption);

		// Assert: Verify the selection callback was triggered correctly
		expect(mockOnSelectCompany).toHaveBeenCalledTimes(1);
		expect(mockOnSelectCompany).toHaveBeenCalledWith<
			Parameters<MockOnSelectCompany>
		>(companyToSelect!);
	});
});
