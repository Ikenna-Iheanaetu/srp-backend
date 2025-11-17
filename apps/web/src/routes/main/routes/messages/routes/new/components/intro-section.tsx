/** @format */

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";
import React from "react";

interface IntroSectionProps {
	onStartNewConversation: () => void;
	className?: string;
}
export const IntroSection: React.FC<IntroSectionProps> = ({
	className,
	onStartNewConversation,
}) => {
	return (
		<Card
			className={cn(
				"flex h-full w-full flex-col items-center justify-center",
				className,
			)}>
			<CardHeader>
				<Mail size={50} />
			</CardHeader>

			<CardContent className="space-y-3 text-center">
				<CardTitle>
					<h3 className="text-xl">Start a Conversation</h3>
				</CardTitle>

				<CardDescription>
					<p className="text-sm">
						To start messaging companies, click the button below.
					</p>
				</CardDescription>
			</CardContent>

			<CardFooter>
				<Button onClick={onStartNewConversation} className="button">
					New conversation
				</Button>
			</CardFooter>
		</Card>
	);
};
