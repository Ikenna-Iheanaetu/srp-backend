/** @format */

import { AuthDisplayLayout } from "@/routes/auth/components/auth-display-layout";
import { AuthFormsLogo } from "@/routes/auth/components/auth-forms-logo";
import { FC } from "react";
import { href, redirect, Route, Routes } from "react-router";
import { toast } from "sonner";
import { Route as RouteTypes } from "./+types/route";
import AuthSignupMapper from "./components/form";
import { getUserTypeFromParams } from "./utils";

export const clientLoader = ({
	params,
	request,
}: RouteTypes.ClientLoaderArgs) => {
	const userType = getUserTypeFromParams(params);
	if (!userType) {
		toast.error("Invalid URL", {
			id: request.url,
			description: "Matched user type is unknown",
			position: "top-center",
		});
		return redirect(href("/signup"));
	}
	return userType;
};

const SignupRewriteFormRoute: FC<RouteTypes.ComponentProps> = ({
	loaderData: userType,
}) => {
	return (
		<AuthDisplayLayout>
			<AuthFormsLogo />

			<Routes>
				<Route
					path={userType}
					element={
						<AuthSignupMapper
							key={userType} // reset all internal state when type changes
							userType={userType}
						/>
					}
				/>
			</Routes>
		</AuthDisplayLayout>
	);
};

export default SignupRewriteFormRoute;
