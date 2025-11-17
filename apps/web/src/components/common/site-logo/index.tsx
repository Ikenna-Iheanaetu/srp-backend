/** @format */

import { BRAND_NAME } from "@/constants/brand";
import { cn } from "@/lib/utils";
import { FC } from "react";
import { Link } from "react-router";
import { ClassNameValue } from "tailwind-merge";

interface Props {
	classNames?: Partial<{
		root: ClassNameValue;
		icon: ClassNameValue;
		logoText: ClassNameValue;
	}>;
	iconPath?: string;
	/**
	 * @default light
	 */
	variant?: "dark" | "light";
}

/**
 * Renders site's logo with variants options.
 * * It's wrapped in a Link - React router component
 */
const SiteLogo: FC<Props> = ({
	classNames = {
		root: "",
		icon: "",
		logoText: "",
	},
	iconPath,
	variant = "light",
}) => {
	return (
		<Link
			to="/"
			className={cn(
				"flex justify-center items-center gap-2 w-fit",
				classNames.root
			)}>
			<img
				src={`/assets/images/${
					variant === "dark"
						? "site-logo-dark.png"
						: iconPath ?? "site-logo.png"
				}`}
				className={cn("size-10", classNames.icon)}
			/>

			{/* background: linear-gradient(218.9deg, #504AC2 3.19%, #27245E 84.45%, #26235C 102.22%); */}
			<span
				className={cn(
					"text-transparent font-medium text-lg whitespace-nowrap tracking-tighter bg-clip-text",
					variant === "dark" && "text-black",
					classNames.logoText
				)}
				style={{
					background:
						"linear-gradient(218.9deg, #504AC2 3.19%, #27245E 84.45%, #26235C 102.22%)",
					backgroundClip: "text",
				}}>
				{BRAND_NAME}
			</span>
		</Link>
	);
};

export default SiteLogo;
