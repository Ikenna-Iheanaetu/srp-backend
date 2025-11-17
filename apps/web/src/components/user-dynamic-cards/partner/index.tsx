/** @format */

import { CompanyProfileData } from "@/routes/main/routes/profile/company/use-fetch-profile";
import { ClubReferredCardFront } from "../club-referred-card-front";
import CardFlip from "../filp-container";
import PartnerCardBack from "./partner-card-back";

export type CompanyDynamicCardData = CompanyProfileData;

export interface CompanyCardProps {
	companyData: CompanyDynamicCardData;
	onMessage?: () => void;
}

export default function CompanyDataCard({
	companyData: companyData,
	onMessage,
}: CompanyCardProps) {
	return (
		<CardFlip
			front={(flip) => (
				<ClubReferredCardFront flip={flip} personalInfo={companyData} />
			)}
			back={(flip) => (
				<PartnerCardBack
					flip={flip}
					companyData={companyData}
					onMessage={onMessage}
				/>
			)}
		/>
	);
}
