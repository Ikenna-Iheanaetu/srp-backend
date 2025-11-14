/** @format */

import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";

interface EmailButtonProps {
	email: string;
	className?: string;
}

export const EmailButton: React.FC<EmailButtonProps> = ({
	email,
	className,
}) => (
	<Button
		variant={"secondary"}
		size="icon"
		className={cn("hover:bg-zinc-300", className)}
		asChild>
		<a href={"mailto:" + email}>
			<Mail className="text-indigo-950" />
		</a>
	</Button>
);
