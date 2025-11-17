/** @format */

import { runInDevOnly } from "../helper-functions/run-only-in-dev-mode";
import { AxiosApiError } from "./types";

/** Function that handles API errors */
export type ApiErrorListener = (error: AxiosApiError) => void;

/**
 * Manages API error handling through a pub/sub pattern.
 * Implements the singleton pattern to ensure a single source of error handling.
 */
export class ApiErrorSignal {
	/** Set of subscribed error listeners */
	private listeners = new Set<ApiErrorListener>();

	/**
	 * Subscribes a listener to receive API error notifications.
	 * @param listener Function to be called when an error occurs
	 * @returns Function to unsubscribe the listener
	 */
	subscribe(listener: ApiErrorListener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	/**
	 * Emits an API error to all subscribed listeners.
	 * Errors in listeners are caught and logged only in development.
	 * @param error The API error to emit
	 */
	emit(error: AxiosApiError) {
		const listenersArray = Array.from(this.listeners);
		listenersArray.forEach((listener) => {
			try {
				listener(error);
			} catch (e) {
				runInDevOnly(() => console.error("Error in listener:", e));
			}
		});
	}
}

/** Singleton instance for global API error handling */
export const apiErrorSignal = new ApiErrorSignal();
