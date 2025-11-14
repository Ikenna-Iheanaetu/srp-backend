/** @format */

import { BadgeItemsList } from "@/components/common/badge-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmploymentTypesSectionProps {
	primaryType: string;
	secondaryTypes?: string[];
}

export function EmploymentTypesSection({
	primaryType,
	secondaryTypes = [],
}: EmploymentTypesSectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					Employment Preferences
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Primary Employment Type */}
				<div>
					<p className="mb-2 text-sm font-medium text-muted-foreground">
						Primary Preference
					</p>
					<Badge variant="default" className="text-sm px-3 py-1">
						{primaryType}
					</Badge>
				</div>

				{/* Secondary Employment Types */}

				<div>
					<p className="text-sm font-medium text-muted-foreground mb-2">
						Also Open To
					</p>

					<div className="flex flex-wrap gap-2">
						{secondaryTypes.length === 0 ? (
							<p className="text-sm text-muted-foreground italic">
								No additional preferences specified
							</p>
						) : (
							<BadgeItemsList items={secondaryTypes} />
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
