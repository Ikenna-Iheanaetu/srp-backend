/** @format */
import { LinkButton } from "@/components/common/link-btn";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { SafeOmit } from "@/types";
import React from "react";
import { href } from "react-router";
import { ServerCandidateResponse } from "../query-factory";

interface ProfileLinkProps
	extends SafeOmit<
		React.ComponentProps<typeof LinkButton>,
		"variant" | "to" | "prefetch"
	> {
	candidate: ServerCandidateResponse;
}

export const ProfileLinkButton: React.FC<ProfileLinkProps> = ({
	candidate,
	...props
}) => {
	const profileLink = href("/:userType/:id", {
		userType: candidate.userType,
		id: candidate.id,
	});
	return (
		<LinkButton
			{...props}
			variant={"outline"}
			prefetch="intent"
			to={profileLink}
			state={
				{
					crumbs: [
						{
							path: href("/recruiting/search"),
							label: "Candidates search",
						},
						{
							path: profileLink,
							label: candidate.name,
						},
					],
				} satisfies CrumbsLocationState
			}>
			Profile
		</LinkButton>
	);
};
