/** @format */
import { UserType } from "@/lib/schemas/user";
import {
	Briefcase,
	ClipboardList,
	LayoutDashboard,
	LucideIcon,
	Receipt,
	Search,
	Shirt,
	UserCircle,
	UserPlus,
	Users,
} from "lucide-react";
import { href } from "react-router";

interface SidebarNavLInk {
	title: string;
	url: string;
	icon: LucideIcon;
}

export const sharedSidebarNavLinks = [
	{
		title: "Dashboard",
		url: href("/dashboard"),
		icon: LayoutDashboard,
	},
] satisfies SidebarNavLInk[];

const insertAfterDashboard = (list: SidebarNavLInk[]) =>
	sharedSidebarNavLinks.toSpliced(1, 0, ...list);

// Company-Specific Items
const companyNavLinks = insertAfterDashboard([
	{
		title: "Profile",
		url: href("/profile"),
		icon: UserCircle,
	},
	{
		title: "Job Management",
		url: href("/job-management"),
		icon: Briefcase,
	},
	{
		title: "Recruiting",
		url: href("/recruiting"),
		icon: Users,
	},
]);

// Player-Specific Items
const playerNavLinks = insertAfterDashboard([
	{
		title: "Profile",
		url: href("/profile"),
		icon: UserCircle,
	},
	{
		title: "Jobs Tracking",
		url: href("/jobs/tracking"),
		icon: Briefcase,
	},
	{
		title: "Job Search",
		url: href("/jobs/search"),
		icon: Search,
	},
]);

const clubNavLinks = insertAfterDashboard([
	{
		title: "Profile",
		url: href("/profile"),
		icon: UserCircle,
	},
	{
		title: "Affiliate Management",
		url: href("/affiliate-management"),
		icon: Briefcase,
	},
	{
		title: "Revenue Management",
		url: href("/revenue-management"),
		icon: Briefcase,
	},
]);

const adminNavLinks = [
	{
		title: "Dashboard",
		url: href("/dashboard"),
		icon: LayoutDashboard,
	},
	{
		title: "Company Management",
		url: href("/company-management"),
		icon: Briefcase,
	},
	{
		title: "Club Management",
		url: href("/club-management"),
		icon: Shirt,
	},
	{
		title: "Request Management",
		url: href("/request-management"),
		icon: ClipboardList,
	},
	{
		title: "Affiliate Management",
		url: href("/affiliate-management"),
		icon: Briefcase,
	},
	{
		title: "Invoice Management",
		url: href("/invoice-management"),
		icon: Receipt,
	},
	{
		title: "Invite Management",
		url: href("/invite-management"),
		icon: UserPlus,
	},
] satisfies SidebarNavLInk[];

export const sidebarNavLinks = {
	player: playerNavLinks,
	supporter: playerNavLinks,
	company: companyNavLinks,
	club: clubNavLinks,
	admin: adminNavLinks,
} satisfies Record<UserType, SidebarNavLInk[]>;
