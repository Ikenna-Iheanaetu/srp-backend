/** @format */

import { QRCodeGenerator } from "@/components/common/qr-code";
import { getDifferenceColor } from "@/lib/helper-functions/colors";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import { RotateCcw } from "lucide-react";
import { EmailButton } from "../email-button";
import { FlipButton } from "../flip-button";

export default function ClubCardBack({
	id,
	flip,
	clubInfo,
}: {
	id: string;
	flip: () => void;
	clubInfo: ClubProfileData;
}) {
	const baseUrl = window.location.origin;
	const supporterLink = `${baseUrl}/signup/supporter?refCode=${clubInfo?.refCode}`;
	const partnerLink = `${baseUrl}/signup/company?refCode=${clubInfo?.refCode}`;

	return (
		<div
			id={id}
			className="rounded-2xl w-full h-[450px] sm:h-[500px] md:h-[600px] max-w-sm text-slate-50 p-2 bg-blue-900"
			style={{
				backgroundColor: clubInfo.preferredColor,
				color: clubInfo.preferredColor
					? getDifferenceColor(clubInfo.preferredColor)
					: undefined,
			}}>
			{/* Main content area */}
			<div className="relative flex flex-col gap-2 items-center border-b rounded-xl p-2 pb-10 z-30 min-h-[400px] sm:min-h-[450px] md:min-h-[500px]">
				<img
					src={getFileNameUrl(clubInfo?.avatar)}
					alt="logo"
					className="h-16 w-16 sm:h-20 sm:w-20 rounded-full mb-4 object-contain"
				/>

				{/* About section */}
				<h3 className="text-start text-sm sm:text-base mr-auto font-semibold z-20">
					About
				</h3>
				<div className="rounded-lg border tw-scrollbar border-gray-200 text-slate-900 w-full bg-white px-4 z-20 text-xs sm:text-sm py-1 h-[200px] max-h-[200px] overflow-y-auto">
					{clubInfo?.about ? (
						<p className="text-slate-900 text-sm">
							{clubInfo.about}
						</p>
					) : (
						<p className="text-slate-900 text-sm text-center py-4">
							No information available
						</p>
					)}
				</div>

				<div
					className="flex w-full gap-2 text-white"
					style={{
						color: clubInfo.preferredColor
							? getDifferenceColor(clubInfo.preferredColor)
							: undefined,
					}}>
					<div className="flex w-full flex-col items-center">
						<QRCodeGenerator value={supporterLink} width={100} />
						<span className="text-sm mt-1">Supporter</span>
					</div>
					<div className="flex w-full flex-col items-center">
						<QRCodeGenerator value={partnerLink} width={100} />
						<span className="text-sm mt-1">Partner</span>
					</div>
				</div>

				{/* Footer buttons - positioned absolutely at bottom */}
				<div className="absolute w-full left-0 -bottom-8 flex items-center justify-evenly z-20 py-3">
					<EmailButton email={clubInfo.email} />

					<FlipButton flip={flip} panel="back" />

					<img
						src={getFileNameUrl(clubInfo.avatar)}
						alt="Club logo"
						className="h-9 w-9 sm:h-11 opacity-0 sm:w-11 object-contain"
					/>
				</div>
			</div>

			<div className="flex opacity-0 pointer-events-none items-center justify-center">
				<div
					onClick={flip}
					className="flex p-0 border text-xl rounded-lg px-8 py-2 bg-transparent hover:bg-transparent items-center justify-center">
					<RotateCcw className="size-6 text-white" />
				</div>
			</div>
		</div>
	);
}
