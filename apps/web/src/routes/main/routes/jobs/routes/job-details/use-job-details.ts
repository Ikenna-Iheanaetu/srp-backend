/** @format */
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { jobsQueries } from "../../query-factory";

export const useJobDetails = () => {
	const { id } = useParams();
	return useQuery({ ...jobsQueries.detail(id!), enabled: !!id });
};
