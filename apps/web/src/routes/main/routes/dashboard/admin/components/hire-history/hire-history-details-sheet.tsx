/** @format */

import { FC } from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HireHistoryItem } from "../../query-factory";
import { formatCurrency } from "@/lib/helper-functions";
import { Building2 } from "lucide-react";

interface HireHistoryDetailsSheetProps {
	item: HireHistoryItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const HireHistoryDetailsSheet: FC<HireHistoryDetailsSheetProps> = ({
	item,
	open,
	onOpenChange,
}) => {
	if (!item) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-xl p-0 h-[70vh] md:h-full rounded-t-2xl md:rounded-tr-none md:rounded-tl-xl md:rounded-bl-xl"
			>
				<div className="h-full overflow-hidden flex flex-col rounded-t-2xl md:rounded-tr-none md:rounded-tl-xl md:rounded-bl-xl">
					<SheetHeader className="space-y-4 bg-[#F8FAFC] border-b border-[#F1F5F9] py-4 md:py-6 px-4 md:px-6 flex-shrink-0">
						<SheetTitle className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
							HIRE HISTORY DETAILS
						</SheetTitle>
					</SheetHeader>

					<div className="flex-1 overflow-y-auto p-4 md:p-6">
						<div className="mt-2 p-4 md:p-6 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] space-y-4 md:space-y-6">
							{/* Invoice ID */}
							<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
								<span className="text-xs md:text-sm text-gray-600 md:min-w-[120px]">
									Invoice ID
								</span>
								<span className="text-sm md:text-base font-normal text-gray-900">
									{item.invoiceId}
								</span>
							</div>

							{/* Name */}
							<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
								<span className="text-xs md:text-sm text-gray-600 md:min-w-[120px]">Name</span>
								<span className="text-sm md:text-base font-normal text-gray-900">
									{item.name}
								</span>
							</div>

							{/* Company Name */}
							<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
								<span className="text-xs md:text-sm text-gray-600 md:min-w-[120px]">
									Company Name
								</span>
								<span className="text-sm md:text-base font-normal text-gray-900">
									{item.companyName}
								</span>
							</div>

							{/* Club */}
							<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
								<span className="text-xs md:text-sm text-gray-600 md:min-w-[120px]">Club</span>
								<div className="flex items-center gap-3 md:gap-4">
									<Avatar className="h-8 w-8 md:h-10 md:w-10">
										<AvatarImage
											src={item.club}
											alt={item.club}
										/>
										<AvatarFallback className="bg-[#E0F2FE]">
											<Building2 className="h-4 w-4 md:h-5 md:w-5 text-[#0284C7]" />
										</AvatarFallback>
									</Avatar>
									<span className="text-sm md:text-base font-normal text-gray-900">
										{item.club}
									</span>
								</div>
							</div>

							{/* Amount */}
							<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
								<span className="text-xs md:text-sm text-gray-600 md:min-w-[120px]">
									Amount (30% of total)
								</span>
								<span className="text-sm md:text-base font-normal text-gray-900">
									{formatCurrency(item.amount)}
								</span>
							</div>

							{/* Date */}
							<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
								<span className="text-xs md:text-sm text-gray-600 md:min-w-[120px]">Date</span>
								<span className="text-sm md:text-base font-normal text-gray-900">
									{item.dateTime}
								</span>
							</div>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};

