/** @format */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import React from "react";
import { ChatStatus } from "../../../../types";

interface ChatStatusAlertProps {
	title: string;
	description?: string;
	status: SafeExtract<
		ChatStatus,
		"PENDING" | "DECLINED" | "ENDED" | "EXPIRED"
	>;
	className?: string;
}

export const ChatStatusAlert: React.FC<ChatStatusAlertProps> = ({
	title,
	description,
	className,
	status,
}) => {
	return (
		<Alert
			className={cn(
				"w-full rounded-2xl border border-dashed p-3 text-center text-sm",

				{
					"border-amber-200 bg-amber-100 text-amber-700":
						status === "PENDING",
					"border-red-200 bg-red-100 text-red-700":
						status === "DECLINED",
					"border-slate-200 bg-slate-100 text-slate-700":
						status === "ENDED" || status === "EXPIRED",
				},
				className,
			)}>
			<AlertTitle>{title}</AlertTitle>
			{typeof description === "string" && (
				<AlertDescription>{description}</AlertDescription>
			)}
		</Alert>
	);
};
