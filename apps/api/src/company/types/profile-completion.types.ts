import type { RegionJson } from 'src/types/json-models/region.type';
import type { SecurityQuestionJson } from 'src/types/json-models/security-question.type';


export interface ProfileUpdateData {
  onboardingSteps: number[];
  avatar?: string;
  secondaryAvatar?: string;
  industry?: string;
  about?: string;
  country?: string;
  address?: string;
  tagline?: string;
  focus?: string;
  preferredClubs?: string[];
  region?: RegionJson;
  securityQuestion?: SecurityQuestionJson;
}

export type ProfileField = keyof Omit<ProfileUpdateData, 'onboardingSteps'>;

export interface FileUploadResult {
  publicUrl: string;
}


export interface OnboardingResult {
  onboardingSteps: number[];
  completedStep: number;
  isOnboardingComplete: boolean;
  nextStep: number | null;
}


export interface StepProcessorContext {
  companyId: string;
  company: { id: string; userId: string; onboardingSteps: unknown };
  updateData: ProfileUpdateData;
}

/**
 * Step processor interface for handling different onboarding steps
 */
export interface StepProcessor {
  process(
    context: StepProcessorContext,
    dto: any,
    files?: any,
  ): Promise<Partial<ProfileUpdateData>>;
}

/**
 * File upload configuration
 */
export interface FileUploadConfig {
  fieldName: 'avatar' | 'secondaryAvatar' | 'banner';
  folder: 'avatar' | 'secondaryAvatar' | 'banner';
  errorMessage: string;
}