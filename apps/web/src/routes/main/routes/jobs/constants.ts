/** @format */

export const JOB_APPLICATION_STATUSES = [
	"not_applied",
	"applied",
	"under_review",
	"shortlisted",
	"rejected",
] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

export const JOB_ACTIVE_STATUSES = ["active", "draft"] as const;
export type JobActiveStatus = (typeof JOB_ACTIVE_STATUSES)[number];
