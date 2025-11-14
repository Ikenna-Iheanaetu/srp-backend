/** @format */

import { useFormContext } from "react-hook-form";
import { ClubStep1Form } from "./form-schema";
import { FormInput } from "@/components/common/form/input";

export const ClubAddressSectioin = () => {
	const form = useFormContext<ClubStep1Form>();
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-medium">Address Information</h3>

			<FormInput
				control={form.control}
				path="address.street"
				placeholder="123 Main Street"
				label={"Street Address"}
			/>

			<div className="grid grid-cols-2 gap-4 !mt-8">
				<FormInput
					control={form.control}
					path="address.city"
					label="City"
					placeholder="New York"
				/>

				<FormInput
					control={form.control}
					path="address.postalCode"
					label="Postal Code"
					placeholder="12345"
					type="number"
				/>
			</div>
		</div>
	);
};
