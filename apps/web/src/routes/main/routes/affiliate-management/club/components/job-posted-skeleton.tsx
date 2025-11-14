/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function JobPostedTableSkeleton() {
  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row items-start lg:items-center mb-4">
        <Skeleton className="h-8 w-44" />
        <div className="flex flex-col gap-2 lg:gap-0 w-full items-start justify-start lg:flex-row lg:items-center lg:justify-between py-4">
          <Skeleton className="h-10 w-48 hidden" />
          <div className="flex flex-col mt-2 md:mt-0 md:flex-row lg:justify-end items-end lg:items-center gap-2 w-full">
            <Skeleton className="h-10 w-full lg:max-w-lg" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(5)].map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-6 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {[...Array(5)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}
