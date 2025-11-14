/** @format */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, RenderOptions } from "@testing-library/react";
import React from "react";

/**
 * Creates a new QueryClient with retries disabled and renders a React component wrapped in a QueryClientProvider.
 */
const renderWithQueryClient = ({
	ui,
	options = {},
}: {
	ui: React.ReactElement;
	options?: RenderOptions;
}) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	const CustomWrapper = options?.wrapper || React.Fragment;
	const Wrapper = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			<CustomWrapper>{children}</CustomWrapper>
		</QueryClientProvider>
	);

	const { wrapper: _, ...renderOptions } = options;
	return {
		...render(ui, { wrapper: Wrapper, ...renderOptions }),
		queryClient,
	};
};

export { renderWithQueryClient };
