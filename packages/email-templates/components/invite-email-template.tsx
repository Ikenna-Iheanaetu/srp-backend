/** @format */

import React = require("react");
import {
  Container,
  Heading,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { TailwindContainer } from "../components/tailwind-container";
import { BASE_URL } from "../lib/constants";
import { ActionButton } from "./action-button";
import { EmailBody, EmailHeading } from "./email-styled";
import { LogoBanner } from "./logo-banner";
import { EmailSignature } from "./signature";

interface StepItem {
  description: React.ReactNode;
  /**The base url is attached internally */
  link: `/${string}`;
}

interface StepsMapperProps {
  steps: StepItem[];
}

const StepsMapper: React.FC<StepsMapperProps> = ({ steps }) => {
  return steps.map(({ description, link }, index) => (
    <Section key={index} className="mb-8">
      <div className="mr-8 ml-3 inline-flex items-center">
        <div className="mr-4 flex h-3 min-w-3 shrink-0 items-center justify-center bg-lime-400" />

        <Link href={BASE_URL + link}>{description}</Link>
      </div>
    </Section>
  ));
};

interface CallToActionItem {
  label?: string;
  link: string;
}

type InviteAction = "accept" | "decline";

interface SignatureObject {
  /**e.g., "Best Regards" */
  closingRemark: string;
  /**e.g., "[BRAND_NAME] Admin Team" */
  senderIdentifier: string;
}

const checkIsSignatureObject = (data: unknown): data is SignatureObject =>
  !!data &&
  typeof data === "object" &&
  "closingRemark" in data &&
  "senderIdentifier" in data;

interface InviteEmailTemplateProps {
  /** The email's preheader text, visible in the inbox preview. */
  previewText: string;

  /** Properties for the main introduction section of the email. */
  introduction: {
    heading: React.ReactNode;
    greeting: React.ReactNode;
    paragraph: React.ReactNode;
  };

  /** Properties for the 'how to get started' steps section. */
  stepsSection: {
    introText: React.ReactNode;
    items: StepItem[];
  };

  /** Properties for the closing message section. */
  closing: {
    heading: React.ReactNode;
    paragraph: React.ReactNode;
  };

  /** Properties for the call to action section, including text and buttons. */
  callToAction: {
    text: React.ReactNode;
    buttons: Record<InviteAction, CallToActionItem>;
  };

  /** Optional closing signature block (e.g., "Best regards, [Team]"). */
  signature: React.ReactNode | SignatureObject;
}

const InviteEmailTemplate: React.FC<InviteEmailTemplateProps> = ({
  previewText,
  introduction,
  stepsSection,
  closing,
  callToAction,
  signature,
}) => (
  <TailwindContainer>
    <Preview>{previewText}</Preview>
    <EmailBody>
      <LogoBanner />

      <Container>
        <EmailHeading className="text-lg">{introduction.heading}</EmailHeading>

        <Section>
          <Row>
            <Text>{introduction.greeting},</Text>
            <Text>{introduction.paragraph}</Text>
          </Row>
        </Section>

        <Section>
          <Row>
            <Text>{stepsSection.introText}</Text>
            <StepsMapper steps={stepsSection.items} />
          </Row>
        </Section>
      </Container>

      <Container>
        <Heading as="h2" className="text-base">
          {closing.heading}
        </Heading>

        <Text>{closing.paragraph}</Text>

        <Section>
          <Row>
            <Text className="font-semibold">{callToAction.text}</Text>

            {Object.keys(callToAction.buttons).map((key) => {
              const action = key as InviteAction;
              const { link, label } = callToAction.buttons[action];
              return (
                <ActionButton
                  key={link}
                  variant={action === "accept" ? "primary" : "secondary"}
                  href={link}
                  className="mb-4 capitalize"
                >
                  {label ?? `${action} invite`}
                </ActionButton>
              );
            })}
          </Row>
        </Section>
      </Container>

      <Container>
        <Section>
          <Row>
            {checkIsSignatureObject(signature) ? (
              <EmailSignature
                salutation={signature.closingRemark}
                senderInfo={signature.senderIdentifier}
              />
            ) : (
              <div className="p-4 rounded-sm size-fit ml-auto mt-16 bg-lime-400/10 border border-solid border-lime-400/50">
                {signature}
              </div>
            )}
          </Row>
        </Section>
      </Container>
    </EmailBody>
  </TailwindContainer>
);

export { InviteEmailTemplate };
export type { CallToActionItem, InviteEmailTemplateProps, StepItem };
