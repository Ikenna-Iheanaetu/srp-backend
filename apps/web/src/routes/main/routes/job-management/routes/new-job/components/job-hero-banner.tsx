/** @format */

import { Button } from "@/components/ui/button";
import { EmploymentType } from "@/lib/schemas/work-experience";
import { replaceUnderscoresWithSpaces } from "@/lib/utils";
import { CompanyProfileData } from "@/routes/main/routes/profile/company/use-fetch-profile";
import dayjs from "dayjs";

export interface JobHeroBannerProps {
	employmentType: EmploymentType;
	jobLocation: string;
	company: Pick<CompanyProfileData, "name" | "about">;
	startDate: string;
	jobTitle: string;
	onViewCompany: () => void;
}

export const JobHeroBanner: React.FC<JobHeroBannerProps> = ({
	employmentType,
	jobLocation,
	company,
	startDate,
	jobTitle,
	onViewCompany,
}) => {
	return (
		<div className="bg-slate-100 px-6 py-8 space-y-4">
			<h2 className="text-2xl font-bold capitalize text-center">
				{jobTitle}
			</h2>

			<div className="flex items-center justify-center gap-2 text-sm">
				<span className="capitalize">
					{replaceUnderscoresWithSpaces(employmentType)}
				</span>
				<span className="text-gray-300">|</span>
				<span>{jobLocation}</span>
				<span className="text-gray-300">|</span>
				<Button
					onClick={onViewCompany}
					variant={"link"}
					className="text-blue-700">
					{company.name}
				</Button>
				<span className="text-gray-300">|</span>
				<span>{dayjs(startDate).format("MMMM DD, YYYY")}</span>
			</div>
		</div>
	);
};
