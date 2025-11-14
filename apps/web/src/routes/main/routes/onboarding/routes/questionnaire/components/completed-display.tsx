/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { href } from "react-router";

export function CompletedDisplay() {
	return (
		<div className="text-center space-y-4">
			<h2 className="text-xl font-bold">
				Thank you for completing the questionnaire!
			</h2>
			<p className="text-gray-600">Your responses have been recorded.</p>
			<div className="flex justify-between items-center">
				<LinkButton to={href("/dashboard")} variant={"outline"}>
					Dashboard
				</LinkButton>

				<LinkButton to={href("/profile")} className="button">
					View profile
				</LinkButton>
			</div>
		</div>
	);
}
