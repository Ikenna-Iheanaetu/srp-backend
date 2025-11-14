/** @format */

import { FileText } from "lucide-react";
import { FC } from "react";

interface InvoiceSummaryCardsProps {
	paidCount: number;
	pendingCount: number;
}

export const InvoiceSummaryCards: FC<InvoiceSummaryCardsProps> = ({
	paidCount,
	pendingCount,
}) => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
			{/* Paid Invoices Card */}
			<div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
				<div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
					<div className="rounded-lg">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M11.7666 7.5H13.5666V16.5H11.7666V7.5ZM15.3666 11.1H17.1666V16.5H15.3666V11.1ZM8.16662 12.9H9.96662V16.5H8.16662V12.9ZM15.3666 4.8H6.36662V19.2H18.9666V8.4H15.3666V4.8ZM4.56662 3.8928C4.56662 3.3996 4.96892 3 5.46572 3H16.2666L20.7666 7.5V20.0937C20.7675 20.2119 20.745 20.3291 20.7005 20.4386C20.6561 20.5481 20.5905 20.6478 20.5075 20.7319C20.4245 20.8161 20.3257 20.8831 20.2169 20.9291C20.108 20.9751 19.9911 20.9992 19.8729 21H5.46032C5.22396 20.9984 4.99774 20.9038 4.83052 20.7367C4.6633 20.5697 4.56851 20.3436 4.56662 20.1072V3.8928Z" fill="#64748B" />
						</svg>
					</div>
					<h3 className="text-base md:text-lg font-normal mt-0.5 text-gray-900">Paid Invoices</h3>
				</div>
				<div className="text-2xl md:text-3xl font-semibold text-gray-900">{paidCount}</div>
			</div>

			{/* Pending Invoices Card */}
			<div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
				<div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
					<div className="rounded-lg">
						<FileText className="w-6 h-6 text-slate-500" />
					</div>
					<h3 className="text-base md:text-lg font-normal mt-0.5 text-gray-900">Pending Invoices</h3>
				</div>
				<div className="text-2xl md:text-3xl font-semibold text-gray-900">{pendingCount}</div>
			</div>
		</div>
	);
};
