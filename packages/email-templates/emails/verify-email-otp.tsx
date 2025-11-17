/** @format */

import {
  Body,
  Container,
  Heading,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { LogoBanner } from "../components/logo-banner";
import { TailwindContainer } from "../components/tailwind-container";
import { BRAND_NAME } from "../lib/constants";
import { EmailSignature } from "../components/signature";

export default function VerifyEmailOTPTemplate() {
  return (
    <TailwindContainer>
      <Preview>Verify your email address for {BRAND_NAME}</Preview>
      <Body className="bg-white p-8">
        <LogoBanner />

        <Container>
          <Heading className="text-2xl my-4">Verify Your Email Address</Heading>

          <Section>
            <Text>Hi there,</Text>
            <Text>
              Thanks for signing up for <strong>{BRAND_NAME}</strong>. To
              complete your registration, please use the following one-time code
              to verify your email address.
            </Text>
          </Section>

          <Section className="my-4 text-center">
            <div className="bg-lime-400/10 border border-solid border-lime-400/50 rounded-md py-4 px-6 inline-block">
              <Text className="text-3xl font-bold tracking-widest m-0">
                [OTP_DIGITS]
              </Text>
            </div>
            <Text className="text-xs text-gray-500">
              This code will expire in 10 minutes.
            </Text>
          </Section>

          <Section>
            <Text>
              If you didn't sign up for an account, you can safely ignore this
              email.
            </Text>
          </Section>

          <EmailSignature
            salutation="Best regards"
            senderInfo={`${BRAND_NAME}, Admin Team`}
          />
        </Container>
      </Body>
    </TailwindContainer>
  );
}
