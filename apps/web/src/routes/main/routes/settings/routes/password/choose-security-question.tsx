/** @format */

"use client";

import { useFormContext } from "react-hook-form";

import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEffect, useId } from "react";
import { PasswordChangeForm } from "../../utils/password-schema";

const questionOptions = [
	"What’s your mother’s middle name ?",
	"In what city did you meet your spouse partner ?",
	"What was the name of your childhood best friend ?",
];

export function SecurityQestionSelector() {
	const {
		control,
		register,
		trigger,
		watch,
		formState: { errors },
	} = useFormContext<PasswordChangeForm>();

	const securityQuestion = watch("securityQuestion.question"); // Watch for question changes

	useEffect(() => {
		if (securityQuestion) {
			void trigger("securityQuestion.answer"); // Revalidate answer when question changes
		}
	}, [securityQuestion, trigger]);

	const answerId = useId();

	return (
		<FormField
			control={control}
			name="securityQuestion.question"
			render={({ field }) => (
				<FormItem>
					<Select
						onValueChange={field.onChange}
						defaultValue={field.value}>
						<FormControl>
							<SelectTrigger>
								<SelectValue
									placeholder="Security Question (for account recovery purposes)"
									aria-labelledby={answerId}
								/>
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{questionOptions.map((question, index) => (
								<SelectItem key={index} value={question}>
									{question}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<div className="relative">
						<Input
							{...register("securityQuestion.answer")}
							type="text"
							id={answerId}
						/>
						<p className="form-error">
							{errors.securityQuestion?.answer?.message}
						</p>
					</div>

					<FormMessage className="form-error" />
				</FormItem>
			)}
		/>
	);
}
