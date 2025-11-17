/** @format */

import {
	createSerializer,
	parseAsBoolean,
	parseAsString,
	useQueryStates,
	Values,
} from "nuqs";

const searchParams = {
	refCode: parseAsString,
	wasInvited: parseAsBoolean,
};

export type SignupSearchParams = NonNullableValues<Values<typeof searchParams>>;

export const serializeSignupParams = createSerializer(searchParams);

export const useSignupSearchParams = () => useQueryStates(searchParams);
