/** @format */

import { Column, Img, Row, Section, Text } from "@react-email/components";
import { BASE_URL, BRAND_NAME } from "../lib/constants";

export const LogoBanner: React.FC = () => (
  <Section className="bg-lime-400 rounded-lg min-h-16 sm:min-h-24 lg:min-h-32">
    <Row className="h-full">
      <Column className="text-center w-full align-middle">
        <Img
          src={`${BASE_URL}/assets/images/site-logo-dark.png`}
          height={40}
          width={40}
          alt={BRAND_NAME}
          className="m-[0_5px_0_0] inline-block align-middle"
        />
        <Text className="inline m-0 text-nowrap align-middle lg:text-lg font-semibold">
          {BRAND_NAME}
        </Text>
      </Column>
    </Row>
  </Section>
);
