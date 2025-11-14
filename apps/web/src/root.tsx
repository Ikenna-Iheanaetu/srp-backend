/** @format */

import { GoogleOAuthProvider } from "@react-oauth/google";
import {
	MutationCache,
	Query,
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { toast, Toaster } from "sonner";
// Register Zod prototype custom methods from './types/zod.ts' on page load.
import { BRAND_NAME } from "./constants/brand";
import { getErrorMessage } from "./lib/utils";
import "./types/zod";

export const ErrorBoundary = () => {
	return <div className="text-red-500">Application Error</div>;
};

const SITE_URL = import.meta.env.VITE_SITE_URL as string;

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0"
				/>
				<title>{BRAND_NAME}</title>

				{/* og meta tags for link preview */}
				<meta property="og:url" content={SITE_URL} />
				<meta property="og:title" content={BRAND_NAME} />
				<meta
					property="og:description"
					content="Recruit professionals, best sports talents, and opportunities here."
				/>
				<meta
					property="og:image"
					content={`${SITE_URL}/assets/images/og-image.png`}
				/>

				{/* paste this BEFORE any scripts */}
				<Meta />
				<Links />
				<link rel="icon" href="/assets/images/site-logo.webp" />
			</head>
			<body>
				{children}
				<Toaster richColors />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

/**@see {@link https://tkdodo.eu/blog/automatic-query-invalidation-after-mutations#exclude-queries-depending-on-staletime} */
const getNonStaticQueries = (
	query: Query,
	queryClient: QueryClient,
): boolean => {
	// Resolve defaultStaleTime to a number
	const defaultStaleTimeRaw =
		queryClient.getQueryDefaults(query.queryKey).staleTime ?? 0;
	const defaultStaleTime =
		typeof defaultStaleTimeRaw === "function"
			? defaultStaleTimeRaw(query)
			: defaultStaleTimeRaw;

	// Map observer staleTimes, resolving functions to numbers
	const staleTimes = query.observers
		.map((observer) => {
			const staleTime = observer.options.staleTime;
			if (staleTime === undefined) return undefined;
			return typeof staleTime === "function"
				? staleTime(query)
				: staleTime;
		})
		.filter((staleTime): staleTime is number => staleTime !== undefined);

	// Calculate the minimum staleTime
	const staleTime =
		query.getObserversCount() > 0 && staleTimes.length > 0
			? Math.min(...staleTimes)
			: defaultStaleTime;

	return staleTime !== Number.POSITIVE_INFINITY;
};

export const GlobalQueryClient = new QueryClient({
	queryCache: new QueryCache({
		onError(error, query) {
			const customOnError = query.meta?.onError;

			const toastControlValue = customOnError
				? customOnError(error, query)
				: undefined;

			if (toastControlValue === "none") return;

			const toastTitle =
				typeof toastControlValue === "string"
					? toastControlValue
					: "Something went wrong"; // Default title

			// Show the toast
			toast.error(toastTitle, {
				description: getErrorMessage(error),
				position: "top-center",
				id: `query-error-${JSON.stringify(query.queryKey)}`,
			});
		},
	}),
	mutationCache: new MutationCache({
		onError: (error, _variables, _context, mutation) => {
			const toastControlValue = mutation.meta?.errorMessage;

			if (toastControlValue === "none") return;

			const toastTitle = toastControlValue ?? "Action failed";

			toast.error(toastTitle, {
				description: getErrorMessage(error),
				id: `mutation-error-${mutation.mutationId}`,
			});
		},
		onSuccess: (_data, _variables, _context, mutation) => {
			// Invalidate dependent queries after successful mutation
			// mutations without a key would invalidate all queries
			if (mutation.options.mutationKey) {
				void GlobalQueryClient.invalidateQueries({
					queryKey: mutation.options.mutationKey,
					predicate: (query) =>
						getNonStaticQueries(query, GlobalQueryClient),
				});
			}
		},
	}),
});

export default function Root() {
	return (
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
			<QueryClientProvider client={GlobalQueryClient}>
				<NuqsAdapter>
					<Outlet />
				</NuqsAdapter>
			</QueryClientProvider>
		</GoogleOAuthProvider>
	);
}
