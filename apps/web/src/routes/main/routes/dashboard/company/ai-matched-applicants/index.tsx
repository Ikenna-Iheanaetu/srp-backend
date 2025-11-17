/** @format */

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FC } from "react";

export interface AiMatchedApplicant {
	id: string;
	avatar: string;
	name: string;
	position: string;
}

interface Props {
	applicants: AiMatchedApplicant[];
	className?: string;
}

const AiMatchedApplicants: FC<Props> = ({ className }) => {
	return (
		<Card
			className={cn(
				"w-full elevated-on-hover relative z-10 pointer-events-none !bg-white/50 h-fit",
				className
			)}>
			<CardHeader>
				<CardTitle className="capitalize">AI Matches</CardTitle>
				<CardDescription>Coming soon...</CardDescription>
			</CardHeader>
		</Card>
	);
};

export default AiMatchedApplicants;
