/** @format */

import apiAxiosInstance from "@/lib/axios-instance";
import { useMutation } from "@tanstack/react-query";
import { Answer } from "./types";
import { profileQueries } from "../../../profile/query-factory";

const handleSubmit = async (answers: Answer[]) => {
	await apiAxiosInstance.post("/answer", { answers });
};

export const useSubmitAnswers = () => {
	return useMutation({
		mutationKey:
			// invalidate profile cache through mutationCache.onSuccess
			profileQueries.all(),
		mutationFn: handleSubmit,
		meta: {
			errorMessage: "Error occurred submitting responses",
		},
	});
};
