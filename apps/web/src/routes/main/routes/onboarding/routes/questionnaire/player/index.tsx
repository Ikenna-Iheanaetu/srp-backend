/** @format */

import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { matchQueryStatus } from "@/lib/helper-functions/async-status-render-helpers";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { useQuery } from "@tanstack/react-query";
import { ErrorDisplay } from "../components/error-display";
import { LoadingDisplay } from "../components/loading-display";
import { QuestionnaireWrapper } from "../components/questionnaire-wrapper";
import {
	NUM_OF_FIXED_PLAYER_QUESTIONS,
	questionnaireQueries,
} from "../query-factory";
import { useGsapQuestionTransition } from "../use-gsap-question-transition";
import { useSubmitAnswers } from "../use-submit-answer";

export default function RandomQuestionnaire() {
	useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: ["player", "supporter"],
	});

	const query = useQuery(
		// TODO: Fix this to access based on player/supporter
		// For now, player can serve for both
		questionnaireQueries.player()
	);

	// React Query: Submitting Answers
	const { mutate: submitAnswersMutation, isPending: isSubmitting } =
		useSubmitAnswers();

	const transitionsInstance = useGsapQuestionTransition({
		totalQuestions: query.data?.length ?? 0,
		initialIndex: 0,
		isSubmitting,
	});

	const handleRefetch = () => query.refetch();

	// --- Rendering based on state ---

	return matchQueryStatus(query, {
		Loading: <LoadingDisplay />,
		Errored: (fetchError) => (
			<ErrorDisplay
				heading="Failed to load questions"
				message={getApiErrorMessage(fetchError)}
				refetch={() => void handleRefetch()}
			/>
		),
		Empty: {
			condition: (query) => {
				const questions = query.data;
				return (
					!!questions &&
					questions.length < NUM_OF_FIXED_PLAYER_QUESTIONS
				);
			},
			component: (
				<ErrorDisplay
					heading="Data Error"
					message="Insufficient questions received. Couldn't process."
					iconClassName="text-orange-500"
					refetch={() => void handleRefetch()}
				/>
			),
		},
		Success: (query) => {
			const questions = query.data;
			return (
				<QuestionnaireWrapper
					transitionsInstance={transitionsInstance}
					heading="Random Questionnaire"
					questions={questions}
					isSubmitting={isSubmitting}
					onSubmitAnswers={submitAnswersMutation}
				/>
			);
		},
	});
}
