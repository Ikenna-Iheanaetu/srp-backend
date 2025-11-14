/** @format */

import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import { FlipButton } from "../flip-button";
import { InviteAffiliatesButton } from "./invite-affiliates-button";

export default function ClubCardFront({
	id,
	flip,
	clubInfo,
}: {
	id: string;
	flip: () => void;
	clubInfo: ClubProfileData;
}) {
	return (
		<div
			id={id}
			className="rounded-2xl w-full max-w-sm p-0.5 h-[450px] sm:h-[500px] md:h-[600px] bg-blue-900"
			style={{
				backgroundColor: clubInfo.preferredColor,
			}}>
			{/* Main content area */}
			<div className="relative z-10 h-full">
				<div className="w-full h-full absolute z-20 overflow-hidden rounded-2xl">
					<img
						src={getFileNameUrl(clubInfo.avatar)}
						alt="Club banner"
						className="object-cover w-full h-full"
					/>
				</div>
				<div className="relative flex z-30 text-zinc-50 flex-col items-center py-2 px-2 gap-2 h-full border-b rounded-xl overflow-hidden">
					{/* letter and image */}
					<div className="flex w-full relative items-start">
						<div className="flex size-8 absolute top-0 z-40 left-0 sm:size-10 mr-2 sm:mr-4 items-center justify-center rounded-full bg-white shadow-sm flex-shrink-0">
							<span className="text-lg sm:text-xl font-bold text-blue-900">
								C
							</span>
						</div>
					</div>

					<div className="absolute backdrop-blur-sm rounded-2xl border border-white/30 py-2 gap-1 flex flex-col bottom-0 left-0 right-0 z-20 px-4">
						<h2 className="text-xl backdrop-blur-sm text-center md:text-4xl font-bold mb-2">
							{clubInfo?.name}
						</h2>

						{/* Footer section */}
						<div className="grid grid-cols-3 items-center mx-auto gap-4 w-full sm:py-3">
							<div className="col-span-1"></div>
							<FlipButton flip={flip} />
							<InviteAffiliatesButton
								refCode={clubInfo?.refCode ?? ""}
								className="ml-auto"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
