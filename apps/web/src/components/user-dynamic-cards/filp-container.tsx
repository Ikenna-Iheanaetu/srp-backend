/** @format */

// prettier-ignore

import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { type ReactNode, useEffect, useRef, useState } from "react";

interface CardFlipProps {
	front: (flip: () => void) => ReactNode;
	back: (flip: () => void) => ReactNode;
	className?: string;
	aspectRatio?: string;
	frontRef?: React.Ref<HTMLDivElement | null>;
}

export const CardFlip = ({
	front,
	back,
	className = "",
	aspectRatio = "auto",
	frontRef: externalFrontRef,
}: CardFlipProps) => {
	const [isFlipped, setIsFlipped] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);
	const frontRef = useRef<HTMLDivElement>(null);
	const backRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (cardRef.current && frontRef.current && backRef.current) {
			gsap.set(cardRef.current, { perspective: 1000 });
			gsap.set(frontRef.current, { rotationY: 0 });
			gsap.set(backRef.current, { rotationY: -180 });
		}
	}, []);

	const handleFlip = () => {
		if (!cardRef.current || !frontRef.current || !backRef.current) return;

		setIsFlipped(!isFlipped);

		gsap.to(frontRef.current, {
			rotationY: isFlipped ? 0 : 180,
			duration: 0.6,
			ease: "power2.inOut",
		});

		gsap.to(backRef.current, {
			rotationY: isFlipped ? -180 : 0,
			duration: 0.6,
			ease: "power2.inOut",
		});
	};

	// Calculate aspect ratio style
	const aspectRatioStyle = aspectRatio !== "auto" ? { aspectRatio } : {};

	return (
		<div
			ref={cardRef}
			className={cn(
				"relative w-full h-max [transform-style:preserve-3d]",
				className
			)}
			style={aspectRatioStyle}>
			<div
				ref={(node) => {
					frontRef.current = node;

					if (typeof externalFrontRef === "function") {
						externalFrontRef(node);
					} else if (externalFrontRef) {
						externalFrontRef.current = node;
					}
				}}
				className="w-full [backface-visibility:hidden]">
				{front(handleFlip)}
			</div>
			<div
				ref={backRef}
				className="absolute top-0 left-0 size-full [backface-visibility:hidden]">
				{back(handleFlip)}
			</div>
		</div>
	);
};

export default CardFlip;
