/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import React from "react";
import { href } from "react-router";

interface JobsLinkButtonProps {
	companyId: string;
	companyName: string;
	children: React.ReactNode;
}

export const JobsLinkButton: React.FC<JobsLinkButtonProps> = ({
	companyId,
	companyName,
	children,
}) => {
	const jobsLink = href("/jobs/companies/:id", {
		id: companyId,
	});
	return (
		<LinkButton
			to={jobsLink}
			state={
				{
					crumbs: [
						{
							path: href("/jobs/companies"),
							label: "Companies search",
						},
						{
							path: jobsLink,
							label: companyName,
						},
					],
				} satisfies CrumbsLocationState
			}>
			{children}
		</LinkButton>
	);
};
