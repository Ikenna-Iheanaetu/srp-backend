/** @format */

// prettier-ignore
/* eslint-disable react-compiler/react-compiler */
/* eslint-disable @typescript-eslint/unbound-method */
/** @format */

import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { useBlocker } from "react-router";
import { toast } from "sonner";

/**Prevents the user from mistakenly navigating away from the page.
 *
 * @warn Only block navigation when user has made changes to the form (interacted with the page)
 */
export const useBlockNavigation = (shouldBlock: boolean, message: string) => {
	const blocker = useBlocker(shouldBlock);
	const { state, reset, proceed, location } = blocker;
	const toastIdRef = useRef<ReturnType<typeof toast>>(undefined);
	useEffect(() => void toast.dismiss(toastIdRef.current), []);

	if (state === "blocked") {
		toastIdRef.current = toast.warning(message, {
			description: (
				<div className="flex justify-between items-center w-full">
					<Button
						variant={"destructive"}
						onClick={() => {
							proceed();
							toast.dismiss(toastIdRef.current);
						}}>
						Leave
					</Button>

					<Button
						className="button"
						onClick={() => {
							reset();
							toast.dismiss(toastIdRef.current);
						}}>
						Stay
					</Button>
				</div>
			),
			onDismiss: reset,
			duration: 10 * 1000, // 10 secs
			id: location.pathname,
			position: "top-center", //test
		});
	}

	// handle hard-reloads or cross-origin navigations
	useEffect(() => {
		const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
			// Recommended
			event.preventDefault();

			// Included for legacy support, e.g. Chrome/Edge < 119
			event.returnValue = true;
		};

		const handleRemoveListener = () =>
			window.removeEventListener("beforeunload", beforeUnloadHandler);

		if (shouldBlock) {
			window.addEventListener("beforeunload", beforeUnloadHandler);
		} else {
			handleRemoveListener();
		}

		return handleRemoveListener;
	}, [shouldBlock]);
};
