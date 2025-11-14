/** @format */

import { GlobalQueryClient } from "@/root";
import { companyManagementQueries } from "../query-factory";
import { Route } from "./+types/route";
import { CompaniesDataTable } from "./hires-table/data-table";
import { useQuery } from "@tanstack/react-query";
import { href, redirect, useParams } from "react-router";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";

export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
	try {
		/* await */ GlobalQueryClient.ensureQueryData(
			companyManagementQueries.companyHires({ companyId: params.id })
		);
	} catch (error) {
		toast.error("Couldn't fetch hires", {
			id: "admin-company-hires-loader-error" + params.id,
			description: getApiErrorMessage(error),
			position: "top-center",
		});
		return redirect(href("/recruiting/shortlisted"));
	}
};

const CompanyManagementIndexRoute = () => {
	const { id: companyId } = useParams();

	const { data } = useQuery(
		companyManagementQueries.companyHires({ companyId: companyId! })
	);

	const companyName = data?.title ?? "Loading...";

	return (
		<div className="space-y-4">
			<h1 className="font-semibold">{companyName}</h1>
			<CompaniesDataTable />
		</div>
	);
};

export default CompanyManagementIndexRoute;
