export interface ClubContactInfo {
  email: string;
  phone: string;
  address: string;
}

export interface SponsorshipProgram {
  id: string;
  name: string;
}

export interface SponsorshipOpportunity {
  id: string;
  name: string;
}

export interface ClubInfo {
  userId?: string;
  name: string;
  email: string;
  userType: string;
  onboardingSteps?: number[];
  about?: string;
  avatar?: string;
  banner?: string;
  tagline?: string;
  category?: string;
  address?: string;
  country?: string;
  phone?: string;
  focus?: string;
  status?: string;
  founded?: string;
  refCode?: string;
  industry?: string;
  contactInfo?: ClubContactInfo;
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  sponsorshipOpportunities?: SponsorshipOpportunity[];
  sponsorshipPrograms?: SponsorshipProgram[];
}

export interface ClubCardProps {
  clubInfo: ClubInfo;
  flip: () => void;
}
