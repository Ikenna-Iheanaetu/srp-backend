/** @format */

import { BadgeItemsList } from "@/components/common/badge-list";
import { getCurrencyByCode } from "@/components/common/form/currencies-picker";
import { getPathDominantItem } from "@/lib/helper-functions/generic-string-helpers";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import React from "react";
import { CompanyProfileData } from "../../../../profile/company/use-fetch-profile";
import { NewJobFormData } from "../form-schema";
import { JobHeroBanner, JobHeroBannerProps } from "./job-hero-banner";

interface SectionComponentProps {
	children: React.ReactNode;
	className?: string;
}

const Section: React.FC<SectionComponentProps> = ({ children, className }) => (
	<section className={cn("space-y-2", className)}>{children}</section>
);

const SectionHeading: React.FC<SectionComponentProps> = ({
	children,
	className,
}) => (
	<h2 className={cn("text-xl font-bold capitalize", className)}>
		{children}
	</h2>
);

const SectionParagraph: React.FC<SectionComponentProps> = ({
	children,
	className,
}) => <p className={cn("text-gray-600", className)}>{children}</p>;

interface PreviewNewJobProps extends Pick<JobHeroBannerProps, "onViewCompany"> {
	job: NewJobFormData & {
		company: Pick<CompanyProfileData, "name" | "about">;
	};
	className?: string;
}
export const PreviewJob: React.FC<PreviewNewJobProps> = ({
	job: data,
	className,
	onViewCompany,
}) => {
	return (
		<div className={cn("w-full mx-auto", className)}>
			<JobHeroBanner
				jobTitle={data.title}
				employmentType={data.type}
				jobLocation={data.location}
				company={data.company}
				startDate={data.startDate}
				onViewCompany={onViewCompany}
			/>

			<div className="px-6 py-8 space-y-6">
				<Section>
					<SectionHeading>About the company</SectionHeading>
					<SectionParagraph>
						{data.company.about ?? "Not specified"}
					</SectionParagraph>
				</Section>

				<Section>
					<SectionHeading>Description</SectionHeading>
					<SectionParagraph>{data.description}</SectionParagraph>
				</Section>

				<Section>
					<SectionHeading>Role</SectionHeading>
					<SectionParagraph>
						{getPathDominantItem(data.role)}
					</SectionParagraph>
				</Section>

				<Section>
					<SectionHeading>Job Responsibilities</SectionHeading>
					<ul className="list-disc pl-4 space-y-1">
						{data.responsibilities.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</Section>

				<Section>
					<SectionHeading>
						Qualifications &amp; Requirements
					</SectionHeading>
					<BadgeItemsList items={data.qualifications} />
				</Section>

				<Section>
					<SectionHeading>Skills &amp; Traits Section</SectionHeading>
					<div className="space-y-3">
						<div>
							<h3 className="text-sm font-medium">
								Required Skills:
							</h3>
							<BadgeItemsList items={data.skills} />
						</div>

						<div>
							<h3 className="text-sm font-medium">
								Preferred Traits:
							</h3>
							<BadgeItemsList items={data.traits} />
						</div>
					</div>
				</Section>

				<Section>
					<SectionHeading>Salary Section</SectionHeading>
					<SectionParagraph>
						Salary Range:{" "}
						{`${getCurrencyByCode(data.salary.currency)?.symbol}${
							data.salary.min
						}`}{" "}
						-{" "}
						{`${getCurrencyByCode(data.salary.currency)?.symbol}${
							data.salary.max
						}`}{" "}
						yearly.
					</SectionParagraph>
				</Section>

				<Section>
					<SectionHeading>Application Start Date</SectionHeading>
					<SectionParagraph>
						{dayjs(data.startDate).format("MMMM DD, YYYY")}
					</SectionParagraph>
				</Section>

				<Section>
					<SectionHeading>Application End Date</SectionHeading>
					<SectionParagraph>
						{dayjs(data.endDate).format("MMMM DD, YYYY")}
					</SectionParagraph>
				</Section>

				<Section>
					<SectionHeading>Who Can Apply?</SectionHeading>
					<SectionParagraph>
						{data.openToAll
							? "Open to all candidates"
							: "Not open to all candidates"}
					</SectionParagraph>
				</Section>

				<Section>
					<SectionHeading>Tags</SectionHeading>
					{data.tags?.length ? (
						<BadgeItemsList items={data.tags} />
					) : (
						<SectionParagraph>No tags</SectionParagraph>
					)}
				</Section>
			</div>
		</div>
	);
};
