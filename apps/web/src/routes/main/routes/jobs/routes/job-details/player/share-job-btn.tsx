/** @format */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Share2 } from "lucide-react";
import { FC, useCallback } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";

interface Props {
	className?: string;
}

const ShareJobBtn: FC<Props> = ({ className }) => {
	const { pathname } = useLocation();

	const handleShare = useCallback(async () => {
		try {
			// Construct the full URL: base URL + pathname
			const fullUrl = `${window.location.origin}${pathname}`;

			await navigator.clipboard.writeText(fullUrl);

			toast.success("Job link copied successfully", {
				description: fullUrl,
				position: "top-center",
			});
		} catch (err) {
			toast.error("Failed to copy job link ", { position: "top-center" });
			console.error("Failed", err);
		}
	}, [pathname]);

	return (
		<Button
			size={"icon"}
			variant={"ghost"}
			onClick={() => void handleShare()}
			className={cn(className)}
			title="Copy job link to clipboard">
			<Share2 />
		</Button>
	);
};

export default ShareJobBtn;
