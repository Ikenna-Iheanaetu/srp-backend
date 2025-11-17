/** @format */

import { FormInput } from "@/components/common/form/input";
import { FormProviderWrapper } from "@/components/common/form/wrapper";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiAxiosInstance } from "@/lib/axios-instance";
import { capitalize } from "@/lib/helper-functions";
import { cn, getErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod/v4";
import { useChatDetails } from "../../../../hooks/use-chat-details";

const formSchema = z.object({
	signingFee: z.coerce
		.number<string>()
		.positive("Signing fee must be positive number"),
	message: z.string().max(275, "275 characters max").optional(),
});

type PlayerHireFormType = z.infer<typeof formSchema>;

interface PlayerHireFormProps {
	onHireSuccess: () => void;
	onCancel: () => void;
	className?: string;
}
export const PlayerHireForm = ({
	onCancel,
	onHireSuccess,
	className,
}: PlayerHireFormProps) => {
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			signingFee: "",
			message: "",
		},
	});

	const { control } = form;

	const { data: chatDetails, isPending: isHiring } = useChatDetails();
	const recipient = chatDetails?.recipient;
	const { mutate: hire } = useMutation({
		mutationFn: async (formData: PlayerHireFormType) => {
			if (!recipient) {
				throw new Error(
					"[Hire recipient mutation]: Cannot get recipient data from chat details. ",
					{
						cause: recipient,
					},
				);
			}
			await apiAxiosInstance.post("/hire-player", {
				...formData,
				recipientId: recipient.id,
			});
		},
		onSuccess: (_) => {
			toast.success(
				`${capitalize(recipient?.userType ?? "Recipient")} - ${recipient?.name ?? ""}, hired successfully.`,
			);
			onHireSuccess();
		},
		onError: (error) => {
			toast.error(
				`Failed to hire ${capitalize(recipient?.userType ?? "Recipient")} - ${recipient?.name ?? ""}.`,
				{
					description: getErrorMessage(error),
				},
			);
		},
		meta: {
			errorMessage: "none",
		},
	});

	return (
		<FormProviderWrapper
			form={form}
			onSubmit={hire}
			className={cn("space-y-8", className)}>
			<div className="space-y-2">
				<Label aria-disabled htmlFor="hire-date">
					Hire Date
				</Label>

				<Input
					id="hire-date"
					type="date"
					value={dayjs().format("YYYY-MM-DD")}
					disabled
				/>
			</div>

			<FormInput
				control={control}
				path="signingFee"
				label="Signing Fee"
				placeholder="500,000"
			/>

			<FormInput
				variant="textarea"
				label="Message"
				control={control}
				path="message"
				placeholder="Congratulations and thank you for your support to Club X"
			/>

			<div className="!mt-12 flex flex-col gap-4">
				<Button className="button" type="submit">
					{isHiring ? (
						<>
							Hiring <LoadingIndicator />
						</>
					) : (
						"Hire"
					)}
				</Button>

				<Button type="button" variant={"outline"} onClick={onCancel}>
					Cancel
				</Button>
			</div>
		</FormProviderWrapper>
	);
};
