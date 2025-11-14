/** @format */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { Loader2, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { requestManagementQueries } from "../../query-factory";
import { Request } from "./types";

interface RequestDetailsSheetProps {
	request: Request | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const RequestDetailsSheet: React.FC<RequestDetailsSheetProps> = ({
	request,
	open,
	onOpenChange,
}) => {
	const {
		data: timeline,
		isLoading,
		isFetching,
	} = useQuery({
		...requestManagementQueries.details(request?.chatId ?? ""),
		enabled: open && !!request?.chatId,
	});

	if (!request) return null;

	const displayRequest = request;
	const timelineEvents = timeline ?? request.timeline ?? [];
	const timelineIsLoading = (isLoading || isFetching) && open;

	const statusColorClass =
		displayRequest.status === "Hired"
			? "bg-[#DCFCE7] font-normal shadow-none text-[#15803D] hover:bg-[#DCFCE7]"
			: displayRequest.status === "Pending"
		? "bg-[#F1F5F9] border border-gray-200 font-normal shadow-none text-gray-700 hover:bg-[#F1F5F9]"
		: "bg-[#FEE2E2] font-normal shadow-none text-[#B91C1C] hover:bg-[#FEE2E2]";

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-xl p-0 h-[70vh] md:h-full rounded-t-2xl md:rounded-tr-none md:rounded-tl-xl md:rounded-bl-xl"
			>
				<div className="h-full overflow-hidden flex flex-col rounded-t-2xl md:rounded-tr-none md:rounded-tl-xl md:rounded-bl-xl">
					<SheetHeader className="space-y-4 bg-[#F8FAFC] border-b border-[#F1F5F9] py-4 md:py-6 px-4 md:px-6 flex-shrink-0">
						<SheetTitle className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
							About this request
						</SheetTitle>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto p-4 md:p-6">
						<div className="mt-2 p-4 md:p-6 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] space-y-6 md:space-y-8">
							{/* Initiator */}
							<div className="flex items-center gap-4 md:gap-8">
								<span className="text-xs md:text-sm text-gray-600 min-w-[70px] md:min-w-[100px]">Initiator</span>
								<div className="flex items-center gap-2 md:gap-4">
									<Avatar className="h-8 w-8 md:h-10 md:w-10">
										<AvatarImage src={getFileNameUrl(displayRequest.initiator.avatar)} />
										<AvatarFallback className="bg-gray-200">
											<User className="h-4 w-4 md:h-6 md:w-6 text-gray-500" />
										</AvatarFallback>
									</Avatar>
									<span className="text-sm md:text-base font-medium text-gray-900">
										{displayRequest.initiator.name}
									</span>
								</div>
							</div>

							{/* Recipient */}
							<div className="flex items-center gap-4 md:gap-8">
								<span className="text-xs md:text-sm text-gray-600 min-w-[70px] md:min-w-[100px]">Recipient</span>
								<div className="flex items-center gap-2 md:gap-4">
									<Avatar className="h-8 w-8 md:h-10 md:w-10">
										<AvatarImage src={getFileNameUrl(displayRequest.recipient.avatar)} />
										<AvatarFallback className="bg-[#D1FAE5]">
											<User className="h-4 w-4 md:h-6 md:w-6 text-[#10B981]" />
										</AvatarFallback>
									</Avatar>
									<span className="text-sm md:text-base font-medium text-gray-900">
										{displayRequest.recipient.name}
									</span>
								</div>
							</div>

							{/* Status */}
							<div className="flex items-center gap-4 md:gap-8">
								<span className="text-xs md:text-sm text-gray-600 min-w-[70px] md:min-w-[100px]">Status</span>
								<Badge className={statusColorClass}>{displayRequest.status}</Badge>
							</div>
						</div>

						{/* Timeline */}
						{timelineIsLoading ? (
							<div className="mt-6 md:mt-10 flex items-center gap-2 text-xs md:text-sm text-gray-500">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span>Loading timeline…</span>
							</div>
						) : timelineEvents.length > 0 ? (
							<div className="mt-6 md:mt-10 space-y-0">
								{timelineEvents.map((event, index) => {
									const isFirst = index === 0;
									return (
										<div key={event.id} className="flex gap-2 md:gap-4 relative pb-4 md:pb-6">
											<div className="flex items-start pt-1 relative">
												{isFirst ? (
													<div
														className="h-4 w-4 md:h-5 md:w-5 rounded-full flex-shrink-0 relative z-10"
														style={{
															backgroundColor: "#84CC16",
															border: "2px solid #ECFCCB",
														}}
													/>
												) : (
													<div
														className="h-4 w-4 md:h-5 md:w-5 rounded-full flex-shrink-0 relative z-10"
														style={{
															backgroundColor: "white",
															border: "2px solid #F3F4F6",
														}}
													/>
												)}
												{index < timelineEvents.length - 1 && (
													<div
														className="absolute top-6 md:top-7 left-2 md:left-2.5 w-px h-full border-l-2 border-dotted border-gray-300"
													/>
												)}
											</div>
											<div className="flex-1 flex items-center justify-between gap-2 md:gap-4">
												<p className="text-xs md:text-sm text-gray-900 leading-relaxed flex-1">
													{event.description}
												</p>
												<p className="text-xs md:text-sm font-normal text-gray-500 whitespace-nowrap">
													{event.timestamp}
												</p>
											</div>
										</div>
									);
								})}
							</div>
						) : null}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};

