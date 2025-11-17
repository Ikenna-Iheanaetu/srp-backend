/**
 * eslint-disable react-refresh/only-export-components
 *
 * @format
 */

/** @format */

import UserComponentByType, {
	LazyLoadedUserComponents,
} from "@/components/common/render-user-component-by-type";
import { JSX, lazy } from "react";
import { AllowedProfileUserType } from "../../../profile/schemas.ts";
import { FormSkeletonLoader } from "./components/skeleton-loader.tsx";

const PlayerStep1Form = lazy(() => import("./step1/player/form.tsx"));
const CompanyStep1Form = lazy(() => import("./step1/company/form.tsx"));
const ClubStep1Form = lazy(() => import("./step1/club/form.tsx"));

// step 2
const PlayerStep2Form = lazy(() => import("./step2/player/form.tsx"));
const ClubStep2Form = lazy(() => import("./step2/club/form.tsx"));
const CompanyStep2Form = lazy(() => import("./step2/company/form.tsx"));

// step 3
const PlayerStep3Form = lazy(() => import("./step3/player/form.tsx"));

const ClubStep3Form = lazy(() => import("./step3/club/form.tsx"));

// step 4
const PlayerStep4Form = lazy(() => import("./step4/player/form.tsx"));

const UsersComponentsWithSuspenseFallback = ({
	componentsMap,
}: {
	componentsMap:
		| LazyLoadedUserComponents<AllowedProfileUserType>
		| LazyLoadedUserComponents<"player" | "supporter">;
}) => {
	return (
		<UserComponentByType
			componentsMap={componentsMap}
			suspenseFallback={<FormSkeletonLoader />}
		/>
	);
};

/**
 * * A centralized mapping of onboarding step numbers to their user-type-specific components.
 * * To add or modify a step for any user type, simply update this object. Rendering is automatically handled by the `{@link OnboardingStepsRoute}` and {@link UserComponentByType} components—no additional components or logic changes are needed.
 *
 * @example
 * To add Step 3 for any user type:
 * ```typescript
 * const stepComponentsMap = {
 *   ...existingSteps,
 *   3: <UserComponentByType componentsMap={{
 *     player: PlayerUserStep3,
 *     supporter: SupporterUserStep3
 *     club: ClubUserStep3,
 *     company: CompanyUserStep3,
 *
 *   }} />,
 * };
 * ```
 */
export const stepComponentsMap: Record<number, JSX.Element> = {
	1: (
		<UsersComponentsWithSuspenseFallback
			componentsMap={{
				player: PlayerStep1Form,
				supporter: PlayerStep1Form,
				company: CompanyStep1Form,
				club: ClubStep1Form,
			}}
		/>
	),
	2: (
		<UsersComponentsWithSuspenseFallback
			componentsMap={{
				player: PlayerStep2Form,
				supporter: PlayerStep2Form,
				company: CompanyStep2Form,
				club: ClubStep2Form,
			}}
		/>
	),
	3: (
		<UsersComponentsWithSuspenseFallback
			componentsMap={{
				player: PlayerStep3Form,
				supporter: PlayerStep3Form,
				club: ClubStep3Form,
			}}
		/>
	),
	4: (
		<UsersComponentsWithSuspenseFallback
			componentsMap={{
				player: PlayerStep4Form,
				supporter: PlayerStep4Form,
			}}
		/>
	),
};
