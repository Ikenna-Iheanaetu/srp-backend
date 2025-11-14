/** @format */

import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { UserType } from "@/lib/schemas/user";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { href, useNavigate } from "react-router";
import { profileQueries } from "../../../profile/query-factory";
import {
	AllowedProfileUserType,
	AllowedProfileUserTypeSchema,
} from "../../../profile/schemas";
import { BaseUserProfile } from "../../../profile/types";
import { checkHasRemainingSteps } from "../../utils";

/**@deprecated 
 * Use the `useAuthStatus({userTypesToAssert: AllowedProfileUserTypeSchema.options})` option.
 * @example
 * ```ts
 * const { cookies: { userType } } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: AllowedProfileUserTypeSchema.options,
	});
    ```
 * */
export function assertIsAllowedProfileUser(
	userType: UserType,
): asserts userType is AllowedProfileUserType {
	AllowedProfileUserTypeSchema.parse(userType);
}

/**
 * * Tracks onboarding progress on the frontend, using server-provided remaining steps.
 *
 * * Manages the current step index for display. Users can't revisit completed steps, and skipping is allowed.
 *
 * * When all steps are completed, `remainingOnboardingSteps`
 * is empty, and `currentStepIndex` is set to -1.
 *
 * * New `currentStepIndex` is calculated as `${Math.min
 * (currentStepIndex, remainingOnboardingSteps.length - 1)}` after a step
 * is completed, or `${currentStepIndex + 1}` when skipped.
 *
 */
export interface OnboardingProgress {
	/**
	 * Server-provided array of remaining step numbers that are still not completed.
	 * @See {@link RemainingOnboardingSteps} for details.
	 */
	remainingSteps: BaseUserProfile["onboardingSteps"];

	/**
	 * Index in `remainingSteps` of the current step being shown (0-based).
	 * Used by the frontend to determine the step to display; adjusts when steps are completed
	 * by taking the minimum of its current value or `remainingOnboardingSteps.length - 1`
	 * using `Math.min`. Set to -1 when all steps are completed (i.e., `remainingOnboardingSteps`
	 * is empty). Increments by 1 when a step is skipped, if within bounds.
	 * @example 0 // Points to step 1 in [1, 2, 3]
	 * @example 1 // Points to step 3 in [2, 3] after skipping step 2
	 * @example -1 // When remainingOnboardingSteps is [], indicating all steps are done
	 * @example ```ts
	 * Math.min(1, [2].length - 1) // After completing step 1 in [1, 2], adjusts from 1 to 0
	 * ```
	 */
	currentStepIndex: number;
}

/**
 * Clamps a number within array indices
 * @param index - The index to clamp
 * @param array - The array to clamp against
 * @returns The clamped index between 0 and array.length - 1
 */
const clampIndexToArrayIndices = (index: number, array: unknown[]) => {
	return Math.min(Math.max(0, index), Math.max(0, array.length - 1));
};

/**
 * Tracks onboarding progress on the frontend using server-provided remaining steps from the user profile.
 * Manages only the current step index locally. Users can't revisit completed steps, and skipping is allowed.
 *
 * - When all steps are completed, `userProfile.onboardingSteps` is empty, and `currentStepIndex` is set to -1.
 * - After a step is completed, `currentStepIndex` is adjusted to `Math.min(currentStepIndex, onboardingSteps.length - 1)`.
 * - Skipping increments `currentStepIndex` by 1, handled via the skip button.
 */
export const useInitializeProgressTracker = () => {
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: AllowedProfileUserTypeSchema.options,
	});

	const userType = cookies.userType;
	const { data: userProfile } = useQuery({
		...profileQueries.byUserType(userType),
		enabled: !!userType,
	});

	const remainingSteps = useMemo(
		() => userProfile?.onboardingSteps ?? [],
		[userProfile?.onboardingSteps],
	);

	const [currentStepIndex, setCurrentStepIndex] = useState(0);

	const navigate = useNavigate();
	const isOnboardingCompleted = !checkHasRemainingSteps(remainingSteps);

	// Redirect to ai questionnaire when onboarding is complete
	useEffect(() => {
		if (userProfile && isOnboardingCompleted) {
			void navigate(href("/onboarding/questionnaire"), { replace: true });
		}
	}, [isOnboardingCompleted, navigate, userProfile]);

	// Clamp currentStepIndex when remainingSteps changes (e.g., after a step is completed)
	useEffect(() => {
		if (isOnboardingCompleted) {
			setCurrentStepIndex(-1);
		} else {
			setCurrentStepIndex((prevIndex) =>
				clampIndexToArrayIndices(prevIndex, remainingSteps),
			);
		}
	}, [isOnboardingCompleted, remainingSteps]);

	return useMemo(
		() => ({
			currentStepIndex,
			setCurrentStepIndex,
			// Provide remainingSteps from profile for read-only access
			remainingSteps,
			isOnboardingCompleted,
		}),
		[currentStepIndex, remainingSteps, isOnboardingCompleted],
	);
};
