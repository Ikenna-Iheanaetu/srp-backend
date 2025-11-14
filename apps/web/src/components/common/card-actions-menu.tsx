/** @format */

import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EllipsisVertical } from "lucide-react";
import { FC, Fragment, ReactNode } from "react";

interface CardActionsMenuProps {
	label?: string;
	items: ReactNode[];
	className?: string;
	/**
	 * If true, renders items directly without dropdown menu
	 * Useful for single action buttons
	 */
	renderDirect?: boolean;
}

const CardActionsMenu: FC<CardActionsMenuProps> = ({
	label,
	items,
	className,
	renderDirect = false,
}) => {
	// If renderDirect is true, render items directly
	if (renderDirect) {
		return (
			<div className={cn("absolute bottom-4 right-4 z-10", className)}>
				{items[0]}
			</div>
		);
	}

	// Otherwise, render dropdown menu
	return (
		<div className={cn("absolute top-4 right-2 z-10", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger>
					<EllipsisVertical  className="text-gray-400"/>
				</DropdownMenuTrigger>

				<DropdownMenuContent className="bg-white shadow-md border border-gray-200 rounded-md">
					{label && (
						<>
							<DropdownMenuLabel>{label}</DropdownMenuLabel>
							<DropdownMenuSeparator />
						</>
					)}

					{/* menu items */}
					{items.map((item, index) => {
						return (
							<Fragment key={index}>
								<DropdownMenuItem className="justify-center">
									{item}
								</DropdownMenuItem>

								{index !== items.length - 1 && (
									<DropdownMenuSeparator />
								)}
							</Fragment>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export { CardActionsMenu };
export type { CardActionsMenuProps };
