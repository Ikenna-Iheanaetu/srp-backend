/** @format */

import LoadingIndicator from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FC } from "react";
import { TransitionsInstance } from "../use-gsap-question-transition";

export interface ProgressControlsProps
	extends Pick<
		TransitionsInstance,
		"canGoPrev" | "goToPrev" | "canGoNext" | "isLastQuestion"
	> {
	handleNext: () => void;
	hasValidAnswer: boolean;
	isSubmitting: boolean;
	className?: string;
}

export const ProgressControls: FC<ProgressControlsProps> = ({
	canGoNext,
	canGoPrev,
	handleNext,
	goToPrev,
	isLastQuestion,
	hasValidAnswer,
	isSubmitting,
	className,
}) => {
	const transitionStyles = "transition-all ease-in-out";
	return (
		<div className={cn("flex justify-between mt-8", className)}>
			<Button
				variant="outline"
				onClick={goToPrev}
				disabled={!canGoPrev(!isSubmitting)}
				className="flex items-center gap-2">
				<ArrowLeft className={cn("h-4 w-4", transitionStyles)} />
				Previous
			</Button>

			<Button
				onClick={handleNext}
				disabled={
					isLastQuestion
						? isSubmitting || !hasValidAnswer
						: !canGoNext(hasValidAnswer && !isSubmitting)
				}
				className={cn(
					"button flex items-center gap-2",
					transitionStyles
				)}>
				{isSubmitting ? (
					<>
						<LoadingIndicator />
						Submitting...
					</>
				) : isLastQuestion ? (
					"Submit"
				) : (
					<>
						Next
						<ArrowRight className="h-4 w-4" />
					</>
				)}
			</Button>
		</div>
	);
};
