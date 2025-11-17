/** @format */

import { TreePath } from "@/lib/helper-functions/generic-string-helpers";
import { EmploymentType } from "@/lib/schemas/work-experience";
import { JobActiveStatus } from "../../jobs/constants";

// For the job posting schema
export interface JobPosting {
	id: string;
	title: string;
	createdAt: string;
	status: JobActiveStatus;
	department: string;
	type: EmploymentType;
	description: string;
	responsibilities: string[];
	qualifications: string[];
	skills: string[];
	traits: string[];
	startDate: string;
	salary: {
		max: number;
		min: number;
		currency: string;
	};
	location: string;
	visibility: boolean;
	targetClubs?: string[];
	openToAll: boolean;
	targetSpecificClubs: boolean;
	preferredClubs: string[];
	tags?: string[];
	applicants: number; // Array of applicants for each job posting
	role: TreePath;
}

export type TimeInterval = "12 months" | "30 days" | "7 days" | "24 hours";

export interface FilterOption {
	label: string;
	value: string;
}
