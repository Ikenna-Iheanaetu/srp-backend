/** @format */

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@repo/shared";
import { LucideIcon, LucideProps } from "lucide-react";

const TopSidebarMenuItem = ({
	className,
	...props
}: React.ComponentProps<typeof SidebarMenuItem>) => (
	<SidebarMenuItem
		{...props}
		className={cn("flex flex-col gap-2", className)}
	/>
);

const TopSidebarMenuButton = ({
	className,
	...props
}: React.ComponentProps<typeof SidebarMenuButton>) => (
	<SidebarMenuButton {...props} className={cn("font-semibold", className)} />
);

const TopSidebarMenuIcon = ({
	Icon,
	className,
	...props
}: { Icon: LucideIcon } & LucideProps) => (
	<Icon {...props} className={cn("text-slate-500", className)} />
);

const TopSidebarMenuLabel = ({
	className,
	...props
}: React.ComponentProps<"span">) => (
	<span {...props} className={cn("text-base", className)} />
);

export {
	TopSidebarMenuItem,
	TopSidebarMenuButton,
	TopSidebarMenuIcon,
	TopSidebarMenuLabel,
};
