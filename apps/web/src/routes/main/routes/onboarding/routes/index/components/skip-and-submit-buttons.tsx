/** @format */

import { LinkButton } from "@/components/common/link-btn";
import LoadingIndicator from "@/components/common/loading-indicator";
import { Button, ButtonProps } from "@/components/ui/button";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { runInDevOnly } from "@/lib/helper-functions/run-only-in-dev-mode";
import { cn } from "@/lib/utils";
import { AllowedProfileUserTypeSchema } from "@/routes/main/routes/profile/schemas";
import { useQuery } from "@tanstack/react-query";
import { FC, useCallback, useMemo } from "react";
import { href } from "react-router";
import { profileQueries } from "../../../../profile/query-factory";
import { useProgressTrackingContext } from "../progress-state-tracking-provider";

const useStepInfo = () => {
	const progressState = useProgressTrackingContext();
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: AllowedProfileUserTypeSchema.options,
	});
	const userType = cookies.userType;
	const { data: profile } = useQuery(profileQueries.byUserType(userType));
	const onboardingSteps = useMemo(
		() => profile?.onboardingSteps ?? [],
		[profile?.onboardingSteps]
	);

	return useMemo(
		() => ({
			...progressState,
			userType,
			onboardingSteps,
		}),
		[progressState, userType, onboardingSteps]
	);
};

const useSkipStep = () => {
	const { setCurrentStepIndex, onboardingSteps } = useStepInfo();

	const handleSkipStep = useCallback(() => {
		setCurrentStepIndex((prev) =>
			Math.min(prev + 1, onboardingSteps.length - 1)
		);
	}, [onboardingSteps.length, setCurrentStepIndex]);

	return handleSkipStep;
};

const usePrevStep = () => {
	const { setCurrentStepIndex } = useStepInfo();

	const handlePrevStep = useCallback(() => {
		setCurrentStepIndex((prev) => Math.max(0, prev - 1));
	}, [setCurrentStepIndex]);

	return handlePrevStep;
};

interface SaveBtnProps {
	isSubmitting: boolean;
	disabled?: boolean;
	className?: string;
}

const SaveBtn: FC<SaveBtnProps> = ({
	className,
	isSubmitting,
	disabled,
	...props
}) => {
	return (
		<Button
			type="submit"
			className={cn("button", className)}
			disabled={isSubmitting || disabled}
			aria-label="Save and proceed"
			{...props}>
			{isSubmitting ? <LoadingIndicator /> : "Save"}
		</Button>
	);
};

const NavButton: FC<ButtonProps> = ({ className, ...otherProps }) => {
	return (
		<Button
			{...otherProps}
			type="button"
			className={cn(
				"bg-white hover:bg-blue-700 text-black hover:text-white",
				className
			)}
		/>
	);
};

const SkipBtn: FC<{ className?: string }> = ({ className }) => {
	const handleSkipStep = useSkipStep();
	const { currentStepIndex, onboardingSteps } = useStepInfo();
	const isLastStep = currentStepIndex >= onboardingSteps.length - 1;

	if (isLastStep) {
		return (
			<LinkButton to={href("/profile")} variant={"secondary"}>
				Profile
			</LinkButton>
		);
	}

	return (
		<NavButton
			onClick={handleSkipStep}
			aria-label={"Skip this step"}
			className={cn(className)}>
			Skip
		</NavButton>
	);
};

const PrevBtn: FC<{ className?: string }> = ({ className }) => {
	const handlePrevStep = usePrevStep();
	const { currentStepIndex } = useStepInfo();
	const isFirstStep = currentStepIndex <= 0;

	if (isFirstStep) {
		return null;
	}

	return (
		<NavButton
			onClick={handlePrevStep}
			className={cn(className)}
			aria-label={"Return to previous step"}>
			Back
		</NavButton>
	);
};

interface RootProps {
	saveBtnProps: SaveBtnProps;
	className?: string;
}

const SkipAndSaveButtons: FC<RootProps> = ({ saveBtnProps, className }) => {
	const btnStyles = "w-24";

	return (
		<div
			ref={(node) => {
				runInDevOnly(() => {
					if (!node) {
						return;
					}

					const closestFormEl = node.closest("form");
					if (!closestFormEl) {
						throw new Error(
							"SkipAndSaveButtons should be used inside a form."
						);
					}
				});
			}}
			className={cn(
				"sticky bottom-0 right-0 w-full flex gap-2 justify-between pr-2",
				className
			)}>
			<PrevBtn className={btnStyles} />

			<div className="flex-1 flex gap-2 justify-end">
				<SkipBtn className={btnStyles} />
				<SaveBtn className={btnStyles} {...saveBtnProps} />
			</div>
		</div>
	);
};

export default SkipAndSaveButtons;
