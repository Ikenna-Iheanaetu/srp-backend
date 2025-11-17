/** @format */

import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { cn } from "@/lib/utils";
import { AllowedProfileUserTypeSchema } from "@/routes/main/routes/profile/schemas";
import { useQuery } from "@tanstack/react-query";
import React, { FC } from "react";
import { Link } from "react-router";
import { profileQueries } from "../../../../profile/query-factory";
import { useProgressTrackingContext } from "../progress-state-tracking-provider";

interface CrumbProps {
	step: number;
}

const Crumb: FC<CrumbProps> = ({ step }) => {
	const { currentStepIndex, setCurrentStepIndex } =
		useProgressTrackingContext();
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: AllowedProfileUserTypeSchema.options,
	});
	const userType = cookies.userType;
	const { data: profileData } = useQuery(profileQueries.byUserType(userType));

	const onboardingSteps = profileData?.onboardingSteps ?? [];
	const isActive = onboardingSteps.indexOf(step) === currentStepIndex;

	return (
		<Link
			to="#"
			onClick={() => setCurrentStepIndex(onboardingSteps.indexOf(step))}
			className={cn(
				"inline-block bg-gray-200 w-12 h-1 rounded-full hover:bg-blue-700/50 transition-colors",
				isActive && "bg-blue-700"
			)}
		/>
	);
};

interface Props extends React.ComponentProps<"div"> {
	className?: string;
}

const StepProgressBar: FC<Props> = ({ className }) => {
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: AllowedProfileUserTypeSchema.options,
	});
	const userType = cookies.userType;
	const { data: userProfile } = useQuery({
		...profileQueries.byUserType(userType),
		enabled: !!userType,
	});

	return (
		<div className={cn(className, "flex justify-between gap-2 w-fit h-2")}>
			{userProfile?.onboardingSteps?.map((step) => (
				<Crumb key={step} step={step} />
			))}
		</div>
	);
};

export default StepProgressBar;
