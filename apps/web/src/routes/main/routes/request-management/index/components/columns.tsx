/** @format */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
// import { MoreVertical } from "lucide-react";
import { Request } from "./types";

export const createColumns = (
   onViewDetails: (request: Request) => void
): ColumnDef<Request>[] => [
      {
         accessorKey: "dateTime",
         header: "Date/Time",
         cell: ({ row }) => (
            <div className="whitespace-nowrap">
               <span className="text-xs md:text-sm text-gray-900">{row.original.dateTime}</span>
            </div>
         ),
         size: 150,
         minSize: 150,
      },
      {
         accessorKey: "requestId",
         header: "Request ID",
         cell: ({ row }) => (
            <div className="whitespace-nowrap">
               <span className="text-xs md:text-sm font-medium text-gray-900">
                  {row.original.requestId}
               </span>
            </div>
         ),
         size: 130,
         minSize: 130,
      },
      {
         accessorKey: "initiator",
         header: "Initiator",
         cell: ({ row }) => (
            <div className="whitespace-nowrap">
               <span className="text-xs md:text-sm text-gray-900">
                  {row.original.initiator.type}
               </span>
            </div>
         ),
         size: 110,
         minSize: 110,
      },
      {
         accessorKey: "recipient",
         header: "Recipients",
         cell: ({ row }) => (
            <div className="whitespace-nowrap">
               <span className="text-xs md:text-sm text-gray-900">
                  {row.original.recipient.type}
               </span>
            </div>
         ),
         size: 110,
         minSize: 110,
      },
      {
         accessorKey: "status",
         header: "Status",
         cell: ({ row }) => {
            const status = row.original.status;
            const variant =
               status === "Hired"
                  ? "default"
                  : status === "Pending"
                     ? "secondary"
                     : "destructive";
            const colorClass =
               status === "Hired"
                  ? "bg-[#DCFCE7] font-normal shadow-none text-[#16A34A] hover:bg-[#DCFCE7]"
                  : status === "Pending"
                     ? "bg-[#F1F5F9] font-normal shadow-none text-gray-700 hover:bg-[#F1F5F9]"
                     : "bg-[#FEE2E2] font-normal shadow-none text-[#DC2626] hover:bg-[#FEE2E2]";

            return (
               <div className="whitespace-nowrap">
                  <Badge variant={variant} className={colorClass}>
                     {status}
                  </Badge>
               </div>
            );
         },
         size: 100,
         minSize: 100,
      },
      {
         id: "actions",
         header: "Actions",
         cell: ({ row }) => (
            <Button
               variant="ghost"
               size="icon"
               onClick={() => onViewDetails(row.original)}
               className="h-8 w-8 flex-shrink-0">
               {/* <MoreVertical className="h-4 w-4 text-gray-500" /> */}
               <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.16667 13.1586C7.16667 13.8919 7.76667 14.4919 8.50001 14.4919C9.23334 14.4919 9.83334 13.8919 9.83334 13.1586C9.83334 12.4253 9.23334 11.8253 8.50001 11.8253C7.76667 11.8253 7.16667 12.4253 7.16667 13.1586Z" stroke="#ADADAD" strokeWidth="1.5" />
                  <path d="M7.16667 3.82536C7.16667 4.55869 7.76667 5.15869 8.50001 5.15869C9.23334 5.15869 9.83334 4.55869 9.83334 3.82536C9.83334 3.09202 9.23334 2.49202 8.50001 2.49202C7.76667 2.49202 7.16667 3.09202 7.16667 3.82536Z" stroke="#ADADAD" strokeWidth="1.5" />
                  <path d="M7.16667 8.49186C7.16667 9.2252 7.76667 9.8252 8.50001 9.8252C9.23334 9.8252 9.83334 9.2252 9.83334 8.49186C9.83334 7.75853 9.23334 7.15853 8.50001 7.15853C7.76667 7.15853 7.16667 7.75853 7.16667 8.49186Z" stroke="#ADADAD" strokeWidth="1.5" />
               </svg>

            </Button>
         ),
         size: 80,
         minSize: 80,
      },
   ];

