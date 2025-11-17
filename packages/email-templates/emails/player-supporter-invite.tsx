/** @format */

import {
  InviteEmailTemplate,
  StepItem,
} from "../components/invite-email-template";
import { BRAND_NAME } from "../lib/constants";
import {
  generateAcceptInviteLink,
  generateDeclineInviteLink,
} from "../lib/utils";

const registrationSteps = [
  {
    description: "Sign up and create your personal profile in minutes.",
    link: "/signup/[player|supporter]?[REF_CODE]",
  },
  {
    description: "Upload your photo and build your CV - all in one place.",
    link: "/onboarding",
  },
  {
    description:
      "Answer a few short AI-powered questions - designed to match your mindset with the right workplace.",
    link: "/onboarding/questionnaire",
  },
  {
    description:
      "You'll receive a personal digital [player|supporter] card, just like a collectible sports card, with your skills, experience, and match potential clearly visible.",
    link: "/profile",
  },
] satisfies StepItem[];

export default function PlayerOrSupporterInviteEmail() {
  return (
    <InviteEmailTemplate
      previewText={`${BRAND_NAME} - [player|supporter] invite`}
      introduction={{
        heading:
          "Welcome to [Club Name]'s Career Platform - Where Passion Meets Opportunity",
        greeting: "Dear [First Name]",
        paragraph:
          "Welcome to the [Club Name] career network - a unique platform where your passion for sports becomes the link to your next professional opportunity. This initiative connects our club's supporters and current or former athletes with job opportunities at companies that share your dedication and team spirit. Whether you're an elite-level player preparing for life beyond the sport, or a fan looking for your next step, this is your space.",
      }}
      stepsSection={{
        introText: "Here's how to get started:",
        items: registrationSteps,
      }}
      closing={{
        heading: "And the best part?",
        paragraph:
          "Every successful hire through the platform helps generate financial support for [Club Name] - your club.",
      }}
      callToAction={{
        text: "Join now, explore opportunities, and support your team simply by finding your next job.",
        buttons: {
          accept: {
            link: generateAcceptInviteLink({
              userType: "[player|supporter]",
              refCode: "[REF_CODE]",
            }),
          },
          decline: {
            link: generateDeclineInviteLink({
              userType: "[player|supporter]",
              refCode: "[REF_CODE]",
              otp: "[OTP]",
              email: "[EMAIL]",
            }),
          },
        },
      }}
      signature={{
        closingRemark: "Best regards,",
        senderIdentifier: "[Club Name] Career Team",
      }}
    />
  );
}
