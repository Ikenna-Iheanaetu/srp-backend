/** @format */

import { baseNameSchema, emailSchema } from "@/lib/schemas/index";
import { UserTypeSchema } from "@/lib/schemas/user";
import { FormFieldBuilder } from "@/types/form";
import { addPasswordFieldsSchema } from "@/lib/schemas/password";
import { z } from "zod";

export const AllowedSignupUserTypeSchema = UserTypeSchema.exclude(["admin"], {
	message: "User doesn't have a sign up page",
});
export type AllowedSignupUserType = z.infer<typeof AllowedSignupUserTypeSchema>;

export const ClubReferredUserTypeSchema = AllowedSignupUserTypeSchema.exclude([
	"club",
]);
export type ClubReferredUserType = z.infer<typeof ClubReferredUserTypeSchema>;

export const RefCodeSchema = z
	.string()
	.min(1, {
		message: "Ref Code is required",
	})
	.min(6, {
		message: "Must be at least 6 characters",
	});

const BaseSchema = z.object({
	name: baseNameSchema,
	email: emailSchema,
	userType: AllowedSignupUserTypeSchema,
	refCode: RefCodeSchema,
});

export const AuthSignupSchema = addPasswordFieldsSchema({ schema: BaseSchema });

export type AuthSignupForm = z.infer<typeof AuthSignupSchema>;

export const formFieldBuilders: FormFieldBuilder<AuthSignupForm>[] = [
	{
		path: "name",
		type: "text",
		label: "Name",
		placeholder: "Enter your name",
	},
	{
		path: "email",
		type: "email",
		label: "Email",
		placeholder: "Enter your email",
	},
	{
		path: "password",
		type: "password",
		label: "Password",
		placeholder: "Enter a password",
	},
	{
		path: "confirmPassword",
		type: "password",
		label: "Confirm Password",
		placeholder: "Confirm your password",
	},
	{
		path: "refCode",
		type: "text",
		label: "Enter referral code",
		placeholder: "e.g 123456",
	},
];
