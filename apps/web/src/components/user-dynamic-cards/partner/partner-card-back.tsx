/** @format */

import { Button } from "@/components/ui/button";
import { getPathDominantItem } from "@/lib/helper-functions/generic-string-helpers";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";
import { CompanyCardProps } from ".";
import { FlipButton } from "../flip-button";
import { LogoBanner } from "../logo-banner";

export default function CompanyCardBack({
	flip,
	onMessage,
	companyData,
}: {
	flip: () => void;
	companyData: CompanyCardProps["companyData"];
	onMessage?: () => void;
}) {
	return (
		<div
			className="size-full max-w-sm rounded-2xl bg-blue-900 p-2 text-slate-50"
			style={{
				backgroundColor: companyData.club?.preferredColor,
			}}>
			{/* Main content area */}
			<div className="relative z-30 flex min-h-[400px] flex-col items-center rounded-xl border-b p-2 sm:min-h-[450px] md:min-h-[500px]">
				<h2 className="text-lg font-medium capitalize sm:text-xl">
					{companyData?.name}
				</h2>
				<p className="text-center text-sm capitalize text-slate-200 sm:text-base">
					{companyData.industry
						? getPathDominantItem(companyData.industry)
						: "--"}
				</p>

				{/* About Us Section */}
				<h3 className="z-20 mt-3 text-center text-sm font-semibold sm:text-base">
					About us
				</h3>
				<p className="mb-2 flex h-20 w-full items-center justify-center overflow-y-auto rounded-md bg-white p-1.5 text-center text-xs text-black sm:h-24 sm:p-2 sm:text-sm md:h-28">
					{companyData?.about}
				</p>

				{/* Job Openings Table */}
				<LogoBanner
					className="my-auto max-h-44 w-auto flex-1"
					logo={companyData.avatar}
					altText="Company logo"
				/>

				{/* Footer buttons - positioned absolutely at bottom */}
				<div className="absolute -bottom-8 left-0 z-20 flex w-full items-center justify-evenly py-3">
					{onMessage && (
						<Button
							onClick={onMessage}
							/* to={{
							pathname: href("/messages/new"),
							search: serializeNewChatSearchParams({
								recipientId: companyData.id,
							}),
						}} */
							variant={"secondary"}
							size="icon"
							className={cn("hover:bg-zinc-300")}>
							<Mail className="text-indigo-950" />
						</Button>
					)}

					<FlipButton flip={flip} panel="back" />

					<img
						src={companyData.avatar}
						alt="Company logo"
						width={32}
						height={32}
						className="h-9 w-9 rounded-full object-cover sm:h-11 sm:w-11"
					/>
				</div>
			</div>
		</div>
	);
}
