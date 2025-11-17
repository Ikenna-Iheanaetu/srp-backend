/** @format */

import axios, {
	AxiosError,
	AxiosRequestHeaders,
	AxiosResponse,
	AxiosStatic,
	InternalAxiosRequestConfig,
} from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { Mock } from "vitest";
import { createAuthRefreshInterceptor } from ".";
import { AxiosAuthRefreshCache, AxiosAuthRefreshOptions } from "./types";
import {
	createRefreshCall,
	createRequestQueueInterceptor,
	defaultOptions,
	getRetryInstance,
	mergeOptions,
	shouldInterceptError,
	unsetCache,
} from "./utils";

const mockedAxios = () => {
	const bag = {
		request: [] as number[],
		response: [] as number[],
		has: vi.fn((type: "request" | "response", id: number) =>
			bag[type].includes(id)
		),
	};
	return {
		interceptors: {
			request: {
				use: vi.fn(() => {
					const i = Math.random();
					bag.request.push(i);
					return i;
				}),
				eject: vi.fn((i) => {
					bag.request = bag.request.filter((n) => n !== i);
				}),
			},
			response: {
				use: vi.fn(() => {
					const i = Math.random();
					bag.response.push(i);
					return i;
				}),
				eject: vi.fn((i) => {
					bag.response = bag.response.filter((n) => n !== i);
				}),
			},
			has: bag.has,
		},
		defaults: {
			params: {},
		},
	} as AxiosStatic & {
		interceptors: {
			request: {
				use: Mock<() => number>;
				eject: Mock<(i: unknown) => void>;
			};
			response: {
				use: Mock<() => number>;
				eject: Mock<(i: unknown) => void>;
			};
			has: Mock<(type: "request" | "response", id: number) => boolean>;
		};
	};
};

const sleep = (ms: number) => {
	return new Promise((resolve) => {
		const id = setTimeout(() => {
			clearTimeout(id);
			resolve("OK");
		}, ms);
	});
};

describe("Merges configs", () => {
	test("options and defaults are the same", () => {
		const options: AxiosAuthRefreshOptions = { statusCodes: [204] };
		const defaults: AxiosAuthRefreshOptions = { statusCodes: [204] };
		expect(mergeOptions({ defaults, options })).toEqual({
			statusCodes: [204],
		});
	});

	test("options is different than the defaults", () => {
		const options: AxiosAuthRefreshOptions = { statusCodes: [302] };
		const defaults: AxiosAuthRefreshOptions = { statusCodes: [204] };
		expect(mergeOptions({ defaults, options })).toEqual({
			statusCodes: [302],
		});
	});

	test("options is empty", () => {
		const options: AxiosAuthRefreshOptions = {};
		const defaults: AxiosAuthRefreshOptions = { statusCodes: [204] };
		expect(mergeOptions({ defaults, options })).toEqual({
			statusCodes: [204],
		});
	});
});

