/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { UserType } from "@/lib/schemas/user";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import React from "react";
import { href } from "react-router";

interface ProfileLinkButtonProps {
	userName: string;
	userId: string;
	children: React.ReactNode;
}

export const ProfileLinkButton: React.FC<ProfileLinkButtonProps> = ({
	userId,
	userName,
	children,
}) => {
	const profileLink = href("/:userType/:id", {
		userType: "company" satisfies UserType,
		id: userId,
	});
	return (
		<LinkButton
			prefetch="intent"
			to={profileLink}
			variant={"outline"}
			state={
				{
					crumbs: [
						{
							path: href("/jobs/companies"),
							label: "Companies",
						},
						{
							path: profileLink,
							label: userName,
						},
					],
				} satisfies CrumbsLocationState
			}>
			{children}
		</LinkButton>
	);
};
