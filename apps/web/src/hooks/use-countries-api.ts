/** @format */

import axios, { AxiosError } from "axios";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

export interface UseCountriesApiProps {
	urlParams?: {
		/** Fields to include in response (e.g., ["name", "capital", "population", "flags"]) */
		fields?: string[];
		/** Region to filter by (e.g., "africa", "asia") */
		region?: string;
		/** Country name to search (e.g., "brazil") */
		name?: string;
		/** Independence status ("true" for independent, "false" for non-independent) */
		status?: "true" | "false";
	};
}

interface Country {
	name: {
		common: string;
		official: string;
	};
	capital?: string[];
	population: number;
	flags: {
		png: string;
		svg: string;
		alt?: string;
	};
}

const apiClient = axios.create({
	baseURL: "https://restcountries.com/v3.1",
});

const fetchCountries = async ({
	urlParams,
}: UseCountriesApiProps = {}): Promise<Country[]> => {
	let endpoint = "/all";
	const params: Record<string, string> = {};

	if (urlParams?.fields) {
		params.fields = urlParams.fields.join(",");
	}
	if (urlParams?.status) {
		endpoint = "/independent";
		params.status = urlParams.status;
	}
	if (urlParams?.region) {
		endpoint = `/region/${urlParams.region}`;
	}
	if (urlParams?.name) {
		endpoint = `/name/${urlParams.name}`;
	}

	const response = await apiClient.get(endpoint, { params });
	return Array.isArray(response.data) ? response.data : [response.data];
};

/**
 *  Custom hook to fetch country data from REST Countries API (v3.1) using React Query.
 * - Fetches server-side based on urlParams.
 * - Caches indefinitely (staleTime: Infinity) due to static country data.
 * - Refetches only on query key change or manual refetch.
 *
 * @param {UseCountriesApiProps} [props] - Optional API request configuration.
 * @param {Object} [props.urlParams] - Parameters to filter the API request.
 * @param {string[]} [props.urlParams.fields] - Array of fields to include (e.g., ["name", "capital", "flags"]).
 * @param {string} [props.urlParams.region] - Region to filter (e.g., "europe"). Overrides status.
 * @param {string} [props.urlParams.name] - Country name to search (e.g., "brazil"). Overrides status and region.
 * @param {"true" | "false"} [props.urlParams.status] - Independence filter ("true" for independent). Applies only if region and name are absent.
 *
 * @returns {Object} React Query result object.
 *
 * @see {@link https://restcountries.com/#rest-countries}
 *
 * @example
 * ```typescript
 * import useCountriesApi from './useCountriesApi';
 *
 * const MyComponent: React.FC = () => {
 *     const { data, isLoading, error, refetch } = useCountriesApi({
 *         urlParams: {
 *             fields: ["name", "capital", "population", "flags"],
 *             region: "europe",
 *             status: "true"
 *         }
 *     });
 *
 *     if (isLoading) return <div>Loading...</div>;
 *     if (error) return <div>Error: {error.message}</div>;
 *
 *     return (
 *         <ul>
 *             {data?.map((country) => (
 *                 <li key={country.name.common}>
 *                     {country.name.common} - {country.capital?.[0]}
 *                     <img src={country.flags.png} alt={country.flags.alt} />
 *                 </li>
 *             ))}
 *         </ul>
 *     );
 * };
 * ```
 */
const useCountriesApi = ({
	urlParams,
}: UseCountriesApiProps): UseQueryResult<Country[], AxiosError> => {
	const queryKey = ["countries", urlParams];

	return useQuery<Country[], AxiosError>({
		queryKey,
		queryFn: () => fetchCountries({ urlParams }),
		staleTime: Infinity,
		gcTime: 1000 * 60 * 15, // 15 mins
	});
};

export default useCountriesApi;
