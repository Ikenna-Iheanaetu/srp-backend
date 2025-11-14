/** @format */

import { matchQueryStatus } from "@/lib/helper-functions/async-status-render-helpers";
import { getApiErrorMessage } from "@/lib/helper-functions/get-api-error-message";
import { useQuery } from "@tanstack/react-query";
import { ErrorDisplay } from "../components/error-display";
import { LoadingDisplay } from "../components/loading-display";
import { QuestionnaireWrapper } from "../components/questionnaire-wrapper";
import { questionnaireQueries } from "../query-factory";
import { useGsapQuestionTransition } from "../use-gsap-question-transition";
import { useSubmitAnswers } from "../use-submit-answer";

export default function CompanyQuestionnaire() {
	const query = useQuery(questionnaireQueries.company());

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
		Empty: (
			<ErrorDisplay
				heading="Data Error"
				message="Insufficient questions received. Couldn't process."
				iconClassName="text-orange-500"
				refetch={() => void handleRefetch()}
			/>
		),
		Success: (query) => {
			const questions = query.data;
			return (
				<QuestionnaireWrapper
					transitionsInstance={transitionsInstance}
					heading="Company Questionnaire"
					questions={questions}
					isSubmitting={isSubmitting}
					onSubmitAnswers={submitAnswersMutation}
				/>
			);
		},
	});
}
