/** @format */

import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { GlobalQueryClient } from "@/root";
import { useQuery } from "@tanstack/react-query";
import { href, redirect, useParams } from "react-router";
import { toast } from "sonner";
import { clubManagementQueries } from "../query-factory";
import { Route } from "./+types/route";
import { ClubsDataTable } from "./hires-table/data-table";

export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
	try {
		/* await */ GlobalQueryClient.ensureQueryData(
			clubManagementQueries.clubHires({ clubId: params.id })
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
		clubManagementQueries.clubHires({ clubId: companyId! })
	);

	const companyName = data?.title ?? "Loading...";

	return (
		<div className="space-y-4">
			<h1 className="font-semibold">{companyName}</h1>
			<ClubsDataTable />
		</div>
	);
};

export default CompanyManagementIndexRoute;
