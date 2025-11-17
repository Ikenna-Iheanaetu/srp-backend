/** @format */

import LoadingIndicator from "@/components/common/loading-indicator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GoogleLogin } from "@react-oauth/google";
import { FC } from "react";
import { toast } from "sonner";
import { AuthType, useGoogleAuth } from "../use-google-auth";

interface Props {
	isSubmitting: boolean;
	submitText?: string;
	submittingText?: string;
	authType: AuthType;
}

export const AuthButtonGroup: FC<Props> = ({
	isSubmitting,
	submittingText = "Submitting...",
	submitText = "Submit",
	authType,
}) => {
	const btnStyles = "md:w-fit lg:w-auto md:mx-auto lg:mx-0";

	const { mutate: googleLogin, isPending: isGoogleSubmitting } =
		useGoogleAuth({
			authType,
		});

	const googleToastId = `google-${authType}-error`;

	return (
		<div className="flex flex-col gap-4 font-semibold">
			{/* Submit Button */}
			<Button
				type="submit"
				disabled={isSubmitting || isGoogleSubmitting}
				className={cn("button", btnStyles)}>
				{isSubmitting ? (
					<>
						{submittingText} <LoadingIndicator />
					</>
				) : (
					submitText
				)}
			</Button>

			<div className="flex justify-start items-center gap-2 w-full [&>*:first-child]:flex-1">
				<GoogleLogin
					onSuccess={(response) => {
						googleLogin({
							credential: response.credential,
						});
					}}
					onError={() =>
						toast.error("Google authentication failed", {
							id: googleToastId,
						})
					}
					type="standard"
					theme="outline"
					shape="rectangular"
					size="large"
					text={"continue_with"}
				/>

				{isGoogleSubmitting && <LoadingIndicator />}
			</div>
		</div>
	);
};
