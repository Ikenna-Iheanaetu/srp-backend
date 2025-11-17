/** @format */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import type React from "react";

export interface SocialLink {
	platform: string;
	url: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Icon: React.ComponentType<any>;
}

interface ProfileLinksProps {
	website?: string;
	socialLinks?: SocialLink[];
}

export const ProfileLinks = ({ website, socialLinks }: ProfileLinksProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Links</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{/* Website Section */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-muted-foreground">
						Website
					</h3>
					{website ? (
						<Button
							variant="outline"
							className="w-full justify-start bg-transparent"
							asChild>
							<a
								href={website}
								target="_blank"
								rel="noopener noreferrer">
								<Globe className="h-4 w-4 mr-2" />
								{website.replace("https://", "")}
							</a>
						</Button>
					) : (
						<p className="text-sm text-slate-500">Not specified</p>
					)}
				</div>

				{/* Social Links Section */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-muted-foreground">
						Social
					</h3>
					<div className="space-y-2">
						{socialLinks
							? socialLinks.map((link) => (
									<Button
										key={link.platform}
										variant="outline"
										className="w-full justify-start bg-transparent capitalize"
										asChild>
										<a
											href={link.url}
											target="_blank"
											rel="noopener noreferrer">
											<link.Icon className="h-4 w-4" />
											<span className="ml-2">
												{link.platform}
											</span>
										</a>
									</Button>
							  ))
							: "No links specified"}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
