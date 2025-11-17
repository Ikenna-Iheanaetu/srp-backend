/** @format */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Building2 } from "lucide-react";
import { WithdrawalInvoice } from "../../query-factory";
import { formatCurrency } from "@/lib/helper-functions";

interface WithdrawalInvoiceDetailsSheetProps {
	invoice: WithdrawalInvoice | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const WithdrawalInvoiceDetailsSheet: React.FC<
	WithdrawalInvoiceDetailsSheetProps
> = ({ invoice, open, onOpenChange }) => {
	if (!invoice) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent 
				side="right"
				className="w-full sm:max-w-xl p-0 h-[70vh] md:h-full rounded-t-2xl md:rounded-tr-none md:rounded-tl-xl md:rounded-bl-xl"
			>
				<div className="h-full overflow-hidden flex flex-col rounded-t-2xl md:rounded-tr-none md:rounded-tl-xl md:rounded-bl-xl">
					<SheetHeader className="space-y-4 bg-[#F8FAFC] border-b border-[#F1F5F9] py-4 md:py-6 px-4 md:px-6 flex-shrink-0">
						<SheetTitle className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
							HIRE RECORD
						</SheetTitle>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto p-4 md:p-6">
					<div className="mt-2 p-6 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] space-y-6">
						{/* Invoice ID */}
						<div className="flex items-center gap-8">
							<span className="text-sm text-gray-600 min-w-[120px]">
								Invoice ID
							</span>
							<span className="text-base font-normal text-gray-900">
								{invoice.invoiceId}
							</span>
						</div>

						{/* Club */}
						<div className="flex items-center gap-8">
							<span className="text-sm text-gray-600 min-w-[120px]">Club</span>
							<div className="flex items-center gap-4">
								<Avatar className="h-10 w-10">
									<AvatarImage
										src={invoice.clubAvatar}
										alt={invoice.club}
									/>
									<AvatarFallback className="bg-[#E0F2FE]">
										<Building2 className="h-5 w-5 text-[#0284C7]" />
									</AvatarFallback>
								</Avatar>
								<span className="text-base font-normal text-gray-900">
									{invoice.club}
								</span>
							</div>
						</div>

						{/* Amount */}
						<div className="flex items-center gap-8">
							<span className="text-sm text-gray-600 min-w-[120px]">
								Amount
							</span>
							<span className="text-base font-normal text-gray-900">
								{formatCurrency(invoice.amount)}
							</span>
						</div>

						{/* Status */}
						<div className="flex items-center gap-8">
							<span className="text-sm text-gray-600 min-w-[120px]">
								Status
							</span>
							<Badge className={`status-${invoice.status?.toLowerCase()}`}>{invoice.status}</Badge>
						</div>
					</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};

