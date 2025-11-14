/** @format */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { ArrowUpDown } from "lucide-react";
import { ClassNameValue } from "tailwind-merge";

export interface Applicant {
  id: string;
  name: string;
  position: string;
  status: "pending" | "approved" | "rejected";
  date: string;
}

export const columns: ColumnDef<Applicant>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <span className="text-blue-700">{row.getValue("name")}</span>;
    },
  },
  {
    accessorKey: "position",
    header: "Applied Position",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const statusValue = row.getValue("status") as Applicant["status"];

      let statusStyles: ClassNameValue;

      switch (statusValue) {
        case "pending":
          statusStyles = "bg-gray-100 border-gray-200 text-gray-700";
          break;

        case "approved":
          statusStyles = "bg-green-100 border-green-200 text-green-700";
          break;

        case "rejected":
          statusStyles = "bg-red-100 border-red-200 text-red-700";
          break;

        default:
          break;
      }

      return (
        <div
          className={cn(
            statusStyles,
            "flex justify-center items-center px-2 py-1 rounded-full capitalize border w-fit"
          )}
        >
          {statusValue}
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.original.date;
      return <span>{dayjs(date).format("YYYY-MM-DD")}</span>;
    },
  },
];
