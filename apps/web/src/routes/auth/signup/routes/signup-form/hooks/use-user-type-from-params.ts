/** @format */

import { useParams } from "react-router";
import { getUserTypeFromParams } from "../utils";

/**Retrieves user type from route params and validates before returning. */
export const useUserTypeFromParams = () => {
	const params = useParams();
	const userType = getUserTypeFromParams(params);

	return { userType };
};
