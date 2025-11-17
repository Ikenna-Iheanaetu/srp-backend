/** @format */

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { FC } from "react";
import { useForm } from "react-hook-form";
import OnWindowFormActionButtons from "../../on-window-form-action-buttons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	NotificationSettingsForm,
	NotificationSettingsSchema,
} from "./form-schema";
import { useSubmitNotificationsSettings } from "./use-submit-notification-settings";

const defaultPreferences = {
	push: false,
	email: false,
	sms: false,
};

const notificationsTypes: {
	key: keyof NotificationSettingsForm;
	name: string;
	description: string;
}[] = [
	{
		key: "comments",
		name: "comments",
		description:
			"These are notifications for comments on your posts and replies to your comments.",
	},
	{
		key: "tags",
		name: "tags",
		description:
			"These are notifications for when someone tags you in a comment, post or story.",
	},
	{
		key: "reminders",
		name: "reminders",
		description:
			"These are notifications to remind you of updates you might have missed.",
	},
	{
		key: "moreActivityAboutYou",
		name: "more activity about you",
		description:
			"These are notifications for posts on your profile, likes and other reactions to your posts, and more.",
	},
];

const NotificationsSettingsMapper: FC = () => {
	const form = useForm({
		defaultValues: {
			comments: defaultPreferences,
			tags: defaultPreferences,
			reminders: defaultPreferences,
			moreActivityAboutYou: defaultPreferences,
		},
		resolver: zodResolver(NotificationSettingsSchema),
	});

	const { defaultValues } = form.formState;

	const { mutate, isPending: isSubmitting } =
		useSubmitNotificationsSettings();

	const onSubmit = (data: NotificationSettingsForm) => {
		mutate(data);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
				className="w-full">
				<div className="flex flex-col gap-4">
					<h3 className="text-lg font-medium">
						Notifications settings
					</h3>

					<p>
						We may still send you important notifications about your
						account outside of your notification settings.
					</p>

					<ul className="flex flex-col gap-4">
						{notificationsTypes.map(
							({ key: settingsType, name, description }) => {
								return (
									<li
										key={settingsType}
										className="flex flex-row items-center justify-between gap-2 rounded-lg border p-3 shadow-sm">
										<div className="space-y-0.5">
											<div className="font-semibold capitalize">
												{name}
											</div>

											<div className="text-sm">
												{description}
											</div>
										</div>

										<div className="flex flex-col justify-between gap-2">
											{Object.keys(
												defaultValues?.[
													settingsType
												] as object,
											).map((preferrence) => {
												type SettingsType =
													typeof settingsType;

												type Preference =
													keyof NotificationSettingsForm[SettingsType];

												const path =
													`${settingsType}.${preferrence as Preference}` as const;

												return (
													<div
														key={path}
														className="flex flex-row-reverse items-center justify-end gap-1">
														<FormLabel
															className={cn(
																"capitalize text-blue-700",
																preferrence ===
																	"sms" &&
																	"uppercase",
															)}>
															{preferrence}
														</FormLabel>
														<FormField
															control={
																form.control
															}
															name={path}
															render={({
																field,
															}) => (
																<FormItem>
																	<FormControl>
																		<Switch
																			checked={
																				field.value
																			}
																			onCheckedChange={
																				field.onChange
																			}
																			className="data-[state=checked]:bg-blue-700"
																		/>
																	</FormControl>

																	<FormMessage />
																</FormItem>
															)}
														/>
													</div>
												);
											})}
										</div>
									</li>
								);
							},
						)}
					</ul>
				</div>
				<OnWindowFormActionButtons submitBtnProps={{ isSubmitting }} />
			</form>
		</Form>
	);
};

export default NotificationsSettingsMapper;
