/** @format */

import { getAuthStatusFromCookies } from "@/routes/auth/cookie-management/get-auth-status-helper";
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthClientError, AuthCookies, AuthSuccess } from "../schemas/auth";
import { ApiErrorSignal } from "./api-error-signal";
import { requestInterceptor } from "./interceptors/request";
import { responseInterceptor } from "./interceptors/response";
import { ApiSuccessResponse, AxiosApiError } from "./types";

vi.mock("@/routes/auth/cookie-management/get-auth-status-helper");

describe("requestInterceptor", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should inject authorization header if authenticated and skipAuthHeader is not set", () => {
		const mockConfig = {
			headers: {},
			url: "/profile",
		} as InternalAxiosRequestConfig;
		const mockCookies = {
			accessToken: "mock-token",
			userType: "company",
		} as AuthSuccess["cookies"];
		vi.mocked(getAuthStatusFromCookies).mockReturnValue({
			isAuthenticated: true,
			cookies: mockCookies,
		});
		const newConfig = requestInterceptor(mockConfig);
		expect(newConfig.headers.Authorization).toBe("Bearer mock-token");
	});

	it("should throw an error if authenticated is false and skipAuthHeader is not set", () => {
		const mockConfig = {
			headers: {},
			url: "/profile",
		} as InternalAxiosRequestConfig;
		vi.mocked(getAuthStatusFromCookies).mockReturnValue({
			isAuthenticated: false,
		} as AuthClientError);
		expect(() => requestInterceptor(mockConfig)).toThrow();
	});

	it("should prefix URL with user type when skipUserTypePrefix is not set", () => {
		const mockConfig = {
			headers: {},
			url: "/profile",
		} as InternalAxiosRequestConfig;
		const mockCookies = {
			accessToken: "mock-token",
			userType: "company",
		} as AuthSuccess["cookies"];
		vi.mocked(getAuthStatusFromCookies).mockReturnValue({
			isAuthenticated: true,
			cookies: mockCookies,
		});
		const newConfig = requestInterceptor(mockConfig);
		expect(newConfig.url).toBe("/company/profile");
	});

	it("should prefix URL with user type when skipUserTypePrefix is explicitly false", () => {
		const mockConfig = {
			headers: {},
			url: "/profile",
			skipUserTypePrefix: false,
		} as InternalAxiosRequestConfig;
		const mockCookies = {
			accessToken: "mock-token",
			userType: "company",
		} as AuthSuccess["cookies"];
		vi.mocked(getAuthStatusFromCookies).mockReturnValue({
			isAuthenticated: true,
			cookies: mockCookies,
		});
		const newConfig = requestInterceptor(mockConfig);
		expect(newConfig.url).toBe("/company/profile");
	});

	it("should not prefix URL if skipUserTypePrefix is true", () => {
		const mockConfig = {
			headers: {},
			url: "/profile",
			skipUserTypePrefix: true,
		} as InternalAxiosRequestConfig;
		const mockCookies = {
			accessToken: "mock-token",
			userType: "company",
		} as AuthSuccess["cookies"];
		vi.mocked(getAuthStatusFromCookies).mockReturnValue({
			isAuthenticated: true,
			cookies: mockCookies,
		});
		const newConfig = requestInterceptor(mockConfig);
		expect(newConfig.url).toBe("/profile");
	});

	it("should prepend authenticated user type if URL is prefixed with a different user type", () => {
		const mockConfig = {
			headers: {},
			url: "/company/jobs",
		} as InternalAxiosRequestConfig;
		const mockCookies = {
			accessToken: "mock-token",
			userType: "player",
		} as AuthSuccess["cookies"];
		vi.mocked(getAuthStatusFromCookies).mockReturnValue({
			isAuthenticated: true,
			cookies: mockCookies,
		});
		const newConfig = requestInterceptor(mockConfig);
		expect(newConfig.url).toBe("/player/company/jobs");
	});

	it("should not prepend authenticated user type if URL is already prefixed with authenticated user type", () => {
		const mockConfig = {
			headers: {},
			url: "/player/jobs",
		} as InternalAxiosRequestConfig;
		const mockCookies = {
			accessToken: "mock-token",
			userType: "player",
		} as AuthSuccess["cookies"];
		vi.mocked(getAuthStatusFromCookies).mockReturnValue({
			isAuthenticated: true,
			cookies: mockCookies,
		});
		const newConfig = requestInterceptor(mockConfig);
		expect(newConfig.url).toBe("/player/jobs");
	});

	it("should throw an error if user is authenticated but user type is missing", () => {
		const mockConfig = {
			headers: {},
			url: "/profile",
		} as InternalAxiosRequestConfig;
		const mockCookies = {
			accessToken: "mock-token",
			userType: undefined,
		} as unknown as AuthSuccess["cookies"];
		vi.mocked(getAuthStatusFromCookies).mockReturnValue({
			isAuthenticated: true,
			cookies: mockCookies,
		});
		expect(() => requestInterceptor(mockConfig)).toThrow();
	});
});

