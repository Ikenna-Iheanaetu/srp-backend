/** @format */

import LoadingIndicator from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FC } from "react";
import { useNavigate } from "react-router";

interface Props {
	submitBtnProps: {
		disabled?: boolean;
		isSubmitting: boolean;
	};
	className?: string;
}

/**To be used inside your form.
 * * The action buttons float on the window.
 */
const OnWindowFormActionButtons: FC<Props> = ({
	submitBtnProps,
	className,
}) => {
	const navigate = useNavigate();
	return (
		<div
			className={cn(
				"sticky bottom-0 right-0 flex !flex-row justify-end gap-4 p-4 w-fit ml-auto",
				className
			)}>
			<Button
				type="button"
				variant={"outline"}
				className="px-8"
				onClick={() => void navigate(-1)}>
				Cancel
			</Button>

			{(() => {
				const { disabled, isSubmitting, ...props } = submitBtnProps;
				return (
					<Button
						{...props}
						type="submit"
						className="button"
						disabled={disabled ?? isSubmitting}>
						{isSubmitting ? <LoadingIndicator /> : "Save Changes"}
					</Button>
				);
			})()}
		</div>
	);
};

export default OnWindowFormActionButtons;
