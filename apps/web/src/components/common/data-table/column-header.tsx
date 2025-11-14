/** @format */

import { cn } from "@/lib/utils";
import React from "react";

interface Props {
	children: React.ReactNode;
	className?: string;
}

export const ColumnHeader: React.FC<Props> = ({ children, className }) => {
	return <div className={cn("w-max", className)}>{children}</div>;
};