describe("Determines if the response should be intercepted", () => {
	let cache: AxiosAuthRefreshCache;
	beforeEach(() => {
		cache = {
			skipInstances: [],
			refreshCall: undefined,
			requestQueueInterceptorId: undefined,
		};
	});

	const mockAxiosResponse = () =>
		({
			data: {},
			status: 401,
			statusText: "Unauthorized",
			headers: {
				"content-type": "application/json",
				"cache-control": "no-cache",
			},
			config: {
				url: "/api/v1/resource",
				method: "get",
				headers: {
					"content-type": "application/json",
				} as unknown as AxiosRequestHeaders,
				data: undefined,
			},
			request: {},
		} satisfies AxiosResponse);

	const mockAxiosError = ({
		message = "Request failed with status code 401",
		code = "ERR_BAD_REQUEST",
		config = {
			headers: {},
			method: "GET",
			url: "/api/resource",
		} as InternalAxiosRequestConfig,
		request = {},
		response = mockAxiosResponse(),
	}: {
		message?: string;
		code?: string;
		config?: InternalAxiosRequestConfig;
		request?: unknown;
		response?: AxiosResponse<unknown, unknown>;
	}) => new AxiosError(message, code, config, request, response);

	const options = { statusCodes: [401 as const] };

	test("no error object provided", () => {
		expect(
			shouldInterceptError({
				error: undefined,
				options,
				instance: axios,
				cache,
			})
		).toBeFalsy();
	});

	test("no response inside error object", () => {
		expect(
			shouldInterceptError({
				error: mockAxiosError({ response: undefined }),
				options,
				instance: axios,
				cache,
			})
		).toBeTruthy();
	});

	test("no status in error.response object", () => {
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					response: {
						...mockAxiosResponse(),
						status: undefined as unknown as number,
					},
				}),
				options,
				instance: axios,
				cache,
			})
		).toBeFalsy();
	});

	test("error status code is not included in the refreshable codes", () => {
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					response: { ...mockAxiosResponse(), status: 403 },
				}),
				options,
				instance: axios,
				cache,
			})
		).toBeFalsy();
	});

	test("error status code is included in the refreshable codes", () => {
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					response: { ...mockAxiosResponse(), status: 401 },
				}),
				options,
				instance: axios,
				cache,
			})
		).toBeTruthy();
	});

	test("error has (api sent a) refreshable response status specified as a string", () => {
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					response: {
						...mockAxiosResponse(),
						status: "401" as unknown as number,
					},
				}),
				options,
				instance: axios,
				cache,
			})
		).toBeTruthy();
	});

	test("when skipAuthRefresh flag is set to true and response.status is refreshable", () => {
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					config: {
						skipAuthRefresh: true,
					} as InternalAxiosRequestConfig,
					response: { ...mockAxiosResponse(), status: 401 },
				}),
				options,
				instance: axios,
				cache,
			})
		).toBeFalsy();
	});

	test("when skipAuthRefresh flag is set to false and response.status is refreshable", () => {
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					config: {
						skipAuthRefresh: false,
					} as InternalAxiosRequestConfig,
					response: { ...mockAxiosResponse(), status: 401 },
				}),
				options,
				instance: axios,
				cache,
			})
		).toBeTruthy();
	});

	test("when pauseInstanceWhileRefreshing flag is not provided and response.status is refreshable", () => {
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					response: { ...mockAxiosResponse(), status: 401 },
				}),
				options: {
					...options,
					pauseInstanceWhileRefreshing: undefined,
				},
				instance: axios,
				cache,
			})
		).toBeTruthy();
	});

	test("when pauseInstanceWhileRefreshing flag is set to true and response.status is refreshable", () => {
		const newCache = { ...cache, skipInstances: [axios] };
		const newOptions = { ...options, pauseInstanceWhileRefreshing: true };
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					response: { ...mockAxiosResponse(), status: 401 },
				}),
				options: newOptions,
				instance: axios,
				cache: newCache,
			})
		).toBeFalsy();
	});

	test("when pauseInstanceWhileRefreshing flag is set to false and response.status is refreshable", () => {
		const newOptions = { ...options, pauseInstanceWhileRefreshing: false };
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					response: { ...mockAxiosResponse(), status: 401 },
				}),
				options: newOptions,
				instance: axios,
				cache,
			})
		).toBeTruthy();
	});

	test("when shouldRefresh returns true and response.status is refreshable", () => {
		const newOptions: AxiosAuthRefreshOptions = {
			...options,
			shouldRefresh: () => true,
		};
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					response: { ...mockAxiosResponse(), status: 401 },
				}),
				options: newOptions,
				instance: axios,
				cache,
			})
		).toBeTruthy();
	});

	test("when shouldRefresh returns false and response.status is refreshable", () => {
		const newOptions: AxiosAuthRefreshOptions = {
			...options,
			shouldRefresh: () => false,
		};
		expect(
			shouldInterceptError({
				error: mockAxiosError({
					response: { ...mockAxiosResponse(), status: 401 },
				}),
				options: newOptions,
				instance: axios,
				cache,
			})
		).toBeFalsy();
	});
});

describe("Creates refresh call", () => {
	let cache: AxiosAuthRefreshCache;
	beforeEach(() => {
		cache = {
			skipInstances: [],
			refreshCall: undefined,
			requestQueueInterceptorId: undefined,
		};
	});

	it("creates refreshTokenCall and correctly resolves", async () => {
		await expect(
			createRefreshCall({
				error: {},
				fn: () => Promise.resolve("hello world"),
				cache,
			})
		).resolves.toBe("hello world");
	});

	it("creates refreshTokenCall and correctly rejects", async () => {
		await expect(
			createRefreshCall({
				error: {},
				// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
				fn: () => Promise.reject("goodbye world"),
				cache,
			})
		).rejects.toBe("goodbye world");
	});

	it("creates only one instance of refreshing call", () => {
		const refreshTokenCall = () => Promise.resolve("hello world");
		const result1 = createRefreshCall({
			error: {},
			fn: refreshTokenCall,
			cache,
		});
		const result2 = createRefreshCall({
			error: {},
			fn: refreshTokenCall,
			cache,
		});
		expect(result1).toBe(result2);
	});
});

