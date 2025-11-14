/** @format */

import { LinkButton } from "@/components/common/link-btn";
import {
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { removeTrailingSlash } from "@/lib/helper-functions/generic-string-helpers";
import { UserType } from "@/lib/schemas/user";
import { cn } from "@/lib/utils";
import { AuthCard } from "@/routes/auth/components/auth-card";
import { CircleCheck, Layers } from "lucide-react";
import { FC, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { AllowedSignupUserType } from "../signup-form/form-schema";

const USER_TYPE_SELECTION_OPTIONS = [
	{
		type: "company",
		label: "Company",
	},
	{
		type: "supporter",
		label: "Supporter",
	},
] as const satisfies {
	type: AllowedSignupUserType;
	label: string;
}[];

export const UserTypeSelector: FC = () => {
	const [selectedUserType, setSelectedUserType] = useState<UserType | null>(
		null
	);

	const { pathname } = useLocation();

	const currentRoute = removeTrailingSlash(pathname) as "/signup";

	const nextStepRoute = useMemo(
		() => `${currentRoute}/${selectedUserType ?? "#"}` as const,
		[currentRoute, selectedUserType]
	);

	return (
		<AuthCard className="card-root w-[70%] [&>*]:max-w-[330px] max-w-[320px] sm:py-8 sm:max-w-[448px] !top-1/2 -translate-y-1/2 !bottom-[unset]">
			<CardHeader>
				<CardTitle>
					<h1 className="text-base">What Kind of User are you ?</h1>
				</CardTitle>

				<CardDescription>
					<p className="text-base">
						Welcome! Please select an option.
					</p>
				</CardDescription>
			</CardHeader>

			<CardContent className="flex flex-col gap-2 w-[90%] sm:w-[60%] mx-auto">
				{/* type select */}
				<Select
					onValueChange={(value) =>
						setSelectedUserType(value as typeof selectedUserType)
					}>
					<SelectTrigger
						className="data-[placeholder]:text-neutral-400 [&_svg]:opacity-100 ring-1 ring-blue-600 focus:ring-blue-600 flex gap-2 overflow-hidden data-[state=open]:ring-1 data-[state=open]:ring-blue-700"
						aria-label="Choose user type">
						<Layers className="size-4 min-w-4" />
						<div className="[&_svg]:!hidden">
							<SelectValue placeholder="What type of user are you?" />
						</div>
					</SelectTrigger>

					<SelectContent className="bg-gray-100">
						{USER_TYPE_SELECTION_OPTIONS.map(
							({ type, label }, index) => {
								return (
									<SelectItem
										key={`${type}_${index}`}
										value={type}
										className={cn(
											"data-[state=checked]:!bg-white data-[state=checked]:!text-blue-700 text-neutral-500 [&_svg:last-child]:hidden",
											selectedUserType === type
												? "data-[highlighted]:!text-blue-700"
												: "data-[highlighted]:!bg-blue-700 data-[highlighted]:!text-white"
										)}>
										<div
											className="
                                            flex
                                            justify-start
                                            items-center
                                            gap-2">
											<CircleCheck className="size-4" />
											<span>{label}</span>
										</div>
									</SelectItem>
								);
							}
						)}
					</SelectContent>
				</Select>
				<p className="text-sm text-neutral-500">
					{selectedUserType
						? "Use the button below to proceed."
						: "To continue, please choose your preferred user option."}
				</p>
			</CardContent>

			<CardFooter className="w-full">
				<LinkButton
					to={nextStepRoute}
					prefetch="render"
					className={cn(
						"w-full",
						!selectedUserType && "pointer-events-none opacity-50"
					)}>
					Continue
				</LinkButton>
			</CardFooter>
		</AuthCard>
	);
};
