/** @format */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ShortlistDialog } from "./shortlist-dialog";
import { ServerCandidateResponse } from "../query-factory";

interface ShortlistButtonProps {
	candidate: ServerCandidateResponse;
	className?: string;
}

export function ShortlistButton({
	candidate,
	className,
}: ShortlistButtonProps) {
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<>
			<Button
				onClick={() => setDialogOpen(true)}
				className={cn("button", className)}>
				Shortlist
			</Button>

			<ShortlistDialog
				candidate={candidate}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
			/>
		</>
	);
}
