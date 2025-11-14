/** @format */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import {
	ErrorMessage,
	FieldValuesFromFieldErrors,
} from "@hookform/error-message";
import { Slot } from "@radix-ui/react-slot";
import { AlertCircleIcon } from "lucide-react";
import React from "react";
import {
	ArrayPath,
	Control,
	FieldErrors,
	FieldName,
	FieldValues,
	Path,
	useFormContext,
} from "react-hook-form";
import { href } from "react-router";
import { ClassNameValue } from "tailwind-merge";
import { CopyToClipboardButton } from "../copy-to-clipboard-button";
import { LinkButton } from "../link-btn";

// Safe JSON.stringify function that handles circular references
const safeStringify = (obj: unknown, maxDepth = 3): string => {
	const seen = new WeakSet();

	function replacer(_key: string, value: unknown, depth = 0): unknown {
		if (depth > maxDepth) {
			return "[Max Depth Reached]";
		}

		if (value === null) return null;
		if (typeof value !== "object") return value;

		if (seen.has(value)) {
			return "[Circular Reference]";
		}

		seen.add(value);

		if (Array.isArray(value)) {
			return value.map((item, index) =>
				replacer(String(index), item, depth + 1),
			);
		}

		const result: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			result[k] = replacer(k, v, depth + 1);
		}

		return result;
	}

	try {
		return JSON.stringify(replacer("", obj), null, 2);
	} catch (error) {
		return `Error serializing object: ${error instanceof Error ? error.message : String(error)}`;
	}
};

// Extract readable parts from any error structure
const extractReadableErrorInfo = (
	error: unknown,
	maxItems = 3,
): {
	readableParts: string[];
	rawError: string;
} => {
	const rawError = safeStringify(error);
	const readableParts: string[] = [];

	// Helper function to extract known readable info from an object
	const extractKnownFromObject = (
		obj: Record<string, unknown>,
		prefix = "",
	): void => {
		if (readableParts.length >= maxItems) return;

		const prefixStr = prefix ? `${prefix}: ` : "";

		// Most important error properties first
		const readableProps = [
			{ key: "message", label: "Message" },
			{ key: "reason", label: "Reason" },
			{ key: "details", label: "Details" },
			{ key: "type", label: "Type" },
			{ key: "code", label: "Code" },
			{ key: "hint", label: "Hint" },
			{ key: "expected", label: "Expected" },
			{ key: "pattern", label: "Pattern" },
			{ key: "format", label: "Format" },
		] satisfies { key: string; label: string }[];

		readableProps.forEach(({ key, label }) => {
			if (readableParts.length >= maxItems) return;

			const value = obj[key];
			if (value != null && typeof value === "string" && value.trim()) {
				readableParts.push(`${prefixStr}${label}: ${value}`);
				return;
			}

			if (
				value != null &&
				(typeof value === "number" || typeof value === "boolean")
			) {
				readableParts.push(`${prefixStr}${label}: ${String(value)}`);
				return;
			}
		});
	};

	// Helper function to process the error
	function processError(err: unknown): void {
		if (readableParts.length >= maxItems) return;

		// Handle strings directly
		if (typeof err === "string" && err.trim()) {
			readableParts.push(err);
			return;
		}

		// Handle arrays (only first few items)
		if (Array.isArray(err)) {
			const itemsToProcess = Math.min(
				err.length,
				maxItems - readableParts.length,
			);
			for (let i = 0; i < itemsToProcess; i++) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const item = err[i];
				if (typeof item === "string" && item.trim()) {
					readableParts.push(item);
				} else if (item && typeof item === "object") {
					extractKnownFromObject(item as Record<string, unknown>);
				}
			}
			return;
		}

		// Handle objects
		if (err && typeof err === "object") {
			extractKnownFromObject(err as Record<string, unknown>);
			return;
		}

		// Handle primitives
		if (err !== null) {
			// eslint-disable-next-line @typescript-eslint/no-base-to-string
			readableParts.push(String(err));
		}
	}

	processError(error);

	// Remove duplicates and truncate long messages
	const uniqueReadableParts = Array.from(new Set(readableParts))
		.slice(0, maxItems)
		.map((part) =>
			part.length > 80 ? `${part.substring(0, 77)}...` : part,
		);

	return {
		readableParts: uniqueReadableParts,
		rawError,
	};
};

