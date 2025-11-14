/** @format */

import {
  InviteEmailTemplate,
  StepItem,
} from "../components/invite-email-template";
import {
  generateAcceptInviteLink,
  generateDeclineInviteLink,
} from "../lib/utils";

const companyPlatformSteps = [
  {
    description: "Sign up and create your company profile in minutes.",
    link: "/signup/company?[REF_CODE]",
  },
  {
    description: (
      <>
        Create your own <strong>Company card</strong> to promote your business
        together with us.
      </>
    ),
    link: "/onboarding",
  },
  {
    description:
      "Answer AI-driven onboarding questions - enabling us to match you with candidates who fit your workplace culture.",
    link: "/onboarding/questionnaire",
  },
  {
    description: (
      <>
        Explore candidate <strong>Player cards</strong> - digital profiles with
        photo, CV, and an easy-to-read match indicator.
      </>
    ),
    link: "/recruiting/search",
  },

  {
    description:
      "Stand out as an employer who supports talent with a sports background - and give back to [Club Name] at the same time.",
    link: "/job-management",
  },
] satisfies StepItem[];

export default function CompanyInviteEmail() {
  return (
    <InviteEmailTemplate
      previewText="Find Talent with the Mindset of Champions"
      introduction={{
        heading:
          "Find Talent with the Mindset of Champions - and Support [Club Name]",
        greeting: "Dear [Company Name]",
        paragraph: (
          <>
            We are excited to welcome you to the [Club Name] career platform—a
            new way to recruit powered by the club's own network of{" "}
            <strong>former elite athletes and loyal supporters.</strong> Here,
            you'll meet candidates who are more than just qualified—they're{" "}
            <strong>driven, team-oriented, and resilient</strong> individuals
            shaped by a background in elite sports. Whether you're former
            junior-level talents, senior players transitioning from their
            athletic careers, or loyal fans of the club, they bring with them
            values every team needs: discipline, adaptability, and a winning
            mentality.
          </>
        ),
      }}
      stepsSection={{
        introText: "Here's what makes our platform different:",
        items: companyPlatformSteps,
      }}
      closing={{
        heading: (
          <>
            Every recruitment made here supports the club{" "}
            <strong>financially.</strong>
          </>
        ),
        paragraph:
          "So when you find the right fit, you also contribute to the future of local sports.",
      }}
      callToAction={{
        text: "Ready to find your next team player?",
        buttons: {
          accept: {
            link: generateAcceptInviteLink({
              userType: "company",
              refCode: "[REF_CODE]",
            }),
          },
          decline: {
            link: generateDeclineInviteLink({
              userType: "company",
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