describe("Requests interceptor", () => {
	let cache: AxiosAuthRefreshCache;
	beforeEach(() => {
		cache = {
			skipInstances: [],
			refreshCall: undefined,
			requestQueueInterceptorId: undefined,
		};
	});

	it("is created successfully", () => {
		const mock = mockedAxios();
		void createRefreshCall({
			error: {},
			fn: () => Promise.resolve(),
			cache,
		});
		const result1 = createRequestQueueInterceptor({
			instance: mock,
			cache,
			options: {},
		});
		expect(mock.interceptors.has("request", result1)).toBeTruthy();
		mock.interceptors.request.eject(result1);
	});

	it("is created only once", () => {
		void createRefreshCall({
			error: {},
			fn: () => Promise.resolve(),
			cache,
		});
		const result1 = createRequestQueueInterceptor({
			instance: axios.create(),
			cache,
			options: {},
		});
		const result2 = createRequestQueueInterceptor({
			instance: axios.create(),
			cache,
			options: {},
		});
		expect(result1).toBe(result2);
	});

	// TODO: Refine this test to use the axios mock adapter and the response interceptor
	it.skip("queues subsequent requests and only performs one refresh", async () => {
		try {
			let refreshed = 0;
			const instance = axios.create();
			createRequestQueueInterceptor({ instance, cache, options: {} });
			void createRefreshCall({
				error: {},
				fn: async () => {
					await sleep(400);
					++refreshed;
				},
				cache,
			});
			await instance
				.get("http://example.com")
				.then(() => expect(refreshed).toBe(1));
			await instance
				.get("http://example.com")
				.then(() => expect(refreshed).toBe(1));
		} catch (e) {
			expect(e).toBeFalsy();
		}
	});

	// TODO: Refine this test to use the axios mock adapter and the response interceptor
	it.skip("doesn't intercept skipped request", async () => {
		try {
			let refreshed = 0;
			const instance = axios.create();
			createRequestQueueInterceptor({ instance, cache, options: {} });
			void createRefreshCall({
				error: {},
				fn: async () => {
					await sleep(400);
					++refreshed;
				},
				cache,
			});
			await instance
				.get("http://example.com")
				.then(() => expect(refreshed).toBe(1));
			await instance
				.get("http://example.com", {
					skipAuthRefresh: true,
				})
				.then(() => expect(refreshed).toBe(1));
		} catch (e) {
			expect(e).toBeFalsy();
		}
	});

	it("cancels all requests when refreshing call failed", async () => {
		const instance = axios.create();

		createRequestQueueInterceptor({ instance, cache, options: {} });

		void createRefreshCall({
			error: {},
			fn: async () => {
				await new Promise((resolve) => setTimeout(resolve, 500));
				// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
				return Promise.reject();
			},
			cache,
		});

		const requests = [
			instance.get("http://example.com"),
			instance.get("http://example.com"),
		];

		// We expect Promise.all to reject with the first rejection it encounters.
		// That will be the `axios.Cancel` error.
		await expect(Promise.all(requests)).rejects.toThrow(
			"Request call failed"
		);
	});

	it("uses the correct instance of axios to retry requests", () => {
		const instance = axios.create();
		const options = mergeOptions({ defaults: defaultOptions, options: {} });
		const result = getRetryInstance({ instance, options });
		expect(result).toBe(instance);

		const retryInstance = axios.create();
		const optionsWithRetryInstance = mergeOptions({
			defaults: defaultOptions,
			options: {
				retryInstance,
			},
		});
		const resultWithRetryInstance = getRetryInstance({
			instance,
			options: optionsWithRetryInstance,
		});
		expect(resultWithRetryInstance).toBe(retryInstance);
	});

	// TODO: Refine this test to use the axios mock adapter and the response interceptor
	it.skip("calls the onRetry callback before retrying the request", async () => {
		const instance = axios.create();
		const onRetry = vi.fn(
			(requestConfig: InternalAxiosRequestConfig) => requestConfig
		);
		createRequestQueueInterceptor({
			instance,
			cache,
			options: { onRetry },
		});
		void createRefreshCall({
			error: {},
			fn: async () => {
				await sleep(500);
				return Promise.resolve();
			},
			cache,
		});
		await instance.get("http://example.com");
		expect(onRetry).toHaveBeenCalled();
	});
});

