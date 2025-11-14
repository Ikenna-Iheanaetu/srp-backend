/** @format */

import UserComponentByType, {
	LazyLoadedUserComponents,
} from "@/components/common/render-user-component-by-type";
import { restrictRouteByUserType } from "@/lib/helper-functions/route-loaders";
import { GlobalQueryClient } from "@/root";
import { lazy } from "react";
import { href, redirect } from "react-router";
import { profileQueries } from "../../../profile/query-factory";
import { checkHasRemainingSteps } from "../../utils";
import { ALLOWED_AI_QUESTIONNAIRE_USER_TYPES } from "./constants";
import { AllowedAIQuestionnaireUserType } from "./types";

/** TODO: Remove this when backend has prepared questionnaire functionality */
const HAS_BACKEND_PREPARED_QUESTIONNAIRE = false;

export const clientLoader = async () => {
	const { redirect: restrictionRedirect, authStatus } =
		restrictRouteByUserType({
			allowedUserTypes: ALLOWED_AI_QUESTIONNAIRE_USER_TYPES,
		});
	if (restrictionRedirect) return restrictionRedirect;

	if (authStatus.isAuthenticated) {
		const userType = authStatus.cookies.userType;
		const userProfile = await GlobalQueryClient.ensureQueryData(
			profileQueries.byUserType(userType)
		);

		const hasRemainingSteps = checkHasRemainingSteps(
			userProfile.onboardingSteps
		);
		// This check must come first before checking if the questionnaire is taken
		if (hasRemainingSteps) {
			return redirect(href("/onboarding"));
		}

		if (!HAS_BACKEND_PREPARED_QUESTIONNAIRE) {
			return redirect(href("/onboarding/completed"));
		}

		const isQuestionnaireTaken = userProfile.isQuestionnaireTaken;
		if (isQuestionnaireTaken) {
			return redirect(href("/onboarding/completed"));
		}
	}
};

const RandomQuestionnaire = lazy(() => import("./player"));
const CompanyQuestionnaire = lazy(() => import("./company"));

const componentsMap = {
	player: RandomQuestionnaire,
	supporter: RandomQuestionnaire,
	company: CompanyQuestionnaire,
} satisfies LazyLoadedUserComponents<AllowedAIQuestionnaireUserType>;

export default function AIQuestionnaireRoute() {
	return (
		<UserComponentByType
			componentsMap={componentsMap}
			suspenseFallback={null}
		/>
	);
}
