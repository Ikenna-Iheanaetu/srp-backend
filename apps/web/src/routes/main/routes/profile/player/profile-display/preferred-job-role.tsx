/** @format */

import { BadgeItemsList } from "@/components/common/badge-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreferredJobRoleSectionProps {
	primaryType: string;
	secondaryTypes?: string[];
}

export function PreferredJobRoleSection({
	primaryType,
	secondaryTypes,
}: PreferredJobRoleSectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					Job Role Preferences
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Primary Employment Type */}
				<div>
					<p className="text-muted-foreground mb-2 text-sm font-medium">
						Primary Preference
					</p>
					<Badge variant="default" className="px-3 py-1 text-sm">
						{primaryType}
					</Badge>
				</div>

				{/* Secondary roles */}

				<div>
					<p className="text-muted-foreground mb-2 text-sm font-medium">
						Also Open To
					</p>

					<div className="flex flex-wrap gap-2">
						{secondaryTypes?.length === 0 ? (
							<p className="text-muted-foreground text-sm italic">
								No additional preferences specified
							</p>
						) : (
							<BadgeItemsList items={secondaryTypes ?? []} />
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
