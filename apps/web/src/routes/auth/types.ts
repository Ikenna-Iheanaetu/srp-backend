/** @format */

import { UserType } from "@/lib/schemas/user";
import { ApiProfileResponse } from "../main/routes/profile/query-factory";
import { AllowedProfileUserType } from "../main/routes/profile/schemas";
import { AllowedSignupUserType } from "./signup/routes/signup-form/form-schema";
import { UserProfile } from "../main/routes/profile/types";
import { ApiSuccessResponse } from "@/lib/axios-instance/types";

interface AdminUser {
	userType: "admin";
}
type User = UserProfile | AdminUser;

type BaseSuccessResponse<TUser extends User> = ApiSuccessResponse<{
	data: {
		user: TUser;
		accessToken: string;
		refreshToken: string;
	};
}>;

type SignupSuccessResponse<
	TUserType extends AllowedSignupUserType = AllowedSignupUserType,
> = BaseSuccessResponse<ApiProfileResponse[TUserType]>;

type AdminLoginSuccessResponse = BaseSuccessResponse<AdminUser>;

type UserWithProfileLoginSuccessResponse<T extends AllowedProfileUserType> =
	BaseSuccessResponse<ApiProfileResponse[T]>;

type LoginSuccessResponse<TUserType extends UserType = UserType> =
	TUserType extends AllowedProfileUserType
		? UserWithProfileLoginSuccessResponse<TUserType>
		: AdminLoginSuccessResponse;

type AuthSuccessServerResponse<TUserType extends UserType = UserType> =
	TUserType extends AllowedSignupUserType
		? SignupSuccessResponse<TUserType>
		: TUserType extends AllowedProfileUserType
			? LoginSuccessResponse<TUserType>
			: never;

export type {
	AuthSuccessServerResponse,
	LoginSuccessResponse,
	SignupSuccessResponse,
};
