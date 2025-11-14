/** @format */

import { BookmarkButton } from "@/components/common/bookmark-btn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, MapPin } from "lucide-react";
import { type FC } from "react";

interface Props {
	jobTitle: string;
	jobLocation: string;
	companyLogo: string | undefined;
	isJobBookmarked: boolean;
	onToggleJobBookmark: () => void;
	onApplyToJob: () => void;
	className?: string;
}

export const JobCard: FC<Props> = ({
	jobTitle,
	jobLocation,
	companyLogo,
	isJobBookmarked,
	onToggleJobBookmark,
	onApplyToJob,
	className,
}) => {
	return (
		<Card
			className={cn(
				"elevated-on-hover p-[0.125rem] max-w-[320px] min-w-[286px]",
				className
			)}>
			<CardHeader>
				<CardTitle className="text-xl truncate">{jobTitle}</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-nowrap gap-2 justify-between items-center">
				<div className="flex gap-2 items-center text-slate-500">
					<MapPin />{" "}
					<p className="truncate max-w-[108px]">{jobLocation}</p>
				</div>

				{/* bookmark button and company logo */}
				<div className="flex items-center gap-2">
					<BookmarkButton
						isBookmarked={isJobBookmarked}
						onClick={onToggleJobBookmark}
					/>

					<Avatar>
						<AvatarImage src={companyLogo} alt="Company logo" />
						<AvatarFallback>
							<Building2 />
						</AvatarFallback>
					</Avatar>
				</div>
			</CardContent>

			<CardFooter className="w-full">
				<Button className="button w-full flex" onClick={onApplyToJob}>
					Apply now
				</Button>
			</CardFooter>
		</Card>
	);
};
