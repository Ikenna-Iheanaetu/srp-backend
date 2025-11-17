/** @format */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthStatus } from "@/hooks/use-auth-status-hook";
import { cn, getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Clock, Mail, Shield } from "lucide-react";
import React from "react";
import { href } from "react-router";
import { toast } from "sonner";
import { LinkButton } from "../../../components/common/link-btn";
import { profileQueries } from "../routes/profile/query-factory";
import { AllowedProfileUserTypeSchema } from "../routes/profile/schemas";
import { AxiosApiError } from "@/lib/axios-instance/types";

const AccessDeniedHeader = () => {
	return (
		<CardHeader className="text-center pb-4 px-4 lg:px-6">
			<div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
				<Shield className="w-6 h-6 lg:w-8 lg:h-8 text-orange-600" />
			</div>
			<CardTitle className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
				Account Pending Approval
			</CardTitle>
			<CardDescription className="text-base lg:text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
				Your account is currently under review by our administrators
			</CardDescription>
		</CardHeader>
	);
};

// Main Info Section Component
const MainInfoSection = () => {
	return (
		<div className="bg-orange-50 border border-orange-200 rounded-lg p-3 lg:p-4">
			<div className="flex items-start gap-3">
				<Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
				<div>
					<h3 className="font-semibold text-orange-900 mb-1 text-sm lg:text-base">
						What happens next?
					</h3>
					<p className="text-orange-800 text-xs lg:text-sm leading-relaxed">
						Our team is reviewing your account details and will
						approve access within 24-48 hours. You&apos;ll receive
						an email notification once your account is activated.
					</p>
				</div>
			</div>
		</div>
	);
};

const useApprovalUserQuery = () => {
	const { cookies } = useAuthStatus({
		assertAuthenticated: true,
		userTypesToAssert: AllowedProfileUserTypeSchema.options,
	});

	return useQuery(profileQueries.byUserType(cookies.userType));
};

const InfoCardsSection = () => {
	const { data } = useApprovalUserQuery();
	const userEmail = data?.email;
	return (
		<div className="grid gap-3 lg:gap-4 sm:grid-cols-2">
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
				<div className="flex items-start gap-3">
					<Mail className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
					<div>
						<h4 className="font-semibold text-blue-900 mb-1 text-sm lg:text-base">
							Stay Updated
						</h4>
						<p className="text-blue-800 text-xs lg:text-sm leading-relaxed">
							We&apos;ll notify you via email at{" "}
							{userEmail ?? "your-email"} as soon as your account
							is approved.
						</p>
					</div>
				</div>
			</div>

			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 lg:p-4">
				<div className="flex items-start gap-3">
					<Clock className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
					<div>
						<h4 className="font-semibold text-yellow-900 mb-1 text-sm lg:text-base">
							Review in Progress
						</h4>
						<p className="text-yellow-800 text-xs lg:text-sm leading-relaxed">
							Your application is currently being reviewed by our
							administrators.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

const RefreshStatusButton = () => {
	const { refetch, isRefetching, data: user } = useApprovalUserQuery();
	const [isLocalRefetching, setIsLocalRefetching] = React.useState(false);

	const toastIdRef = React.useRef<string | number>(null);
	const handleDismissToast = () => {
		if (toastIdRef.current) {
			toast.dismiss(toastIdRef.current);
		}
	};
	React.useEffect(() => {
		return handleDismissToast;
	}, []);

	const handleRefreshStatus = () => {
		const refreshPromise = new Promise<void>((resolve, reject) => {
			setIsLocalRefetching(true);
			refetch()
				.then(({ data, error }) => {
					setIsLocalRefetching(false);
					if (!data || error) {
						reject(
							error instanceof Error
								? error
								: new Error(
										typeof error === "string"
											? error
											: "Invalid response received"
								  )
						);
					}
					if (data?.isApproved) {
						resolve();
					} else {
						reject(new Error("Still pending approval"));
					}
				})
				.catch((error: AxiosApiError) => {
					setIsLocalRefetching(false);
					reject(error);
				});
		});
		handleDismissToast();
		toastIdRef.current = "refresh-approval-status";

		toast.promise(refreshPromise, {
			id: toastIdRef.current,
			description: "Attempting to refresh approval status.",
			loading: "Checking approval status...",
			success: "Account successfully approved.",
			error: (error) => getErrorMessage(error),
		});
	};

	const isRefreshingStatus =
		// used isLocalRefetching to prevent disabling button when another
		// component is polling data.
		user && !user.isApproved && isLocalRefetching && isRefetching;

	return (
		<Button
			className="button text-sm lg:text-base flex-1 sm:flex-none"
			onClick={handleRefreshStatus}
			disabled={isRefreshingStatus}>
			Refresh Status
		</Button>
	);
};

const StatusActionsSection = () => {
	return (
		<div className="text-center space-y-4">
			<div>
				<Badge
					variant="secondary"
					className="bg-gray-100 text-gray-700 px-2 lg:px-3 py-1 text-xs lg:text-sm">
					<Clock className="w-3 h-3 mr-1" />
					Status: Pending Review
				</Badge>
			</div>

			<div className="space-y-3">
				<p className="text-xs lg:text-sm text-gray-600 max-w-md mx-auto">
					Need immediate assistance or have questions about your
					account?
				</p>
				<div className="flex flex-col sm:flex-row gap-2 lg:gap-3 justify-center max-w-md mx-auto">
					<LinkButton
						variant={"outline"}
						className="border-lime-400 text-lime-700 hover:bg-lime-50 text-sm lg:text-base flex-1 sm:flex-none"
						to={href("/contact-us")}>
						<Mail className="w-4 h-4 mr-2" />
						Contact Support
					</LinkButton>

					<RefreshStatusButton />
				</div>
			</div>
		</div>
	);
};

interface PendingApprovalUIProps {
	className?: string;
}

const PendingApprovalUI: React.FC<PendingApprovalUIProps> = ({ className }) => {
	return (
		<Card
			className={cn(
				"max-w-4xl w-full min-h-[60vh] border-2 border-dashed border-gray-200",
				className
			)}>
			<AccessDeniedHeader />

			<CardContent className="space-y-4 lg:space-y-6 px-4 lg:px-6">
				<MainInfoSection />

				<InfoCardsSection />

				<Separator />

				<StatusActionsSection />
			</CardContent>
		</Card>
	);
};

export { PendingApprovalUI };
export type { PendingApprovalUIProps };
