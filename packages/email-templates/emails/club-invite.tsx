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

const clubOnboardingSteps = [
  {
    description: "Sign up and set up your club's dedicated profile.",
    link: "/signup/club?refCode=[REF_CODE]",
  },
  {
    description: (
      <>
        Get a <strong>Company card</strong> to elevate your club with us.
      </>
    ),
    link: "/onboarding",
  },
  {
    description: (
      <>
        Utilize our Affiliates management feature to invite{" "}
        <strong>players</strong>, <strong>supporters</strong>, and{" "}
        <strong>companies</strong> to your club.
      </>
    ),
    link: "/affiliate-management",
  },
] satisfies StepItem[];

export default function ClubInviteEmail() {
  return (
    <InviteEmailTemplate
      previewText={`Invitation to Partner with ${BRAND_NAME}`}
      introduction={{
        heading: `An Invitation to Elevate your Club's Recruitment with ${BRAND_NAME}`,
        greeting: "Dear Club Team",
        paragraph: (
          <>
            The Admin team of the {BRAND_NAME} is reaching out to invite{" "}
            <strong>[Club Name]</strong> to join our exclusive network. Our
            platform offers a unique opportunity for clubs like yours to
            streamline recruitment by connecting with a dedicated pool of
            talent: your own former elite athletes, loyal supporters, and
            companies. This partnership is designed to enhance your club's
            operational efficiency and foster deeper community engagement.
          </>
        ),
      }}
      stepsSection={{
        introText: `Here's how joining the ${BRAND_NAME} platform benefits [Club Name]:`,
        items: clubOnboardingSteps,
      }}
      closing={{
        heading: "Discover a New Era of Recruitment and Community Support.",
        paragraph: (
          <>
            The Admin team of the {BRAND_NAME} is reaching out to invite your
            club to join our exclusive network. Our platform offers a unique
            opportunity for organizations like yours to streamline recruitment
            by connecting with a dedicated pool of talent: your own former elite
            athletes, loyal supporters, and companies. This partnership is
            designed to enhance your club's operational efficiency and foster
            deeper community engagement.
          </>
        ),
      }}
      callToAction={{
        text: `We look forward to welcoming your club to ${BRAND_NAME}. Please click below to activate your club's account and begin our partnership:`,
        buttons: {
          accept: {
            link: generateAcceptInviteLink({
              userType: "club",
              refCode: "[REF_CODE]",
            }),
          },
          decline: {
            link: generateDeclineInviteLink({
              userType: "club",
              refCode: "[REF_CODE]",
              otp: "[OTP]",
              email: "[EMAIL]",
            }),
          },
        },
      }}
      signature={{
        closingRemark: "Best Regards,",
        senderIdentifier: `${BRAND_NAME}, Admin Team`,
      }}
    />
  );
}
