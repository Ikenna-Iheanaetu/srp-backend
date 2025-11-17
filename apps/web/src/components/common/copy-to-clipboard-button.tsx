/** @format */
import { Button, ButtonProps } from "@/components/ui/button";
import { useMinimumLoadingDelay } from "@/hooks/use-throttle";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

type PrimitiveClipboardItem = string | ClipboardItem[];

type ClipboardCopyItem =
	| PrimitiveClipboardItem
	| (() => Promise<PrimitiveClipboardItem>);

type UnwrapClipboardItem<T extends ClipboardCopyItem> = T extends () => Promise<
	infer U
>
	? U
	: T;

interface CopyToClipboardButtonProps<
	TItem extends ClipboardCopyItem = ClipboardCopyItem,
> extends SafeOmit<ButtonProps, "onError" | "children" | "asChild"> {
	clipboardItem: TItem;
	onSuccess?: (clipboardItem: UnwrapClipboardItem<TItem>) => void;
	onError?: (error: unknown, clipboardItem: TItem) => void;
	/**Delay in milliseconds before the button copied state transitions back to false*/
	transitionDelay?: number;
	disableToast?: boolean;
	className?: string;
}

// Action types for our reducer
type Action =
	| { type: "START_COPY" }
	| { type: "COPY_SUCCESS" }
	| { type: "COPY_ERROR" }
	| { type: "RESET_COPIED" };

type CopiedState =
	| {
			isCopied: true;

			isPending: false;
	  }
	| {
			isCopied: false;

			isPending: boolean;
	  };

const actionMap = {
	START_COPY: { isCopied: false, isPending: true },
	COPY_SUCCESS: { isCopied: true, isPending: false },
	COPY_ERROR: { isCopied: false, isPending: false },
	RESET_COPIED: { isCopied: false, isPending: false },
} satisfies Record<Action["type"], CopiedState>;

// Reducer function
const copyReducer = (state: CopiedState, action: Action): CopiedState => {
	return actionMap[action.type] ?? state;
};

const CopyToClipboardButton = <
	TItem extends ClipboardCopyItem = ClipboardCopyItem,
>({
	clipboardItem,
	onSuccess,
	onError,
	transitionDelay = 2000,
	disableToast = false,
	className,
	...props
}: CopyToClipboardButtonProps<TItem>) => {
	const [state, dispatch] = React.useReducer(copyReducer, {
		isCopied: false,
		isPending: false,
	});

	const timeoutIdRef = React.useRef<NodeJS.Timeout | null>(null);

	const handleClearTimeout = () => {
		if (timeoutIdRef.current) {
			clearTimeout(timeoutIdRef.current);
			timeoutIdRef.current = null;
		}
	};

	React.useEffect(() => {
		return handleClearTimeout; // Clear timeout on unmount
	}, []);

	const handleCopy = async () => {
		handleClearTimeout();
		dispatch({ type: "START_COPY" });

		try {
			const clipboardCopyItem = (
				typeof clipboardItem === "function"
					? await clipboardItem()
					: clipboardItem
			) satisfies PrimitiveClipboardItem;

			if (typeof clipboardCopyItem === "string") {
				await navigator.clipboard.writeText(clipboardCopyItem);
			} else {
				await navigator.clipboard.write(clipboardCopyItem);
			}

			dispatch({ type: "COPY_SUCCESS" });
			timeoutIdRef.current = setTimeout(() => {
				dispatch({ type: "RESET_COPIED" });
			}, transitionDelay);
			onSuccess?.(clipboardCopyItem as UnwrapClipboardItem<TItem>);
		} catch (error) {
			dispatch({ type: "COPY_ERROR" });
			handleClearTimeout();
			if (!disableToast) {
				toast.error("Failed to copy item to clipboard", {
					description: getApiErrorMessage(error),
					id: "clipboard-copy-error" + JSON.stringify(clipboardItem),
				});
			}
			onError?.(error, clipboardItem);
		}
	};

	const isCopying = useMinimumLoadingDelay(
		!state.isCopied && state.isPending
	);

	return (
		<Button
			type="button"
			variant={"ghost"}
			size="sm"
			disabled={isCopying}
			{...props}
			onClick={(e) => {
				void handleCopy();
				props.onClick?.(e);
			}}
			className={cn(isCopying && "animate-pulse", className)}>
			{isCopying ? (
				<>
					<CopyIcon className="h-3 w-3 mr-1" />
					Copying...
				</>
			) : state.isCopied ? (
				<>
					<CheckIcon className="h-3 w-3 mr-1" />
					Copied
				</>
			) : (
				<>
					<CopyIcon className="h-3 w-3 mr-1" />
					Copy
				</>
			)}
		</Button>
	);
};

export { CopyToClipboardButton };
export type { CopyToClipboardButtonProps };
