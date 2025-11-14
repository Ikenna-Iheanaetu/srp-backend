/** @format */

import React, { createContext, useContext } from "react";

export interface ProgressTrackingContext {
	currentStepIndex: number;
	setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const ProgressTrackingContext =
	createContext<ProgressTrackingContext | null>(null);

export const useProgressTrackingContext = () => {
	const context = useContext(ProgressTrackingContext);
	if (!context) {
		throw new Error(
			"useProgressTrackingContext must be used within a OnboardingProgressHandlerContext provider"
		);
	}
	return context;
};
