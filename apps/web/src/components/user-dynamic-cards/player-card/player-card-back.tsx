/** @format */

import { Button } from "@/components/ui/button";
import { getDifferenceColor } from "@/lib/helper-functions/colors";
import { cn, getErrorMessage } from "@/lib/utils";
import { PlayerProfileData } from "@/routes/main/routes/profile/player/use-player-profile-data";
import { Download, Mail } from "lucide-react";
import { domToPng } from "modern-screenshot";
import React from "react";
import { toast } from "sonner";
import { FlipButton } from "../flip-button";
import { LogoBanner } from "../logo-banner";

interface ExportCardBtnProps {
	cardFrontRef: React.RefObject<HTMLDivElement | null>;
	filename: string;
}

const ExportCardBtn: React.FC<ExportCardBtnProps> = ({
	cardFrontRef,
	filename,
}) => {
	const [isExporting, setIsExporting] = React.useState(false);

	const cloneAndUndoFlip = (node: HTMLDivElement) => {
		const originalDimensions = node.getBoundingClientRect();

		const clonedFront = node.cloneNode(true) as HTMLDivElement;

		clonedFront.style.transform = "rotateY(0deg)";
		clonedFront.style.backfaceVisibility = "hidden";

		clonedFront.style.width = `${originalDimensions.width}px`;
		clonedFront.style.height = `${originalDimensions.height}px`;

		return clonedFront;
	};

	const exportCard = async () => {
		if (isExporting) {
			return;
		}
		if (!cardFrontRef.current) {
			toast.error(`Card "div" not ready.`);
			return;
		}

		setIsExporting(true);

		// Create a temporary container to hold the cloned element
		const tempContainer = document.createElement("div");
		tempContainer.style.position = "absolute";
		tempContainer.style.top = "-9999px"; // Position it off-screen
		document.body.appendChild(tempContainer);

		try {
			const clonedNode = cloneAndUndoFlip(cardFrontRef.current);
			tempContainer.appendChild(clonedNode);

			const dataUrl = await domToPng(clonedNode);
			const link = document.createElement("a");
			link.download = `${filename}.png`;
			link.href = dataUrl;
			link.click();
			setIsExporting(false);
		} catch (error) {
			toast.error("Couldn't export card.", {
				description: getErrorMessage(error),
			});
		} finally {
			setIsExporting(false);
			document.body.removeChild(tempContainer);
		}
	};

	return (
		<Button
			onClick={() => void exportCard()}
			size={"icon"}
			variant={"secondary"}
			disabled={isExporting}
			className={cn(
				"hover:bg-zinc-100 disabled:opacity-100",
				isExporting && "animate-pulse",
			)}>
			<Download className="text-black" />
			<span className="sr-only">
				{isExporting ? "Exporting card" : "Export card"}
			</span>
		</Button>
	);
};

export type BackPersonalInfo = Pick<
	PlayerProfileData,
	| "sportsHistory"
	| "employmentType"
	| "about"
	| "email"
	| "avatar"
	| "name"
	| "club"
	| "userType"
>;

interface PlayerCardBackProps extends Pick<ExportCardBtnProps, "cardFrontRef"> {
	personalInfo: BackPersonalInfo;
	onMessage?: () => void;
	flip: () => void;
}

export default function PlayerCardBack({
	flip,
	cardFrontRef,
	personalInfo: { avatar, name, sportsHistory, about, club, userType },
	onMessage,
}: PlayerCardBackProps) {
	return (
		<div
			className="h-full w-full max-w-sm rounded-2xl bg-blue-900 p-0.5"
			style={{
				backgroundColor: club?.preferredColor,
				color: club?.preferredColor
					? getDifferenceColor(club.preferredColor)
					: undefined,
			}}>
			{/* Main content area */}
			<div className="relative">
				<div className="relative h-fit overflow-x-hidden rounded-xl border-b pb-8">
					<div
						className="absolute inset-0 z-10 h-full bg-blue-900"
						style={{
							backgroundColor: club?.preferredColor,
						}}
					/>
					<img
						src={avatar}
						className="absolute inset-0 size-full object-cover"
					/>

					<div className="relative left-0 right-0 top-0 z-20 flex w-full flex-col items-center gap-2 px-3 py-2 sm:px-4 sm:py-3">
						<h2 className="mb-0.5 text-lg font-bold sm:mb-1 sm:text-xl">
							{name}
						</h2>
						<span className="text-sm sm:text-base">About Me</span>
						<div className="mb-2 h-20 w-full overflow-y-auto rounded-md bg-white p-1.5 text-black sm:h-24 sm:p-2 md:h-28">
							<p className="text-xs sm:text-sm">{about}</p>
						</div>

						<span className="text-sm sm:text-base">
							Sports History
						</span>
						<div className="flex h-20 w-full flex-col overflow-y-auto rounded-md bg-white p-1.5 text-black sm:h-24 sm:p-2 md:h-28">
							<p className="text-xs sm:text-sm">
								{sportsHistory}
							</p>
						</div>

						<LogoBanner
							logo={club?.avatar}
							altText="club logo"
							className="mt-4"
						/>
					</div>
				</div>
				<div className="absolute -bottom-7 z-20 flex w-full items-center justify-evenly py-2 sm:py-3">
					<FlipButton flip={flip} panel="back" />

					{onMessage && (
						<Button
							onClick={onMessage}
							variant={"secondary"}
							size="icon"
							className={cn("hover:bg-zinc-300")}>
							<Mail className="text-indigo-950" />
						</Button>
					)}

					<ExportCardBtn
						cardFrontRef={cardFrontRef}
						filename={`${name}-${userType}-card`}
					/>
				</div>
			</div>
		</div>
	);
}
