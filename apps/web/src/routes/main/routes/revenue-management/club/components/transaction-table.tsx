/** @format */

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HireHistoryTable } from "@/routes/main/routes/dashboard/admin/components/hire-history/data-table";
import { WithdrawalsTable } from "./withdrawals-table";
import { useQuery } from "@tanstack/react-query";
import { revenueManagementQueries } from "../query-factory";

// Transaction Table Component
export const TransactionTable: React.FC = () => {
   // Fetch revenue transactions data
   const { data: transactionsData } = useQuery(
      revenueManagementQueries.transactions({ limit: 10 })
   );

   // Fetch hire history data
   const { data: hireHistoryData, isLoading: isHireHistoryLoading } = useQuery(
      revenueManagementQueries.hireHistory({ limit: 10 })
   );


   const transactions = (transactionsData?.data || []).map((transaction) => ({
      ...transaction,
      status: transaction.status === "paid" ? "approved" as const : 
              transaction.status === "cancelled" ? "rejected" as const :
              transaction.status === "overdue" ? "pending" as const :
              transaction.status as "pending" | "approved" | "rejected" | "processed"
   }));
   const hireHistory = hireHistoryData?.data || [];
   
   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
         </div>

         <Tabs defaultValue="withdrawals" className="w-full">
            <TabsList className="flex w-full justify-start">
               <TabsTrigger value="hire-history" className="w-[180px] mx-1">Hire History</TabsTrigger>
               <TabsTrigger value="withdrawals" className="w-[180px]">Withdrawals</TabsTrigger>
            </TabsList>

            <TabsContent value="hire-history" className="space-y-4">
               {isHireHistoryLoading ? (
                  <div className="space-y-4 bg-white rounded-lg p-4 md:p-6">
                     <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                     <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                  </div>
               ) : (
                  <HireHistoryTable data={hireHistory} />
               )}
            </TabsContent>

            <TabsContent value="withdrawals" className="space-y-4">
               <WithdrawalsTable data={transactions} />
            </TabsContent>
         </Tabs>
      </div>
   );
};
