/** @format */

import { InquirySearchParams } from "../schemas";

export const InquiryDetailsDisplay = ({
	hired,
	companyName,
	userEmail,
}: Pick<InquirySearchParams, "hired" | "companyName" | "userEmail">) => (
	<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
		<h3 className="mb-2 text-sm font-semibold text-slate-900">
			Inquiry Details
		</h3>

		<div className="space-y-2 text-sm text-slate-600">
			<p className="capitalize">
				<span className="font-medium">your response:</span>{" "}
				{hired ? "I was hired" : "I wasn't hired"}
			</p>
			<p>
				<span className="font-medium">Company:</span> {companyName}
			</p>
			<p>
				<span className="font-medium">Your Email:</span> {userEmail}
			</p>
		</div>
	</div>
);
