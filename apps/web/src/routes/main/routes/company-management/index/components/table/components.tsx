/** @format */

import { CriticalActionConfirmationDialog } from "@/components/common/critical-action-confirmation-dialog";
import { TableActionButton } from "@/components/common/data-table/action-button";
import { TruncatedTextCell } from "@/components/common/data-table/truncated-text-cell";
import { LinkButton } from "@/components/common/link-btn";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { EntityProfileParams } from "@/routes/main/routes/entity/schemas";
import React, { FC } from "react";
import { href, useLocation } from "react-router";
import { useDeleteCompany } from "./hooks/use-delete-company";
import { Company } from "./types";

export const DeleteCompanyButton: FC<{
	company: Company;
}> = ({ company }) => {
	const { mutate: deleteCompany, isPending } = useDeleteCompany();
	const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

	return (
		<>
			<TableActionButton
				onClick={() => setIsConfirmingDelete(true)}
				className="table-action-red"
				disabled={isPending}>
				Delete
			</TableActionButton>

			<CriticalActionConfirmationDialog
				open={isConfirmingDelete}
				onOpenChange={setIsConfirmingDelete}
				title="Delete Company"
				description={`Are you sure you want to delete the company "${company.name}"? This will permanently delete all associated data and cannot be undone.`}
				confirmText="delete"
				confirmButtonText="Delete"
				onConfirm={() => deleteCompany(company)}
			/>
		</>
	);
};

export const ViewProfileButton: React.FC<{ company: Company }> = ({
	company,
}) => {
	const location = useLocation();
	return (
		<LinkButton
			variant={"link"}
			to={href("/:userType/:id", {
				id: company.id,
				userType: "company",
			} satisfies EntityProfileParams)}
			state={
				{
					crumbs: [
						{
							to: location,
							label: "Company management",
						},
						{
							label: `Company, ${company.name}`,
						},
					],
				} satisfies CrumbsLocationState
			}>
			<TruncatedTextCell value={company.name} />
		</LinkButton>
	);
};

export const ViewHiredButton: React.FC<{ company: Company }> = ({
	company,
}) => {
	const location = useLocation();

	return (
		<LinkButton
			disableDefaultStyles
			to={href("/company-management/:id", {
				id: company.id,
			})}
			state={
				{
					crumbs: [
						{
							to: location,
							label: "Company management",
						},
						{ label: `Hired, ${company.name}` },
					],
				} satisfies CrumbsLocationState
			}
			className="table-action-green">
			View Hired
		</LinkButton>
	);
};
