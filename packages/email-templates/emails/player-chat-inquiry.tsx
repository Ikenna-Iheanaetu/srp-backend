/** @format */

import { Container, Preview, Section, Text } from "@react-email/components";
import { BRAND_NAME, PostChatInquirySearchParams, WEB_URL } from "@repo/shared";
import { ActionButton } from "../components/action-button";
import { EmailBody, EmailHeading } from "../components/email-styled";
import { LogoBanner } from "../components/logo-banner";
import { EmailSignature } from "../components/signature";
import { TailwindContainer } from "../components/tailwind-container";

const getInquiryUrl = (params: PostChatInquirySearchParams): string =>
	`${WEB_URL}/messages/post-chat-inquiry?${new URLSearchParams({ ...params, hired: String(params.hired) }).toString()}`;

export default function PostChatInquiryTemplate() {
	return (
		<TailwindContainer>
			<Preview>We'd love to know - did you get hired?</Preview>
			<EmailBody>
				<LogoBanner />

				<Container>
					<EmailHeading>We'd Love to Hear From You</EmailHeading>

					<Section>
						<Text>Hi [First Name],</Text>
						<Text>
							Thank you for taking the time to chat with [Company
							Name] through our platform. We hope you had a great
							conversation!
						</Text>
						<Text>
							We wanted to follow up:{" "}
							<strong>did they offer you the opportunity?</strong>
						</Text>
					</Section>

					<Section>
						<Text>
							Your feedback helps us improve the platform and
							support both our players/supporters and partner
							companies. Whether it was a match or not, we'd love
							to know how it went.
						</Text>
					</Section>

					<Section className="my-6">
						<ActionButton
							href={getInquiryUrl({
								hired: true,
								userEmail: "[USER_EMAIL]",
								companyEmail: "[COMPANY_EMAIL]",
								companyName: "[COMPANY_NAME]",
								chatId: "[CHAT_ID]",
								token: "[token  ]",
							})}
							className="mb-4">
							Yes, they hired me
						</ActionButton>

						<ActionButton
							variant="secondary"
							href={getInquiryUrl({
								hired: false,
								userEmail: "[USER_EMAIL]",
								companyEmail: "[COMPANY_EMAIL]",
								companyName: "[COMPANY_NAME]",
								chatId: "[CHAT_ID]",
								token: "[token  ]",
							})}>
							No, they didn't
						</ActionButton>
					</Section>

					<EmailSignature
						salutation="Best regards"
						senderInfo={`${BRAND_NAME}, Admin Team`}
					/>
				</Container>
			</EmailBody>
		</TailwindContainer>
	);
}
