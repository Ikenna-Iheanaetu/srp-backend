/** @format */

import { ClubProfileData } from "@/routes/main/routes/profile/club/use-fetch-profile";
import CardFlip from "../filp-container";
import ClubCardBack from "./club-card-back";
import ClubCardFront from "./club-card-front";
interface ClubDynamicCardProps {
	clubInfo: ClubProfileData;
}

export default function ClubDynamicCard({ clubInfo }: ClubDynamicCardProps) {
	return (
		<CardFlip
			front={(flip) => (
				<ClubCardFront
					id={`club-card-${clubInfo.userId}-front`}
					clubInfo={clubInfo}
					flip={flip}
				/>
			)}
			back={(flip) => (
				<ClubCardBack
					id={`club-card-${clubInfo.userId}-back`}
					clubInfo={clubInfo}
					flip={flip}
				/>
			)}
		/>
	);
}
