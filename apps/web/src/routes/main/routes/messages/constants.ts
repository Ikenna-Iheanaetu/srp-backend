/** @format */
import {
	CompanyUserTypeSchema,
	PlayerUserTypesSchema,
} from "@/lib/schemas/user";
import * as z from "zod/v4";

export const EVENT_EMIT_TIMEOUT = 15000;

export const AllowedChatUserSchema = z.enum([
	...PlayerUserTypesSchema.options,
	...CompanyUserTypeSchema.options,
] as const);
