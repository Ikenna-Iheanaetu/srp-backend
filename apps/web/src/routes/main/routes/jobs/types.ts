/** @format */

import { NewJobFormData } from "../job-management/routes/new-job/form-schema";
import { CompanyProfileData } from "../profile/company/use-fetch-profile";
import { JobActiveStatus, JobApplicationStatus } from "./constants";

export interface BaseJob extends NewJobFormData {
	id: string;
	company: Pick<
		CompanyProfileData,
		"id" | "name" | "address" | "about" | "avatar"
	>;
	createdAt: string;
	appliedDate?: string;
	status: JobActiveStatus;
	applicationStatus: JobApplicationStatus;
	match: number;
	clubType: string;
	isBookmarked: boolean;
	applicationDeadline?: { date: string; description: string };
}