interface FormErrorFallbackProps {
	error: unknown;
	fieldLabel: React.ReactNode;
}

/**
 * Fallback component for when form validation errors exist but cannot be
 * parsed into displayable messages.
 */
const FormErrorFallback: React.FC<FormErrorFallbackProps> = ({
	error,
	fieldLabel,
}) => {
	const { readableParts, rawError } = extractReadableErrorInfo(error);

	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<Button
					type="button"
					variant={"link"}
					className="p-0 text-blue-700">
					View
				</Button>
			</HoverCardTrigger>

			<HoverCardContent
				onMouseDown={(e) => {
					// Stop closing onclick
					e.preventDefault();
					e.stopPropagation();
				}}
				asChild>
				<Alert
					variant="destructive"
					className="max-h-[80vh] overflow-y-auto border-0 text-red-500 tw-scrollbar">
					<AlertCircleIcon className="h-3 w-3" />
					<AlertTitle className="text-sm">
						Error Message Parsing Failed
					</AlertTitle>
					<AlertDescription className="space-y-2 text-xs">
						<p className="text-black">
							The &quot;{fieldLabel}&quot; field has a validation
							error, that couldn&apos;t be converted to a readable
							format.
						</p>

						{readableParts.length > 0 && (
							<div className="space-y-1">
								<p className="font-medium">
									Error information:
								</p>
								<ul className="ml-3 max-h-20 space-y-0.5 overflow-y-auto tw-scrollbar">
									{readableParts.map((part) => (
										<li
											key={part}
											className="list-disc text-xs">
											{part}
										</li>
									))}
								</ul>
							</div>
						)}

						<details className="group">
							<summary className="hover:text-foreground flex cursor-pointer items-center justify-between font-medium">
								Raw error data
								<CopyToClipboardButton
									clipboardItem={rawError}
								/>
							</summary>
							<pre className="bg-muted mt-1 max-h-24 overflow-auto whitespace-pre-wrap rounded p-2 text-[10px] tw-scrollbar">
								{rawError}
							</pre>
						</details>

						<p className="border-t pt-1 text-xs font-normal text-black">
							Try adjusting your input. If error persists, copy
							the error details above and{" "}
							<LinkButton
								variant={"link"}
								to={href("/contact-us")}
								className="p-0 text-xs font-normal">
								contact support
							</LinkButton>{" "}
							for assistance.
						</p>
					</AlertDescription>
				</Alert>
			</HoverCardContent>
		</HoverCard>
	);
};

interface Props<TForm extends FieldValues, TTransformedValues> {
	asChild?: boolean;
	/**For TypeScript to restrict values that can be passed in
	 * as `path`.
	 * * Not implemented in any runtime behaviour.
	 */
	control: Control<TForm, unknown, TTransformedValues>;
	path: Path<TForm> | ArrayPath<TForm>;
	className?: ClassNameValue;
	fieldLabel?: string;
}

/**Built on top of the `ErrorMessage` component from
 * React Hook Form.
 * * To be used inside a `FormProvider`
 */
const FormErrorMessage = <TForm extends FieldValues, TTransformedValues>({
	asChild,
	path,
	fieldLabel = path,
	className,
}: Props<TForm, TTransformedValues>) => {
	const form = useFormContext<TForm>();
	const errors = form.formState.errors;
	const fieldError = errors[path];

	const Comp = asChild ? Slot : "p";
	return (
		<ErrorMessage
			name={
				path as FieldName<
					FieldValuesFromFieldErrors<FieldErrors<TForm>>
				>
			}
			errors={errors}
			render={({ message }) => {
				// Check if message exists and is not empty (successful parsing)
				const hasValidMessage =
					message &&
					typeof message === "string" &&
					message.trim().length > 0;
				return (
					<Comp className={cn("form-error", className)}>
						{hasValidMessage ? (
							message
						) : (
							<span className="text-red-500">
								&quot;{fieldLabel}&quot; has an error (parsing
								failed).{" "}
								<FormErrorFallback
									error={fieldError}
									fieldLabel={fieldLabel}
								/>
							</span>
						)}
					</Comp>
				);
			}}
		/>
	);
};

export default FormErrorMessage;
