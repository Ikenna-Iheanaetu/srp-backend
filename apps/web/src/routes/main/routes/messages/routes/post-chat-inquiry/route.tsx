/** @format */

import { LoadingIndicator } from "@/components/common/loading-indicator";
import SiteLogo from "@/components/common/site-logo";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DISPLAY_LAYOUT_CONTAINER_STYLES } from "@/constants";
import { cn } from "@repo/shared";
import { MailQuestion } from "lucide-react";
import { useQueryStates } from "nuqs";
import { InquiryDetailsDisplay } from "./components/inquiry-details-display";
import { InvalidParamsWarning } from "./components/invalid-params-warning";
import { RightSidebar } from "./components/right-sidebar";
import { InquirySearchParams, inquirySearchParams } from "./schemas";
import { useConfirmInquiry } from "./use-confirm-inquiry";
import React from "react";

// NOTE: This route should be nested directly under the root layout

export default function PostChatInquiryRoute() {
	const [searchParams, setSearchParams] = useQueryStates(inquirySearchParams);

	const isSearchParamsValid = (
		params: typeof searchParams,
	): params is InquirySearchParams =>
		Object.values(params).every((param) => param !== null);

	const {
		mutate: confirmInquiry,
		isPending: isConfirmingInquiry,
		failureCount,
	} = useConfirmInquiry();
	const hasFailedConfirmation = failureCount > 0;
	const onConfirmInquiry = React.useEffectEvent(() => {
		if (!isSearchParamsValid(searchParams)) {
			return;
		}
		const { companyName: _, ...body } = searchParams;
		confirmInquiry(body);
	});

	React.useEffect(() => {
		// Confirm immediately on page load
		onConfirmInquiry();
	}, []);

	return (
		<div className={cn(DISPLAY_LAYOUT_CONTAINER_STYLES, "bg-gray-50")}>
			<div className="flex h-full flex-col items-center gap-4 p-4 pb-0 lg:p-8">
				<SiteLogo variant="dark" />

				<Card className="w-full max-w-lg flex-1 overflow-auto border-0 shadow-lg tw-scrollbar">
					<CardHeader className="pb-4 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
							<MailQuestion className="h-8 w-8 text-green-500" />
						</div>
						<CardTitle className="text-2xl font-bold text-gray-900">
							Were you hired?
						</CardTitle>
						<CardDescription className="mt-2 text-base text-gray-600">
							We wanted to follow up:{" "}
							<strong>did they offer you the opportunity?</strong>
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						{isSearchParamsValid(searchParams) ? (
							<>
								<InquiryDetailsDisplay {...searchParams} />
								<form
									className="space-y-6"
									onSubmit={(e) => {
										e.preventDefault();
										onConfirmInquiry();
									}}>
									<RadioGroup
										disabled={isConfirmingInquiry}
										value={String(searchParams.hired)}
										onValueChange={(value) => {
											// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
											const hired = JSON.parse(value);
											if (typeof hired !== "boolean") {
												return;
											}
											void setSearchParams({
												hired: hired,
											});
										}}>
										{(
											[
												{
													hired: true,
													label: "I was hired",
												},
												{
													hired: false,
													label: "I wasn't hired",
												},
											] satisfies {
												hired: boolean;
												label: string;
											}[]
										).map(({ hired, label }) => {
											const key =
												"inquiry-option-" + hired;
											return (
												<div
													key={key}
													className="flex items-center gap-3">
													<RadioGroupItem
														className="border-lime-400 [&_svg]:size-3 [&_svg]:data-[state=checked]:!fill-blue-700"
														value={String(hired)}
														id={key}
													/>
													<Label htmlFor={key}>
														{label}
													</Label>
												</div>
											);
										})}
									</RadioGroup>

									<Button
										type="submit"
										disabled={isConfirmingInquiry}
										className="w-full button">
										{isConfirmingInquiry ? (
											<>
												Confirming <LoadingIndicator />
											</>
										) : hasFailedConfirmation ? (
											"Retry confirmation"
										) : (
											"Confirm"
										)}
									</Button>
								</form>
							</>
						) : (
							<InvalidParamsWarning />
						)}
					</CardContent>
				</Card>
			</div>

			<RightSidebar />
		</div>
	);
}
