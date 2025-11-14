/** @format */

import { Params } from "react-router";
import { Route } from "./+types/route";
import {
	AllowedSignupUserType,
	AllowedSignupUserTypeSchema,
	AuthSignupForm,
	ClubReferredUserType,
	ClubReferredUserTypeSchema,
	RefCodeSchema,
} from "./form-schema";

type RouteParams = Route.ClientActionArgs["params"];

export const getUserTypeFromParams = (
	params: Params,
): AllowedSignupUserType | null => {
	const isValidParams = (p: unknown): p is RouteParams =>
		typeof p === "object" && p !== null && "*" in p;
	if (!isValidParams(params)) return null;

	const valResult = AllowedSignupUserTypeSchema.safeParse(params["*"]);
	return valResult.success ? valResult.data : null;
};

export const isClubReferredUserType = (
	userType: unknown,
): userType is ClubReferredUserType => {
	const result = ClubReferredUserTypeSchema.safeParse(userType);
	return result.success;
};

export const isRefCodeValid = (
	refCode: unknown,
): refCode is AuthSignupForm["refCode"] => {
	const result = RefCodeSchema.safeParse(refCode);
	return result.success;
};
