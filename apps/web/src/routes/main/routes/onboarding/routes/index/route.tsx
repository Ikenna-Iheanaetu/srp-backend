/** @format */

import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { matchQueryStatus } from "@/lib/helper-functions/async-status-render-helpers";
import { getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { href, Navigate } from "react-router";
import { profileQueries } from "../../../profile/query-factory";
import { AllowedProfileUserTypeSchema } from "../../../profile/schemas";
import {
	checkHasRemainingSteps,
	checkIncludesQuestionnaire,
} from "../../utils";
import { FormSkeletonLoader } from "./components/skeleton-loader";
import StepProgressBar from "./components/step-progress-bar";
import { ProgressTrackingContext } from "./progress-state-tracking-provider";
import { stepComponentsMap } from "./step-components-map";
import { useInitializeProgressTracker } from "./use-initialize-progress-tracker";

/**
 * Automatically renders the appropriate step component for a user based on the
 * current step number.
 * * To add or modify a step for any user, kindly interact with
 * {@link stepComponentsMap} to add or change steps for any user type, and rendering
 * is handled automatically by this component and `{@link UserComponentByType}`.
 */
export default function OnboardingStepsIndexRoute() {
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: AllowedProfileUserTypeSchema.options,
	});
	const userType = cookies.userType;

	const progressTrackingProvider = useInitializeProgressTracker();
	const { currentStepIndex } = progressTrackingProvider;

	const query = useQuery(profileQueries.byUserType(userType));

	return matchQueryStatus(query, {
		Loading: <FormSkeletonLoader />,
		Errored: (error) => (
			<p className="text-red-500">Error: {getErrorMessage(error)}</p>
		),
		Empty: <p>No data available</p>,
		Success: (query) => {
			const userProfile = query.data;

			const hasRemainingSteps = checkHasRemainingSteps(
				userProfile?.onboardingSteps,
			);

			if (!hasRemainingSteps) {
				return (
					<Navigate
						to={href(
							checkIncludesQuestionnaire(userProfile)
								? "/onboarding/questionnaire"
								: "/onboarding/completed",
						)}
						replace
					/>
				);
			}

			return (
				<ProgressTrackingContext value={progressTrackingProvider}>
					<StepProgressBar />

					<div className="flex flex-col gap-2">
						<h1 className="text-3xl font-bold text-slate-900">
							Complete your Profile
						</h1>
						<p className="text-gray-700">
							Please provide all required details to complete
							registration.
						</p>
					</div>

					<div className="w-full flex-1 overflow-auto tw-scrollbar *:h-full">
						{(() => {
							if (!userProfile.onboardingSteps) return;
							const activeStep =
								userProfile.onboardingSteps[currentStepIndex];

							if (activeStep) {
								const StepComponent =
									stepComponentsMap[activeStep];

								return StepComponent;
							}
						})()}
					</div>
				</ProgressTrackingContext>
			);
		},
	});
}
