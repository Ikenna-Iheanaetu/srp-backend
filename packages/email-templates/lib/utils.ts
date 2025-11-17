/** @format */

import { BASE_URL } from "./constants";

interface AcceptInviteLinkParams {
  userType: string;
  refCode: string;
}
export const generateAcceptInviteLink = ({
  userType,
  refCode,
}: AcceptInviteLinkParams) =>
  `${BASE_URL}/signup/${userType}?refCode=${refCode}&wasInvited=true` as const;

interface DeclineInviteLinkParams extends AcceptInviteLinkParams {
  otp: string;
  email: string;
}
export const generateDeclineInviteLink = ({
  userType,
  refCode,
  otp,
  email,
}: DeclineInviteLinkParams) =>
  `${BASE_URL}/invite-management/decline?refCode=${refCode}&role=${userType}&email=${email}&otp=${otp}` as const;
