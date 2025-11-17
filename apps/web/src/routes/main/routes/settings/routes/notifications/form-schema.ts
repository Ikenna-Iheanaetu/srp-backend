/** @format */

import { z } from "zod";

// Default preferences
const defaultPreferences = {
	push: false,
	email: true, // Default value set to true
	sms: false,
};

// Reusable schema for notification preferences with default values
const NotificationPreferenceSchema = z
	.object({
		push: z.boolean(),
		email: z.boolean().default(defaultPreferences.email),
		sms: z.boolean(),
	})
	.default(defaultPreferences)
	.refine((data) => data.push || data.email || data.sms, {
		message: "Select at least one notification method",
	});

// Main schema using the reusable structure
export const NotificationSettingsSchema = z.object({
	comments: NotificationPreferenceSchema,
	tags: NotificationPreferenceSchema,
	reminders: NotificationPreferenceSchema,
	moreActivityAboutYou: NotificationPreferenceSchema,
});

export type NotificationSettingsForm = z.infer<
	typeof NotificationSettingsSchema
>;
