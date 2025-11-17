/** @format */

import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { getErrorMessage } from "@/lib/utils";
import { AllowedSignupUserTypeSchema } from "@/routes/auth/signup/routes/signup-form/form-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { profileQueries } from "../../../profile/query-factory";
import { BaseUserProfile } from "../../../profile/types";
import { checkHasRemainingSteps } from "../../utils";
import { useProgressTrackingContext } from "./progress-state-tracking-provider";

/** Adds `step` to passed in `FormData`
 * * Should align with `BaseUserProfile` type.
 */
interface OnboardingFormDataWithStep extends FormData {
	step: `${number}`;
}

/** Type for the server's response: an array of remaining step numbers */
type RemainingSteps = BaseUserProfile["onboardingSteps"];

interface ServerSuccessResponse {
	data: Pick<BaseUserProfile, "onboardingSteps">;
}

const useSubmitWithProgress = () => {
	const [progress, setProgress] = useState(0);

	const submitStep = useCallback(
		async <TFormData extends OnboardingFormDataWithStep>(
			formData: TFormData,
			abortSignal: AbortSignal,
		) => {
			const response = await apiAxiosInstance.put<ServerSuccessResponse>(
				"/profile",
				formData,
				{
					onUploadProgress: (event) => {
						setProgress(() =>
							event.total
								? Math.round((event.loaded * 100) / event.total)
								: event.loaded,
						);
					},
					signal: abortSignal,
				},
			);
			return response.data;
		},
		[],
	);

	return useMemo(
		() => ({ submitStep, progress, setProgress }),
		[progress, submitStep],
	);
};

const useSubmitOnboardingStep = <TFormData extends FormData>() => {
	const abortControllerRef = useRef<AbortController | null>(null);
	const { submitStep, progress, setProgress } = useSubmitWithProgress();
	const { currentStepIndex } = useProgressTrackingContext();
	const queryClient = useQueryClient();
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: AllowedSignupUserTypeSchema.options,
	});
	const userType = cookies.userType;

	const { data: userProfile } = useQuery({
		...profileQueries.byUserType(userType),
		enabled: !!userType,
	});
	//   console.log("the user profile", userProfile);

	const remainingSteps = userProfile?.onboardingSteps ?? [];

	const mutation = useMutation<RemainingSteps, AxiosError, TFormData>({
		mutationFn: async (passedInFormData) => {
			abortControllerRef.current = new AbortController();

			if (!checkHasRemainingSteps(remainingSteps)) {
				throw new Error("No remaining steps to submit.");
			}

			passedInFormData.append(
				"step",
				String(remainingSteps[currentStepIndex]),
			);
			const formDataWithStep =
				passedInFormData as unknown as OnboardingFormDataWithStep;

			const response = await submitStep(
				formDataWithStep,
				abortControllerRef.current.signal,
			);

			return response.data.onboardingSteps;
		},
		onError: (error) => {
			if (error.name === "AbortError") {
				toast.info("Form submission cancelled");
				return;
			}
			toast.error(getErrorMessage(error));
		},
		onSuccess: (updatedRemainingSteps) => {
			queryClient.setQueryData(
				profileQueries.byUserType(userType).queryKey,
				(prev) => {
					if (!prev) return prev; // If no previous data, do nothing
					return {
						...prev,
						onboardingSteps: updatedRemainingSteps,
					};
				},
			);
		},
		onSettled: () => (abortControllerRef.current = null),
		meta: {
			errorMessage: "none",
		},
	});

	const { reset: internalReset } = mutation;

	const reset = useCallback(() => {
		abortControllerRef.current?.abort();
		internalReset();
		setProgress(0);
	}, [internalReset, setProgress]);

	useEffect(() => {
		return () => reset();
	}, [reset]);

	return { ...mutation, progress, abortControllerRef, reset };
};

export default useSubmitOnboardingStep;
