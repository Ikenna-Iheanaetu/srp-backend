/** @format */

import { LinkButton } from "@/components/common/link-btn";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getJobActiveStatusStyles } from "@/lib/helper-functions/get-job-active-status-styles";
import { getJobApplicationStatusStyles } from "@/lib/helper-functions/get-job-application-status-styles-styles";
import { cn, replaceUnderscoresWithSpaces } from "@/lib/utils";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { EntityRequestParams } from "@/routes/main/routes/entity/query-factory";
import {
	JobActiveStatus,
	JobApplicationStatus,
} from "@/routes/main/routes/jobs/constants";
import dayjs from "dayjs";
import { FC } from "react";
import { href } from "react-router";

interface JobDetailsModalProps {
	jobId: string;
	jobActiveStatus: JobActiveStatus;
	jobApplicationStatus: JobApplicationStatus;
	jobTitle: string;
	jobDescription: string;
	jobMatchPercent: number;
	jobLocation: string;
	jobPostedDate: string;
	jobAppliedDate?: string;
	companyName: string;
	onClose?: () => void;
}

export const JobDetailsModal: FC<JobDetailsModalProps> = ({
	jobId,
	jobActiveStatus,
	jobApplicationStatus,
	jobTitle,
	jobDescription,
	jobLocation,
	jobPostedDate,
	jobAppliedDate,
	companyName,
	onClose,
}) => {
	return (
		<Dialog
			defaultOpen
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					onClose?.();
				}
			}}>
			<DialogContent>
				<DialogHeader className="flex flex-col items-start">
					<LinkButton
						variant={"link"}
						to={href("/jobs/:id", { id: jobId })}
						state={
							{
								crumbs: [
									{
										path: href("/jobs"),
										label: "Jobs search",
									},
									{
										path: href("/jobs/:id", { id: jobId }),
										label: jobTitle,
									},
								],
							} satisfies CrumbsLocationState
						}>
						View job page
					</LinkButton>

					<div className="flex flex-col gap-4">
						<div className="flex gap-2 items-center">
							<LinkButton
								variant={"link"}
								className="font-bold text-lg"
								to={href("/:userType/:id", {
									id: jobId,
									userType: "company",
								} satisfies EntityRequestParams)}>
								{companyName}
							</LinkButton>

							<div
								className={cn(
									getJobActiveStatusStyles(jobActiveStatus)
								)}>
								{jobActiveStatus}
							</div>
						</div>

						<DialogTitle className="text-left">
							{jobTitle}
						</DialogTitle>
						<DialogDescription className="sr-only">
							Summary details about the job, {jobTitle}.
						</DialogDescription>
					</div>
				</DialogHeader>

				{/* middle section */}
				<div className="flex flex-col gap-4">
					<DialogDescription className="text-left">
						{jobDescription}
					</DialogDescription>

					{/* dates and other status details */}
					<div className="flex flex-col sm:flex-row gap-4 text-sm">
						<ul className="flex flex-col gap-2 uppercase">
							{[
								{
									label: "Date posted",
									date: jobPostedDate,
								},

								{
									label: "Application date",
									date: jobAppliedDate,
								},
							].map((item, index) => (
								<li key={index} className="flex gap-2">
									<strong>{item.label}</strong>
									<span
										className={cn({
											"before:content-['---']":
												!item.date,
										})}>
										{item.date &&
											dayjs(item.date).format("DD-MM-YY")}
									</span>
								</li>
							))}
						</ul>

						<div className="flex flex-col gap-2 capitalize">
							<div className="flex gap-2">
								<strong>Location</strong>
								<span>{jobLocation}</span>
							</div>

							<div className="flex gap-2">
								<strong>Application status</strong>
								<div
									className={cn(
										getJobApplicationStatusStyles(
											jobApplicationStatus
										)
									)}>
									{replaceUnderscoresWithSpaces(
										jobApplicationStatus
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* footer */}
				<DialogFooter className="flex flex-col md:flex-row gap-4 justify-between">
					{/* We don't support match percent feature for now */}
					{/* <div className="flex gap-2 items-center">
						<AnimatedColorProgress
							value={0}
							className="opacity-50 cursor-not-allowed"
						/>{" "}
						<span className="capitalize">match</span>
					</div> */}

					{jobApplicationStatus !== "applied" && (
						<DialogClose asChild>
							<LinkButton
								to={href("/jobs/apply/:id", { id: jobId })}
								state={
									{
										crumbs: [
											{
												path: href("/jobs"),
												label: "Jobs search",
											},
											{
												path: href("/jobs/apply/:id", {
													id: jobId,
												}),
												label: `Apply to ${jobTitle}`,
											},
										],
									} satisfies CrumbsLocationState
								}>
								Apply
							</LinkButton>
						</DialogClose>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
