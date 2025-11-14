/** @format */

import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import { FC } from "react";

interface Props {
	className?: string;
}
export const LoadingIndicator: FC<Props> = ({ className = "" }) => {
	return (
		<div className={cn("flex items-center justify-center", className)}>
			<LoaderCircle className={cn("animate-spin stroke-blue-700")} />
		</div>
	);
};

/**@deprecated Use the named export instead */
export default LoadingIndicator;
