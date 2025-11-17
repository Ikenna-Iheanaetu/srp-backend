/** @format */

import React, { FC } from "react";
import { AuthDisplayLayout } from "../components/auth-display-layout";
import { AuthFormsLogo } from "../components/auth-forms-logo";

export const LoginDisplayLayout: FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	return (
		<AuthDisplayLayout>
			<AuthFormsLogo />

			{children}
		</AuthDisplayLayout>
	);
};
