/** @format */

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { LinkButton } from "./link-btn";
import { href } from "react-router";

interface ErrorScreenProps {
	children: ReactNode;
	className?: string;
}

interface ErrorScreenIconProps {
	icon?: ReactNode;
	className?: string;
}

interface ErrorScreenHeaderProps {
	title?: string;
	description?: string;
	className?: string;
}

interface ErrorScreenDetailsProps {
	errorMessage?: string;
	showInProduction?: boolean;
	className?: string;
}

interface ErrorScreenActionsProps {
	onRetry?: () => void;
	onGoHome?: () => void;
	retryLabel?: string;
	homeLabel?: string;
	className?: string;
}

interface ErrorScreenSupportProps {
	supportText?: string;
	className?: string;
}

function ErrorScreen({ children, className = "" }: ErrorScreenProps) {
	return (
		<div
			className={`min-h-screen flex items-center justify-center bg-background px-4 ${className}`}>
			<div className="max-w-md w-full text-center space-y-6">
				{children}
			</div>
		</div>
	);
}

function ErrorScreenIcon({ icon, className = "" }: ErrorScreenIconProps) {
	return (
		<div className={`flex justify-center ${className}`}>
			<div className="rounded-full bg-destructive/10 p-4">
				{icon ?? (
					<AlertTriangle className="h-12 w-12 text-destructive" />
				)}
			</div>
		</div>
	);
}

function ErrorScreenHeader({
	title = "Something went wrong",
	description = "We encountered an unexpected error. Please try again or return to the homepage.",
	className = "",
}: ErrorScreenHeaderProps) {
	return (
		<div className={`space-y-3 ${className}`}>
			<h1 className="text-2xl font-semibold text-foreground">{title}</h1>
			<p className="text-muted-foreground leading-relaxed">
				{description}
			</p>
		</div>
	);
}

function ErrorScreenDetails({
	errorMessage,
	showInProduction = false,
	className = "",
}: ErrorScreenDetailsProps) {
	if (!errorMessage || (!showInProduction && !import.meta.env.DEV)) {
		return null;
	}

	return (
		<div className={`bg-muted/50 rounded-lg p-4 text-left ${className}`}>
			<h3 className="font-medium text-sm text-foreground mb-2">
				Error Details:
			</h3>
			<code className="text-xs text-muted-foreground break-all">
				{errorMessage}
			</code>
		</div>
	);
}

function ErrorScreenActions({
	onRetry,
	onGoHome,
	retryLabel = "Try Again",
	homeLabel = "Go Home",
	className = "",
}: ErrorScreenActionsProps) {
	const handleRetry = () => {
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	};

	const handleGoHome = () => {
		if (onGoHome) {
			onGoHome();
		} else {
			window.location.href = "/";
		}
	};

	return (
		<div
			className={`flex flex-col sm:flex-row gap-3 justify-center ${className}`}>
			<Button
				onClick={handleRetry}
				className="flex items-center gap-2 button">
				<RotateCcw className="h-4 w-4" />
				{retryLabel}
			</Button>
			<Button
				variant="outline"
				onClick={handleGoHome}
				className="flex items-center gap-2 bg-transparent">
				<Home className="h-4 w-4" />
				{homeLabel}
			</Button>
		</div>
	);
}

function ErrorScreenSupport({
	supportText = "If this problem persists, please",
	className = "",
}: ErrorScreenSupportProps) {
	return (
		<div className={`text-sm text-muted-foreground ${className}`}>
			{supportText}{" "}
			<LinkButton
				to={href("/contact-us")}
				variant={"link"}
				className="underline hover:text-foreground transition-colors">
				contact support
			</LinkButton>
		</div>
	);
}

ErrorScreen.Icon = ErrorScreenIcon;
ErrorScreen.Header = ErrorScreenHeader;
ErrorScreen.Details = ErrorScreenDetails;
ErrorScreen.Actions = ErrorScreenActions;
ErrorScreen.Support = ErrorScreenSupport;

export {
	ErrorScreen,
	ErrorScreenActions,
	ErrorScreenDetails,
	ErrorScreenHeader,
	ErrorScreenIcon,
	ErrorScreenSupport,
};

export type {
	ErrorScreenActionsProps,
	ErrorScreenDetailsProps,
	ErrorScreenHeaderProps,
	ErrorScreenIconProps,
	ErrorScreenProps,
	ErrorScreenSupportProps,
};
