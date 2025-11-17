/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { FC } from "react";
import dayjs from "dayjs";
import { UserNotification } from "@/routes/main/routes/notifications/table/columns";

interface Props {
	notification: UserNotification;
	isSelected: boolean;
	onToggleSelect: () => void;
}

export const NotificationCardItem: FC<Props> = ({
	notification,
	isSelected,
	onToggleSelect,
}) => {
	const { title, message, createdAt } = notification;
	const formattedTime = dayjs(createdAt).fromNow();

	return (
		<Card
			className={cn(
				"relative p-2 shadow-none border-none max-w-[95%]",
				isSelected && "!bg-lime-400 !bg-opacity-50"
			)}>
			<CardContent className="text-sm flex gap-2 items-start p-0">
				<div className="flex-1">
					{title && <p className="font-medium">{title}</p>}
					<p>{message}</p>
					<p className="text-xs text-slate-500 mt-1">
						{formattedTime}
					</p>
				</div>

				<Checkbox
					className="mt-1 border border-gray-200 data-[state=checked]:bg-blue-700 [&_svg]:!text-white"
					checked={isSelected}
					onCheckedChange={() => onToggleSelect()}
				/>
			</CardContent>
		</Card>
	);
};
