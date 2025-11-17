/** @format */

import type React from "react";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, ButtonProps } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "../ui/badge";
import { FormInput } from "./form/input";
import { FormProviderWrapper } from "./form/wrapper";

const getConfirmationSchema = (confirmText: string) =>
	z.object({
		confirmationText: z
			.string()
			.min(1, "Confirmation text is required")
			.refine((val) => val.toLowerCase() === confirmText.toLowerCase(), {
				message: `You must type "${confirmText}" exactly`,
			}),
	});

type ConfirmationForm = z.infer<ReturnType<typeof getConfirmationSchema>>;

interface CriticalActionConfirmationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmText: string;
	confirmPlaceholder?: string;
	confirmButtonText?: string;
	confirmButtonVariant?: ButtonProps["variant"];
	cancelButtonText?: string;
	/**Dialog closes on confirm */
	onConfirm: () => void;
	onCancel?: () => void;
	icon?: React.ReactNode;
}

/**To be used for confirming users' critical actions */
const CriticalActionConfirmationDialog: React.FC<
	CriticalActionConfirmationDialogProps
> = ({
	open,
	onOpenChange,
	title,
	description,
	confirmText = "confirm",
	confirmPlaceholder,
	confirmButtonText = "Confirm",
	confirmButtonVariant = "destructive",
	cancelButtonText = "Cancel",
	onConfirm,
	onCancel,
	icon,
}: CriticalActionConfirmationDialogProps) => {
	const confirmationSchema = useMemo(
		() => getConfirmationSchema(confirmText),
		[confirmText]
	);

	const form = useForm<ConfirmationForm>({
		resolver: zodResolver(confirmationSchema),
		defaultValues: {
			confirmationText: "",
		},
	});

	const { reset, watch } = form;

	// Reset form when dialog opens/closes
	useEffect(() => {
		if (!open) {
			reset();
		}
	}, [open, reset]);

	const onSubmit = () => {
		onConfirm();
		onOpenChange(false);
	};

	const handleCancel = () => {
		onCancel?.();
		onOpenChange(false);
	};

	const watchedText = watch("confirmationText");
	const isFormValid = watchedText.toLowerCase() === confirmText.toLowerCase();

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className={"sm:max-w-md"}>
				<AlertDialogHeader className="space-y-4">
					<div className="flex items-center gap-3">
						{icon ?? (
							<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
								<AlertTriangle className="w-5 h-5 text-red-600" />
							</div>
						)}

						<AlertDialogTitle className="flex-1 text-lg font-semibold text-gray-900">
							{title}
						</AlertDialogTitle>
					</div>

					<AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<FormProviderWrapper form={form} onSubmit={onSubmit}>
					<FormInput
						control={form.control}
						path="confirmationText"
						placeholder={
							confirmPlaceholder ??
							`Type "${confirmText}" here...`
						}
						className="font-mono"
						autoComplete="off"
						autoFocus
						label={
							<div className="text-sm font-medium text-gray-700">
								Type{" "}
								<Badge
									className="font-mono"
									variant={"secondary"}>
									{confirmText}
								</Badge>{" "}
								to confirm:
							</div>
						}
					/>

					<AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							className="flex-1 sm:flex-none bg-transparent">
							{cancelButtonText}
						</Button>

						<Button
							type="submit"
							variant={confirmButtonVariant}
							disabled={!isFormValid}
							className="flex-1 sm:flex-none">
							{confirmButtonText}
						</Button>
					</AlertDialogFooter>
				</FormProviderWrapper>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export { CriticalActionConfirmationDialog };
export type { CriticalActionConfirmationDialogProps };
