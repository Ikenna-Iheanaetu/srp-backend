/** @format */

import { Text } from "@react-email/components";

export const EmailSignature = ({
  salutation,
  senderInfo,
}: {
  salutation: string;
  senderInfo: string;
}) => {
  return (
    <div className="p-4 rounded-sm size-fit mt-8 bg-lime-400/10 border border-solid border-lime-400/50">
      <strong>{salutation},</strong>
      <Text className="m-0">{senderInfo}</Text>
    </div>
  );
};
