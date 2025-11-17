/** @format */

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ProgressProps } from "@radix-ui/react-progress";
import { FC, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface Props extends ProgressProps {
	showValue?: boolean;
	value: number;
}

const AnimatedColorProgress: FC<Props> = ({
	value = 0,
	showValue = true,
	className,
	...props
}) => {
	const [progress, setProgress] = useState(0);
	const progressRef = useRef(progress);

	useGSAP(() => {
		gsap.to(progressRef, {
			current: value,
			duration: 1,
			ease: "power1.out",
			onUpdate: () => setProgress(progressRef.current),
		});
	}, [value]);

	const getColor = (val: number) => {
		if (val < 33) return "#ef4444"; // red-500
		if (val < 66) return "#eab308"; // yellow-500
		return "#22c55e"; // green-500
	};

	return (
		<div className="grid grid-cols-5 gap-2 items-center w-full">
			<Progress
				value={progress}
				className={cn("col-span-4", className)} // Kept your w-24 addition
				indicatorColor={getColor(value)} // Set color based on target value and not progress state
				{...props}
			/>

			{showValue && (
				<div className="text-right text-sm text-muted-foreground min-w-8">
					{Math.round(progress)}%{" "}
				</div>
			)}
		</div>
	);
};

export default AnimatedColorProgress;
