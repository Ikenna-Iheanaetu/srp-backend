/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import { matchQueryStatus } from "@/lib/helper-functions/async-status-render-helpers";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { href, Navigate, redirect } from "react-router";
import { toast } from "sonner";
import { CompanyProfileDisplay } from "../profile/company/profile-display";
import { PlayerOrSupporterProfileDisplay } from "../profile/player/profile-display";
import { Route } from "./+types/route";
import { entityProfileQueries } from "./query-factory";
import { EntityProfileParamsSchema } from "./schemas";

const truncate = (input: string, max = 15) => {
	if (input.length > max) {
		return `${input.slice(0, max)}...`;
	}

	return input;
};

export const clientLoader = ({ params }: Route.ClientLoaderArgs) => {
	const valResult = EntityProfileParamsSchema.safeParse(params);
	if (!valResult.success) {
		toast.error("Invalid URL", {
			description: `Matched entity type "${truncate(
				params.userType,
			)} is unknown.`,
			id: `unknown-entity` + params.id + params.userType,
		});
		return redirect(href("/dashboard"));
	}

	return valResult.data;
};

const EntityProfileRoute = ({ loaderData: params }: Route.ComponentProps) => {
	// TODO: Remove the commented out admin introduced logic if confirmed a single query can work for both.
	/* const location = useLocation(); */
	/* const isAdminViewingUnApprovedUser =
		isEntityLocationState(location.state) &&
		location.state.isAdminViewUnApprovedUser;

	const adminViewUnApprovedUserQuery = useQuery({
		...entityProfileQueries.adminViewUnapprovedUser(params),
		enabled: isAdminViewingUnApprovedUser,
	}); */
	const normalEntityQuery = useQuery({
		...entityProfileQueries.byUserType(params),
		/* enabled: !isAdminViewingUnApprovedUser, */
	});

	/* const query = isAdminViewingUnApprovedUser
		? adminViewUnApprovedUserQuery
		: normalEntityQuery; */

	return matchQueryStatus(normalEntityQuery, {
		Loading: <LoadingIndicator />,
		Errored: (error) => <p>{getErrorMessage(error)}</p>,
		Empty: (
			<p className="text-red-500">
				Invalid response recieved after fetching user data. Please
				reload the page to try again.
			</p>
		),
		Success: ({ data }) => {
			switch (data.userType) {
				case "supporter":
				case "player":
					return (
						<PlayerOrSupporterProfileDisplay
							isEntityView
							data={data}
						/>
					);

				case "company":
					return <CompanyProfileDisplay data={data} isEntityView />;

				default: {
					toast.error(`Unknown entity.`);
					return <Navigate to={href("/dashboard")} replace />;
				}
			}
		},
	});
};

export default EntityProfileRoute;
