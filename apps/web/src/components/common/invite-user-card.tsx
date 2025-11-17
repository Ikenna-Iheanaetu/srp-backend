/** @format */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BRAND_NAME } from "@/constants/brand";
import { cn } from "@/lib/utils";
import {
	AllowedSignupUserType,
	AllowedSignupUserTypeSchema,
	RefCodeSchema,
} from "@/routes/auth/signup/routes/signup-form/form-schema";
import { serializeSignupParams } from "@/routes/auth/signup/routes/signup-form/hooks/use-signup-search-params";
import { Slot } from "@radix-ui/react-slot";
import React from "react";
import { z } from "zod";
import { CopyToClipboardButton } from "./copy-to-clipboard-button";
import { QRCodeWithDownload, QRCodeWithDownloadProps } from "./qr-code";

/**
 * **NOTE**: This is a partial invitation link type, because it doesn't validate if refCode search param is present.
 *
 * For the full link type, use {@link InviteUserLink} instead.
 */
type BaseInviteUserLink<
	TUserType extends AllowedSignupUserType = AllowedSignupUserType,
> = `${string}/signup/${TUserType}`;

/**
 * **NOTE**: This is a partial validation schema, because it doesn't validate if refCode search param is present.
 *
 * For full validation, use {@link InviteUserLinkSchema} instead.
 */
const BaseInviteUserLinkSchema = z
	.string()
	.url({ message: "Invalid generated link" })
	.refine(
		(link): link is BaseInviteUserLink => {
			const { pathname } = new URL(link);
			const userTypePattern =
				AllowedSignupUserTypeSchema.options.join("|");
			const pathRegex = new RegExp(`^/signup/(${userTypePattern})`);
			return pathRegex.test(pathname);
		},
		{ message: "Invalid invitation URL" },
	);

type InviteUserLink<
	TUserType extends AllowedSignupUserType = AllowedSignupUserType,
	TRefCode extends string = string,
> = `${BaseInviteUserLink<TUserType>}?refCode=${TRefCode}&wasInvited=true`;

const InviteUserLinkSchema = BaseInviteUserLinkSchema.refine(
	(link) => {
		const { searchParams } = new URL(link);
		const refCode = searchParams.get("refCode");
		const refCodeValidation = RefCodeSchema.safeParse(refCode);
		return refCodeValidation.success;
	},
	{ message: "Invalid invitation ref code" },
).transform((val) => val as InviteUserLink);

const generateUserInviteLink = ({
	userType,
	refCode,
}: {
	userType: AllowedSignupUserType;
	refCode: string;
}) =>
	(`${window.location.origin}/signup/${userType}` +
		serializeSignupParams({ refCode, wasInvited: true })) as InviteUserLink;

interface InviteUserSharedProps {
	className?: string;
	children?: React.ReactNode;
}

const InviteUserCard: React.FC<InviteUserSharedProps> = ({
	className,
	children,
}) => (
	<Card
		className={cn(
			"max-h-[calc(100vh-12rem)] w-full max-w-xl overflow-y-scroll border-none shadow-none tw-scrollbar sm:h-auto",
			className,
		)}>
		{children}
	</Card>
);

const InviteUserCardContent: React.FC<InviteUserSharedProps> = ({
	className,
	children,
}) => (
	<CardContent className={cn("space-y-8", className)}>{children}</CardContent>
);

const InviteUserFormSection: React.FC<
	InviteUserSharedProps & { asChild?: boolean }
> = ({ className, children, asChild }) => {
	const Comp = asChild ? Slot : "div";
	return <Comp className={cn("space-y-2", className)}>{children}</Comp>;
};

const InviteUserSubmitButton: React.FC<React.ComponentProps<typeof Button>> = ({
	className,
	type = "submit",
	...props
}) => (
	<Button
		{...props}
		type={type}
		className={cn("ml-auto flex button", className)}
	/>
);

const InviteUserLinkSection: React.FC<InviteUserSharedProps> = ({
	className,
	children,
}) => <div className={cn("my-10 space-y-2", className)}>{children}</div>;

interface InviteUserLinkDisplayProps {
	inviteLink: InviteUserLink;
	className?: string;
}
const InviteUserLinkDisplay: React.FC<InviteUserLinkDisplayProps> = ({
	inviteLink,
	className,
}) => {
	const linkValidation = InviteUserLinkSchema.safeParse(inviteLink);

	return (
		<div>
			<div className={cn("relative flex items-center gap-2", className)}>
				<Input value={inviteLink} readOnly className="flex-1" />

				<CopyToClipboardButton clipboardItem={inviteLink} />
			</div>

			{!linkValidation.success && (
				<div className="form-error static space-y-2">
					<p>Invalid generated link format:</p>
					<p>
						{linkValidation.error.issues
							.map((issue) => issue.message)
							.join(" ,")}
					</p>
				</div>
			)}
		</div>
	);
};

/**A helper to avoid always constructing a filename with predefined parts. */
const generateInviteQRCodeFilename = (userType?: AllowedSignupUserType) =>
	`${BRAND_NAME}_${userType ?? ""}_invite_qr_code`;
interface InviteUserQRCodeProps extends QRCodeWithDownloadProps {
	value: InviteUserLink;
}

const defaultFilename = generateInviteQRCodeFilename();
const InviteUserLinkQRCode: React.FC<InviteUserQRCodeProps> = ({
	label = "Invitation link QR code",
	filename = defaultFilename,
	...props
}) => <QRCodeWithDownload {...props} filename={filename} label={label} />;

export {
	BaseInviteUserLinkSchema,
	generateInviteQRCodeFilename,
	generateUserInviteLink,
	InviteUserCard,
	InviteUserCardContent,
	InviteUserFormSection,
	InviteUserLinkDisplay,
	InviteUserLinkSchema,
	InviteUserLinkSection,
	InviteUserLinkQRCode,
	InviteUserSubmitButton,
};

export type {
	BaseInviteUserLink,
	InviteUserLink,
	InviteUserLinkDisplayProps,
	InviteUserQRCodeProps,
	InviteUserSharedProps,
};
