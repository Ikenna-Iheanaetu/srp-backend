/** @format */

import { AvatarPicker } from "@/components/common/form/avatar-picker";
import { FormColorInput } from "@/components/common/form/color-input";
import { FormInput } from "@/components/common/form/input";
import { FormRegionsSelect } from "@/components/common/form/regions-select";
import { FormSportsCategorySelect } from "@/components/common/form/sports-category-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClubAddressSectioin } from "@/routes/main/routes/onboarding/routes/index/step1/club/address-section";
import { profileQueries } from "@/routes/main/routes/profile/query-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import OnWindowFormActionButtons from "../../../on-window-form-action-buttons";
import { useSubmitProfileSettings } from "../use-submit-profile-settings";
import { ProfileEditForm, ProfileEditSchema } from "./form-schema";
import {
	getDirtyValues,
	normalizeFileFields,
} from "@/lib/helper-functions/forms";

const ClubProfileSettings: FC = () => {
	const { data: profile } = useQuery(profileQueries.byUserType("club"));

	const formMethods = useForm({
		resolver: zodResolver(ProfileEditSchema),
		values: {
			...profile,
			...profile?.socials,
		},
	});

	const { handleSubmit, formState, register, control, watch } = formMethods;

	const { errors, dirtyFields } = formState;

	const { mutate, isPending: isSubmitting } = useSubmitProfileSettings();

	const onSubmit = (data: ProfileEditForm) => {
		const formData = new FormData();

		const updated = getDirtyValues(dirtyFields, data);
		const formatted = normalizeFileFields(updated, ["avatar", "banner"]);
		Object.entries(formatted).forEach(([key, value]) => {
			if (value === undefined) return;
			if (value instanceof File || typeof value === "string") {
				formData.append(key, value);
				return;
			}
			formData.append(key, JSON.stringify(value));
		});

		mutate(formData);
	};

	return (
		<FormProvider {...formMethods}>
			<div>
				<form
					onSubmit={(event) => void handleSubmit(onSubmit)(event)}
					className="flex flex-col gap-12 *:relative *:flex *:flex-col *:gap-2 sm:*:w-[min(80%,800px)] [&>*:first-child]:mb-16 [&_input]:bg-gray-100 [&_textarea]:bg-gray-100">
					<AvatarPicker
						control={control}
						path="avatar"
						label="Avatar"
					/>
					<AvatarPicker
						control={control}
						variant="banner"
						path="banner"
						label="Banner"
					/>

					<div>
						<Label htmlFor="name">Club Name</Label>
						<Input
							{...register("name")}
							type="text"
							required
							className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
						/>
						{errors.name && (
							<p className="form-error">{errors.name.message}</p>
						)}
					</div>

					<div>
						<Label htmlFor="about">About</Label>
						<Textarea
							{...register("about")}
							rows={5}
							maxLength={200}
							className="tw-scrollbar"
						/>
						<div className="mt-1 text-sm text-gray-500">
							{watch("about")?.length ?? 0}/200 characters
						</div>
						{errors.about && (
							<p className="form-error">{errors.about.message}</p>
						)}
					</div>

					<FormSportsCategorySelect
						control={formMethods.control}
						path="category"
					/>

					<FormColorInput
						control={formMethods.control}
						path="preferredColor"
						label="Preferred color"
					/>

					<ClubAddressSectioin />

					<FormRegionsSelect
						control={control}
						path="region"
						label="Region"
					/>

					<FormInput
						control={control}
						path="phone"
						label="Phone Number"
					/>

					<div>
						<Label htmlFor="website">Website</Label>
						<Input
							{...register("website")}
							type="url"
							placeholder="https://www.example.com"
							className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
						/>
						{errors.website && (
							<p className="form-error">
								{errors.website.message}
							</p>
						)}
					</div>

					<FormInput
						control={control}
						path="socials.facebook"
						label="Facebook"
						type="url"
						placeholder="https://facebook.com/your-page"
						className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
					/>

					<FormInput
						control={control}
						path="socials.instagram"
						label="Instagram"
						type="url"
						placeholder="https://instagram.com/your-page"
						className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
					/>

					<FormInput
						control={control}
						path="socials.twitter"
						label="Twitter (X)"
						type="url"
						placeholder="https://twitter.com/your-page"
						className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
					/>

					{/* form action buttons */}
					<OnWindowFormActionButtons
						submitBtnProps={{
							isSubmitting,
						}}
					/>
				</form>

				<div className="mt-8 flex flex-col items-center justify-between gap-4">
					<span className="sr-only font-medium">Hidden elements</span>
					<img
						src="/assets/images/settings/stripped-slanted-bars.svg"
						alt="An illustration showing hidden sections"
					/>
				</div>
			</div>
		</FormProvider>
	);
};

export default ClubProfileSettings;
