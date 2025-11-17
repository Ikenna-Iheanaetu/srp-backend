/** @format */

import { FormBadgeList } from "@/components/common/form/badge-list-field";
import {
	FormFileUpload,
	FormMultipleFileUpload,
} from "@/components/common/form/file-upload";
import FormSwitchToggle from "@/components/common/form/switch-toggle";
import { FormWorkExperiencesSection } from "@/components/common/form/work-experience-section";
import {
	FormFieldErrorAndLabelWrapper,
	FormProviderWrapper,
} from "@/components/common/form/wrapper";
import { appendFilesToFormData } from "@/lib/helper-functions/file-helpers";
import { usePlayerProfileData } from "@/routes/main/routes/profile/player/use-player-profile-data";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useForm } from "react-hook-form";
import SkipAndSaveButtons from "../../components/skip-and-submit-buttons";
import useSubmitOnboardingStep from "../../use-submit-step";
import { PlayerStep3FormSchema, PlayerStep3FormValues } from "./form-schema";

const PlayerStep3Form: FC = () => {
	const { data: profileData } = usePlayerProfileData();
	const form = useForm({
		resolver: zodResolver(PlayerStep3FormSchema),
		values: {
			resume: profileData?.resume,
			certifications: profileData?.certifications,
			experiences: profileData?.experiences,
			skills: profileData?.skills,
			traits: profileData?.traits,
			workAvailability: profileData?.workAvailability,
		},
	});

	const {
		control,
		formState: { isDirty },
	} = form;

	const { mutate, isPending: isSubmitting } = useSubmitOnboardingStep();

	const onSubmit = (data: PlayerStep3FormValues) => {
		const formData = new FormData();
		const transformedData = appendFilesToFormData({
			formData,
			obj: data,
			key: "certifications",
		});

		const keyValuePairs = Object.entries(transformedData);
		for (const [key, value] of keyValuePairs) {
			if (value instanceof File || typeof value === "string") {
				formData.append(key, value);
				continue;
			}
			formData.append(key, JSON.stringify(value));
		}

		mutate(formData);
	};

	return (
		<FormProviderWrapper form={form} onSubmit={onSubmit}>
			<FormFileUpload control={control} path="resume" label="Resume" />

			<FormMultipleFileUpload
				control={control}
				path="certifications"
				label="Certifications"
			/>

			<FormWorkExperiencesSection
				control={control}
				path="experiences"
				label="Work Experience"
			/>

			<FormBadgeList
				control={control}
				path="skills"
				label="Skills - (For exmapel excel, driving license)"
			/>

			<FormBadgeList control={control} path="traits" label="Traits" />

			<FormFieldErrorAndLabelWrapper
				control={control}
				path="workAvailability"
				label="Are you available for work?">
				<FormSwitchToggle
					control={control}
					path="workAvailability"
					rightLabel="Available for Work"
				/>
			</FormFieldErrorAndLabelWrapper>

			<SkipAndSaveButtons
				saveBtnProps={{
					isSubmitting,
					disabled: !isDirty,
				}}
			/>
		</FormProviderWrapper>
	);
};

export default PlayerStep3Form;