describe("apiErrorSignal", () => {
	vi.unmock("./api-error-signal");
	let apiErrorSignal: ApiErrorSignal;

	beforeEach(() => {
		apiErrorSignal = new ApiErrorSignal();
		vi.restoreAllMocks();
	});

	it("should subscribe a listener and emit an error to it", () => {
		const mockListener = vi.fn();
		const mockError = new AxiosError() as AxiosApiError;
		apiErrorSignal.subscribe(mockListener);
		apiErrorSignal.emit(mockError);
		expect(mockListener).toHaveBeenCalledWith(mockError);
	});

	it("should not emit to an unsubscribed listener", () => {
		const mockListener = vi.fn();
		const mockError = new AxiosError() as AxiosApiError;
		const unsubscribe = apiErrorSignal.subscribe(mockListener);
		unsubscribe();
		apiErrorSignal.emit(mockError);
		expect(mockListener).not.toHaveBeenCalled();
	});

	it("should emit to all subscribed listeners", () => {
		const listeners = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
		listeners.forEach((listener) => apiErrorSignal.subscribe(listener));

		const mockError = new AxiosError() as AxiosApiError;
		apiErrorSignal.emit(mockError);
		listeners.forEach((listener) =>
			expect(listener).toHaveBeenCalledWith(mockError),
		);
	});

	it("should handle errors in a listener without stopping other emissions", () => {
		// Mock a listener that throws an error
		const breakingListener = vi.fn(() => {
			throw new Error("Listener error");
		});
		const workingListener = vi.fn();

		// Subscribe both listeners
		apiErrorSignal.subscribe(breakingListener);
		apiErrorSignal.subscribe(workingListener);

		const mockError = new AxiosError() as AxiosApiError;
		apiErrorSignal.emit(mockError);

		// The first listener should have been called, but thrown an error
		expect(breakingListener).toHaveBeenCalled();

		// The second listener should still have been called
		expect(workingListener).toHaveBeenCalledWith(mockError);
	});
});

describe("responseInterceptor", () => {
	vi.mock("./api-error-signal", async (importActual) => {
		const mod = await importActual<typeof import("./api-error-signal")>();

		const mockApiErrorSignal = {
			...mod.apiErrorSignal,
			emit: vi.fn(),
		};

		return {
			...mod,
			apiErrorSignal: mockApiErrorSignal,
		};
	});

	it("should return the response without modification for successful requests", () => {
		const mockResponse = {
			data: {
				message: "success",
			},
			status: 200,
		} as AxiosResponse;
		const result = responseInterceptor.onFulfilled(mockResponse);
		expect(result).toBe(mockResponse);
	});

	it("should emit the error to apiErrorSignal and reject the promise", async () => {
		const mockError = new AxiosError() as AxiosApiError;
		const { apiErrorSignal: mockedApiErrorSignal } = await import(
			"./api-error-signal"
		);

		await expect(responseInterceptor.onRejected(mockError)).rejects.toEqual(
			mockError,
		);

		// eslint-disable-next-line @typescript-eslint/unbound-method
		expect(mockedApiErrorSignal.emit).toHaveBeenCalledWith(mockError);
	});
});

describe.sequential("apiAxiosInstance", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("should create an instance with a valid baseURL", async () => {
		vi.stubEnv("VITE_API_URL", "https://example.com/api");
		const { apiAxiosInstance } = await import("./index");
		expect(apiAxiosInstance.defaults.baseURL).toBe(
			"https://example.com/api",
		);
	});

	// Skipped to prevent module cache corruption during parallel test runs, caused by intentionally loading the module with an undefined ENV.
	it.skip("should throw an error if VITE_API_URL is missing", async () => {
		vi.stubEnv("VITE_API_URL", undefined);
		await expect(() => import("./index")).rejects.toThrow();
	});
});

const server = setupServer();

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("apiAxiosInstance: full token refresh-and-retry flow", () => {
	it("should handle a 401 response by refreshing the token and retrying the request", async () => {
		const { apiAxiosInstance } = await import("./index");

		type AuthTokenCookies = Pick<
			AuthCookies,
			"accessToken" | "refreshToken"
		>;
		const [mockedOldTokens, mockedNewTokens] = [
			{
				accessToken: "old-access",
				refreshToken: "old-refresh",
			},
			{
				accessToken: "new-access",
				refreshToken: "new-refresh",
			},
		] as const satisfies AuthTokenCookies[];
		let refreshCalled = false;

		// Mock the helper to return the old tokens for the initial two calls
		// and the new tokens for the final, retried call.
		vi.mocked(getAuthStatusFromCookies)
			.mockReturnValueOnce({
				isAuthenticated: true,
				cookies: {
					...mockedOldTokens,
					userType: "company",
				},
			})
			.mockReturnValueOnce({
				isAuthenticated: true,
				cookies: {
					...mockedOldTokens,
					userType: "company",
				},
			})
			.mockReturnValue({
				isAuthenticated: true,
				cookies: {
					...mockedNewTokens,
					userType: "company",
				},
			});

		const mockedSuccessResponse = {
			success: true,
			message: "data",
		} satisfies ApiSuccessResponse;

		// Setup MSW handlers to simulate the full network flow
		server.use(
			// Initial request to the protected data endpoint that returns a 401, only once
			http.get(
				"*/protected-data",
				() => {
					return new HttpResponse(null, { status: 401 });
				},
				{ once: true },
			),

			// Token refresh endpoint that provides a new token
			http.post("*/auth/refresh-token", () => {
				refreshCalled = true;
				return HttpResponse.json({
					success: true,
					message: "refreshed",
					data: mockedNewTokens,
				} satisfies ApiSuccessResponse<{
					data: AuthTokenCookies;
				}>);
			}),

			// Retried request to the protected data endpoint with the new token
			http.get("*/protected-data", ({ request }) => {
				if (
					request.headers.get("Authorization") ===
					`Bearer ${mockedNewTokens.accessToken}`
				) {
					return HttpResponse.json(mockedSuccessResponse, {
						status: 200,
					});
				}
				return new HttpResponse(null, { status: 401 });
			}),
		);

		const response = await apiAxiosInstance.get("/protected-data");

		expect(refreshCalled).toBe(true);
		expect(response.status).toBe(200);
		expect(response.data).toEqual(mockedSuccessResponse);
	});
});
