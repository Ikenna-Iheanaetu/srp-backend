/** @format */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "../ui/button";

interface ItemsListProps {
	items: string[];
	variant?: "default" | "secondary" | "outline";
	onRemove?: (item: string) => void;
	removable?: boolean;
	className?: string;
}

export function BadgeItemsList({
	items,
	variant = "secondary",
	className,
	removable = false,
	onRemove,
}: ItemsListProps) {
	return (
		<div className={cn("flex flex-wrap gap-2 capitalize", className)}>
			{items.map((item, index) => (
				<Badge
					key={`${item}-${index}`}
					variant={variant}
					className="flex items-center gap-1 rounded-full">
					<span>{item}</span>
					{removable && onRemove && (
						<Button
							type="button"
							variant={"ghost"}
							size={"icon"}
							onClick={() => onRemove(item)}
							className="ml-1 rounded-full"
							aria-label={`Remove ${item}`}>
							<X className="h-3 w-3" />
						</Button>
					)}
				</Badge>
			))}
		</div>
	);
}