describe("Response interceptor", () => {
	it("uses the request interceptor to call the onRetry callback before retrying the request", async () => {
		const instance = axios.create();
		const mock = new AxiosMockAdapter(instance);
		const onRetry = vi.fn((requestConfig: InternalAxiosRequestConfig) => {
			return {
				...requestConfig,
				url: "https://httpstat.us/200",
			};
		});

		createAuthRefreshInterceptor({
			instance,
			refreshAuthCall: (e) => Promise.resolve(e),
			options: {
				onRetry,
			},
		});

		// Mock the initial request to respond with a 401 error
		mock.onGet("https://httpstat.us/401").replyOnce(401);

		// Mock the retry request to respond with a 200 success
		mock.onGet("https://httpstat.us/200").reply(200);

		await instance.get("https://httpstat.us/401");

		expect(onRetry).toHaveBeenCalled();

		mock.restore();
	});

	it("uses the request interceptor to call the onRetry callback before retrying all the requests", async () => {
		const instance = axios.create();
		const mock = new AxiosMockAdapter(instance);
		const onRetry = vi.fn((requestConfig: InternalAxiosRequestConfig) => {
			return {
				...requestConfig,
				url: "https://httpstat.us/200",
			};
		});

		createAuthRefreshInterceptor({
			instance,
			refreshAuthCall: (e) => Promise.resolve(e),
			options: {
				onRetry,
			},
		});

		// Mock all initial requests to respond with a 401 error
		mock.onGet("https://httpstat.us/401").reply(401);

		// Mock all retry requests to respond with a 200 success
		mock.onGet("https://httpstat.us/200").reply(200);

		const requests = [
			instance.get("https://httpstat.us/401"),
			instance.get("https://httpstat.us/401"),
			instance.get("https://httpstat.us/401"),
			instance.get("https://httpstat.us/401"),
		];

		await Promise.all(requests);

		expect(onRetry).toHaveBeenCalledTimes(requests.length);

		mock.restore();
	});
});

describe("Creates the overall interceptor correctly", () => {
	it("returns interceptor id", () => {
		const id = createAuthRefreshInterceptor({
			instance: axios,
			refreshAuthCall: (e) => Promise.resolve(e),
		});
		expect(typeof id).toBe("number");
		expect(id).toBeGreaterThanOrEqual(0);
	});

	it("does not change the interceptors queue", async () => {
		// Type assertion to bypass the TypeScript error.
		// The `handlers` property is an internal, non-public part of the Axios
		// interceptor manager, but we need to access it for this test.
		interface AxiosInterceptorHandler {
			fulfilled: (...args: unknown[]) => unknown;
			rejected: (...args: unknown[]) => unknown;
			synchronous: boolean;
			runWhen: ((...args: unknown[]) => unknown) | null;
		}
		interface AxiosInterceptorResponse {
			handlers: AxiosInterceptorHandler[];
		}

		try {
			const instance = axios.create();
			const id = createAuthRefreshInterceptor({
				instance: axios,
				refreshAuthCall: () => instance.get("https://httpstat.us/200"),
			});
			const id2 = instance.interceptors.response.use(
				(req) => req,
				// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
				(error) => Promise.reject(error)
			);
			const interceptor1 = (
				instance.interceptors
					.response as unknown as AxiosInterceptorResponse
			).handlers[id];
			const interceptor2 = (
				instance.interceptors
					.response as unknown as AxiosInterceptorResponse
			).handlers[id2];
			try {
				await instance.get("https://httpstat.us/401");
			} catch {
				// Ignore error as it's 401 all over again
			}

			const interceptor1__after = (
				instance.interceptors
					.response as unknown as AxiosInterceptorResponse
			).handlers[id];
			const interceptor2__after = (
				instance.interceptors
					.response as unknown as AxiosInterceptorResponse
			).handlers[id2];
			expect(interceptor1).toBe(interceptor1__after);
			expect(interceptor2).toBe(interceptor2__after);
		} catch (e) {
			// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
			return await Promise.reject(e);
		}
	});
});

describe("State is cleared", () => {
	it("after refreshing call succeeds/fails", () => {
		const cache: AxiosAuthRefreshCache = {
			skipInstances: [],
			refreshCall: undefined,
			requestQueueInterceptorId: undefined,
		};

		const instance = mockedAxios();
		cache.requestQueueInterceptorId = instance.interceptors.request.use(
			(config) => config
		);
		cache.skipInstances.push(instance);

		expect(
			instance.interceptors.has(
				"request",
				cache.requestQueueInterceptorId
			)
		).toBeTruthy();
		expect(cache.skipInstances.length).toBe(1);
		unsetCache({ instance, cache });
		expect(cache.skipInstances.length).toBe(0);
		expect(cache.requestQueueInterceptorId).toBeFalsy();
		expect(
			instance.interceptors.has(
				"request",
				cache.requestQueueInterceptorId
			)
		).toBeFalsy();
	});
});
