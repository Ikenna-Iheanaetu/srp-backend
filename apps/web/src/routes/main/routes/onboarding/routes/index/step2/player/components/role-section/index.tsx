/** @format */

import { FormFieldErrorAndLabelWrapper } from "@/components/common/form/wrapper";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import JOB_TAXONOMY from "@/data/job-taxonomy.json";
import { useFormContext } from "react-hook-form";
import {
	PLAYER_MAX_SECONDARY_ROLES,
	PlayerStep2FormValues,
} from "../../form-schema";
import { JobTaxonomyDropdown } from "./job-taxonomy-dropdown";

export const PreferredJobRoleSection = () => {
	const form = useFormContext<PlayerStep2FormValues>();

	const primaryRole = form.watch("jobRole.primary");
	const secondaryRoles = form.watch("jobRole.secondary");

	return (
		<FormFieldErrorAndLabelWrapper
			control={form.control}
			path={"jobRole"}
			label={"Preferred Job Roles"}
			showError>
			<div className="pl-4">
				<FormField
					control={form.control}
					name={"jobRole.primary"}
					render={({ field }) => (
						<FormFieldErrorAndLabelWrapper
							control={form.control}
							path={"jobRole.primary"}
							label={
								<span className="text-slate-700">
									Primary Role
								</span>
							}
							showError={true}>
							<FormItem>
								<FormControl>
									<JobTaxonomyDropdown
										data={JOB_TAXONOMY}
										variant="single-select"
										placeholder="Select your primary role"
										searchPlaceholder="Search for a role..."
										selectedPath={field.value}
										onSelectPath={(path) =>
											field.onChange(path ?? "")
										}
										excludedPaths={secondaryRoles}
									/>
								</FormControl>
							</FormItem>
						</FormFieldErrorAndLabelWrapper>
					)}
				/>

				<FormField
					control={form.control}
					name={"jobRole.secondary"}
					render={({ field }) => (
						<FormFieldErrorAndLabelWrapper
							control={form.control}
							path={"jobRole.secondary"}
							label={
								<span className="text-slate-700">
									Secondary Roles
								</span>
							}
							showError={true}>
							<FormItem>
								<FormControl>
									<JobTaxonomyDropdown
										data={JOB_TAXONOMY}
										variant="multi-select"
										placeholder="Select secondary roles (optional)"
										searchPlaceholder="Search for additional roles..."
										selectedPaths={field.value}
										onSelectPaths={field.onChange}
										excludedPaths={
											primaryRole ? [primaryRole] : []
										}
										maxSelections={
											PLAYER_MAX_SECONDARY_ROLES
										}
									/>
								</FormControl>
							</FormItem>
						</FormFieldErrorAndLabelWrapper>
					)}
				/>
			</div>
		</FormFieldErrorAndLabelWrapper>
	);
};
