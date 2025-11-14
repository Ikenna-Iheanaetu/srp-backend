/** @format */

import apiAxiosInstance from "@/lib/axios-instance";
import { QueryKey, queryOptions } from "@tanstack/react-query";
import { Question } from "./types";

const fetchCompanyQuestions = async () => {
	const response = await apiAxiosInstance.get<Question[]>("/questions");
	return response.data;
};

/* <-------------------- For player questions ----------------> */

export const NUM_OF_PLAYER_QUESTIONS = 12;
export const NUM_OF_FIXED_PLAYER_QUESTIONS = 8;

const checkIsQuestionsValid = (data: unknown): data is Question[] =>
	Array.isArray(data) && data.length >= NUM_OF_PLAYER_QUESTIONS;

const shuffleQuestions = (questions: Question[]): Question[] => {
	if (!checkIsQuestionsValid(questions)) {
		throw new Error("Attempt to process questions data failed.");
	}

	const fixedQuestions = questions.slice(0, NUM_OF_FIXED_PLAYER_QUESTIONS);

	const shuffledQuestionsPart = questions
		.slice(NUM_OF_FIXED_PLAYER_QUESTIONS)
		.sort(() => 0.5 - Math.random())
		.slice(0, NUM_OF_PLAYER_QUESTIONS - NUM_OF_FIXED_PLAYER_QUESTIONS); // Ensure the correct total number of questions

	return [...fixedQuestions, ...shuffledQuestionsPart];
};

const fetchPlayerQuestions = async () => {
	const response = await apiAxiosInstance.get<Question[]>("/questions");
	// transforming here because methods from queryClient instance
	// (ensureQueryData) ignore queryOptions.select, so we need to cache the
	// actual shuffled questions
	return shuffleQuestions(response.data);
};

const playerQueryOptions = <TQueryKey extends QueryKey>(queryKey: TQueryKey) =>
	queryOptions({
		queryKey,
		/**
		 * @warn Ensure this `queryFn` function has a stable reference (e.g., extracted or memoized).
		 * An unstable inline function will re-execute on every component re-render,
		 * even with cached data, thereby breaking our implementation of
		 * shuffling only once and would lead to a jarring UI.
		 */
		queryFn: fetchPlayerQuestions,
		staleTime: Infinity,
	});

/* <-------------------- End For player questions ----------------> */

/**
 * @debug Note on type error: Accessing `questionnaireQueries[userType]` might show a type incompatibility
 * for `queryKey`. See related issue: {@link https://github.com/TanStack/query/issues/9009}
 */
export const questionnaireQueries = {
	all: () => ["ai-questionnaire"] as const,
	player: () => {
		const queryKey = [...questionnaireQueries.all(), "player"] as const;
		return playerQueryOptions(queryKey);
	},
	supporter: () => {
		const queryKey = [...questionnaireQueries.all(), "supporter"] as const;
		return playerQueryOptions(queryKey);
	},
	company: () =>
		queryOptions({
			queryKey: [...questionnaireQueries.all(), "company"] as const,
			queryFn: fetchCompanyQuestions,
		}),
};
