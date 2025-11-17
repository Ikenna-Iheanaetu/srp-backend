/** @format */

import { AuthDisplayLayout } from "@/routes/auth/components/auth-display-layout";
import { FC } from "react";
import { UserTypeSelector } from "./user-type-select";

const SignupIndexRoute: FC = () => {
	return (
		<AuthDisplayLayout>
			<UserTypeSelector />
		</AuthDisplayLayout>
	);
};

export default SignupIndexRoute;
