/** @format */

import { z } from "zod";
import { IntPosNumSchema } from "./index";

export const PlayerUserTypesSchema = z.enum(["player", "supporter"]);

export const CompanyUserTypeSchema = z.enum([
	"company" /* more types coming */,
]);

export const UserTypeSchema = z.enum([
	...PlayerUserTypesSchema.options,
	...CompanyUserTypeSchema.options,
	"club",
	"admin",
]);

export type UserType = z.infer<typeof UserTypeSchema>;

const requiredStringSchema = z.string().min(1, {
	message: "Required field",
});

export const AboutMeSchema = requiredStringSchema.max(1000, {
	message: "Must not exceed 1000 characters",
});

export const AddressSchema = requiredStringSchema.max(500, {
	message: "Must not exceed 500 characters",
});

export const CountrySchema = requiredStringSchema;

export const SkillsSchema = z
	.array(requiredStringSchema)
	.max(15, { message: "Must not exceed 15 skills" });

export const TraitsSchema = z
	.array(requiredStringSchema)
	.max(15, { message: "Must not exceed 15 traits" });

export const PreferredClubsSchema = z
	.array(
		requiredStringSchema /* Without this optional, field will always be required due to nature of usage */,
	)
	.max(15, { message: "Must not exceed 15 clubs" });

export const CurrentRoleSchema = requiredStringSchema.max(1000, {
	message: "Can't exceed 1000 characters",
});

export const YearsOfExperienceSchema = IntPosNumSchema;

export const BirthYearSchema = IntPosNumSchema.refine(
	(val) => {
		try {
			return Number(val) >= 1940;
		} catch {
			return false;
		}
	},
	{
		message: "Must be greater than 1940",
	},
).refine((val) => Number(val) <= new Date().getFullYear(), {
	message: "Must not exceed current year",
});

export const SalarySchema = z.coerce
	.number({ invalid_type_error: "Must be a number" })
	.positive({ message: "Must be a positive number" });

export const WorkAvailabilitySchema = z.boolean();
export type WorkAvailability = z.infer<typeof WorkAvailabilitySchema>;
