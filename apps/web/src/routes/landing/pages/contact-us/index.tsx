/** @format */

import SiteLogo from "@/components/common/site-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { moveToNextInputFieldOnEnter } from "@/lib/helper-functions";
import { cn } from "@/lib/utils";
import { ErrorMessage } from "@hookform/error-message";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { FC, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import { ContactUsFormData, contactUsSchema } from "./utils/form-schema";

const fieldLabels = [
	{ label: "first name", placeholder: "First name" },
	{ label: "last name", placeholder: "Last name" },
	{ label: "email", placeholder: "you@company.com" },
	{ label: "phone", placeholder: "+1 (555) 000-0000" },
	{ label: "message", placeholder: "Leave us a message" },
] as const;

const ContactUs: FC = () => {
	const formMethods = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phoneNumber: "",
			message: "",
			acceptPrivacyPolicy: false,
		},
		resolver: zodResolver(contactUsSchema),
		mode: "onBlur",
	});

	const { handleSubmit, formState, register, control, watch } = formMethods;

	const { defaultValues, errors } = formState;

	const onSubmit = useCallback((values: ContactUsFormData) => {
		toast.info("Form submission started", {
			description: "Your message is getting to us.",
		});
		console.log("Form submission", values);
	}, []);

	/**Callback ref to handle when component renders scroll to the left section */
	const scrollToRef = useCallback((container: HTMLElement | null) => {
		if (container) {
			container.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, []);

	const isPrivacyPolicyAccepted = watch("acceptPrivacyPolicy");

	return (
		<div className="mx-auto flex min-h-[100dvh] max-w-[1280px] flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 md:px-12 lg:h-[100dvh] lg:max-h-[800px] lg:flex-row lg:gap-16 lg:px-24">
			{/* left section */}
			<main
				ref={scrollToRef}
				className="flex w-full flex-col justify-center gap-4 lg:flex-1">
				{/* page intro description */}
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold sm:text-3xl">
						Get in touch
					</h1>
					<p className="text-sm text-gray-600 sm:text-base">
						Our friendly team would love to hear from you.
					</p>
				</div>

				{/* contact us form */}
				<Form {...formMethods}>
					<form
						onSubmit={(event) => void handleSubmit(onSubmit)(event)}
						className="grid grid-cols-1 gap-6 overflow-auto px-2 tw-scrollbar sm:grid-cols-2 sm:gap-8 md:gap-12">
						{(() => {
							if (!defaultValues) return null;

							const labelKeys = Object.keys(
								defaultValues,
							) as (keyof ContactUsFormData)[];

							return labelKeys.map((labelKey, index) => {
								// acceptPrivacyPolicy will be handle outside this loop
								if (labelKey === "acceptPrivacyPolicy") {
									return null;
								}

								const spansWider = [
									"email",
									"phoneNumber",
									"message",
								] as typeof labelKeys;
								return (
									<div
										className={cn(
											"relative flex flex-col gap-2",
											spansWider.includes(labelKey) &&
												"col-span-1 sm:col-span-2",
										)}
										key={`${labelKey}_${index}`}>
										<Label className="text-sm capitalize sm:text-base">
											{fieldLabels[index]?.label}
										</Label>

										{/* input field */}
										{(() => {
											let inputProps: React.InputHTMLAttributes<
												| HTMLInputElement
												| HTMLTextAreaElement
											>;

											switch (labelKey) {
												case "email":
													inputProps = {
														...register(labelKey),
														type: "email",
													};
													break;

												case "phoneNumber":
													inputProps = {
														...register(labelKey),
														type: "tel",
													};
													break;

												default: {
													inputProps = {
														...register(labelKey),
														type: "text",
													};
													break;
												}
											}

											inputProps = {
												...inputProps,
												onKeyDown: (event) => {
													moveToNextInputFieldOnEnter(
														event as unknown as KeyboardEvent,
													);
												},
												className: cn(
													"text-sm sm:text-base",
													errors[labelKey] &&
														"border-red-500",
												),
											};

											return (
												<>
													{labelKey === "message" ? (
														<Textarea
															{...inputProps}
															placeholder={
																fieldLabels[
																	index
																]?.placeholder
															}
															className="min-h-[100px] sm:min-h-[120px]"
														/>
													) : (
														<Input
															{...inputProps}
															placeholder={
																fieldLabels[
																	index
																]?.placeholder
															}
														/>
													)}

													<ErrorMessage
														errors={errors}
														name={labelKey}
														render={({
															message,
														}) => (
															<p className="absolute left-0 top-[110%] text-xs text-red-500">
																{message}
															</p>
														)}
													/>
												</>
											);
										})()}
									</div>
								);
							});
						})()}

						{/* agree to privacy policy */}
						<FormField
							control={control}
							name="acceptPrivacyPolicy"
							render={({ field }) => (
								<FormItem className="col-span-1 flex flex-row items-start space-x-2 sm:col-span-2">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="relative space-y-1 leading-none">
										<FormLabel className="text-sm sm:text-base">
											Accept terms and conditions
										</FormLabel>
										<FormDescription className="text-xs sm:text-sm">
											You agree to our friendly{" "}
											<Link to="#" className="underline">
												Privacy Policy
											</Link>
											.
										</FormDescription>
										<ErrorMessage
											errors={errors}
											name="acceptPrivacyPolicy"
											render={({ message }) => (
												<FormMessage className="absolute left-0 top-[110%] text-xs font-normal text-red-500">
													{message}
												</FormMessage>
											)}
										/>
									</div>
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							disabled={!isPrivacyPolicyAccepted}
							className="bg col-span-1 bg-lime-400 text-sm text-black hover:bg-lime-300 sm:col-span-2 sm:text-base">
							Submit
						</Button>
					</form>
				</Form>
			</main>

			<aside
				className={cn(
					"hidden h-[400px] w-full items-center justify-center bg-indigo-600 md:block lg:!flex lg:h-full lg:flex-1",
				)}
				style={{
					background:
						"linear-gradient(218.9deg, #504AC2 3.19%, #27245E 84.45%, #26235C 102.22%)",
				}}>
				<SiteLogo
					classNames={{
						root: "flex w-1/2 flex-col items-center justify-center gap-4",
						logoText: "lg:!bg-none lg:text-white",
						icon: "aspect-square h-auto w-full",
					}}
				/>
			</aside>
		</div>
	);
};

export default ContactUs;
