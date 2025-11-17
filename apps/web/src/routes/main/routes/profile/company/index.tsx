/** @format */

import LoadingIndicator from "@/components/common/loading-indicator";
import { FC } from "react";
import { CompanyProfileDisplay } from "./profile-display";
import { useCompanyProfile } from "./use-fetch-profile";
import { matchQueryStatus } from "@/lib/helper-functions/async-status-render-helpers";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";

const CompanyProfilePage: FC = () => {
	const query = useCompanyProfile();

	return matchQueryStatus(query, {
		Loading: <LoadingIndicator />,
		Errored: (err) => (
			<div className="text-red-500">
				<p>Error occured fetching entity data:</p>
				<p>{getApiErrorMessage(err)}</p>
			</div>
		),
		Empty: (
			<p className="text-red-500">
				Invalid response recieved after fetching user data. Please
				reload the page to try again.
			</p>
		),
		Success: ({ data }) => (
			<CompanyProfileDisplay data={data} isEntityView={false} />
		),
	});
};

export default CompanyProfilePage;
