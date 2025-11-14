/** @format */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet } from "lucide-react";
import { LayersMetricsClubCard } from "../../dashboard/club/components/club-metrics-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Import components
import { 
   MonthlyChart, 
   TransactionTable, 
   WithdrawalModal, 
   WithdrawalSuccessModal 
} from "./components";

// Import query factory
import { revenueManagementQueries } from "./query-factory";

export default function ClubRevenueManagement() {
   const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
   const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
   const [withdrawalAmount, setWithdrawalAmount] = useState("");
   const queryClient = useQueryClient();

   // Fetch revenue dashboard data
   const { data: dashboardData, isLoading: isDashboardLoading } = useQuery(
      revenueManagementQueries.dashboard()
   );

   // Withdrawal request mutation
   const withdrawalMutation = useMutation({
      mutationFn: (data: { invoiceId: string; amount: number; notes?: string }) => 
         revenueManagementQueries.withdrawalRequest(data),
      onSuccess: (data: { amount: number }) => {
         toast.success("Withdrawal request submitted successfully");
         setWithdrawalAmount(data.amount.toString());
         setIsSuccessModalOpen(true);
         // Invalidate dashboard data to refresh metrics
         void queryClient.invalidateQueries({
            queryKey: revenueManagementQueries.all(),
         });
      },
      onError: (_error: Error) => {
         toast.error("Failed to submit withdrawal request");
      },
   });

   const handleWithdrawalSuccess = (_amount: string) => {
      // This will be handled by the mutation's onSuccess callback
   };

   if (isDashboardLoading) {
      return (
         <div className="space-y-8">
            <div className="animate-pulse space-y-6 mt-10 bg-white p-6 rounded-2xl border border-gray-200">
               <div className="h-6 bg-gray-200 rounded w-1/4"></div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                     <div key={i} className="h-32 bg-gray-200 rounded"></div>
                  ))}
               </div>
            </div>
         </div>
      );
   }

   const metrics = dashboardData?.metrics || {
      totalAccumulatedRevenue: 0,
      currentBalance: 0,
      totalInvoicedRevenue: 0,
      pendingRevenue: 0,
   };

   return (
      <div className="space-y-8">
         {/* Dashboard Overview */}
         <div className="space-y-6 mt-10 bg-white p-6 rounded-2xl border border-gray-200 shadow-none">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Wallet className="text-gray-600" size={24} />
                  <h2 className="text-md font-normal text-gray-900">Dashboard Overview</h2>
               </div>
               <Select defaultValue="last-week">
                  <SelectTrigger className="w-32">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="last-week">Last Week</SelectItem>
                     <SelectItem value="last-month">Last Month</SelectItem>
                     <SelectItem value="last-year">Last Year</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

               <LayersMetricsClubCard
                  title="Total Accumulated Revenue"
                  value={`$${metrics.totalAccumulatedRevenue.toLocaleString()}`}
                  trend="+All time earning"
                  icon={
                     <Wallet className="text-gray-600" size={24} />
                  }
                  classNames={{
                     root: "bg-green-100 border-none shadow-none",
                     icon: "text-gray-600",
                  }}
               />


               <LayersMetricsClubCard
                  title="Current Balance"
                  value={`$${metrics.currentBalance.toLocaleString()}`}
                  icon={
                     <Wallet className="text-gray-600" size={24} />
                  }
                  trend={
                     <Button
                        className="bg-lime-400 hover:bg-green-700 text-black"
                        onClick={() => setIsWithdrawalModalOpen(true)}
                        disabled={metrics.currentBalance <= 0}
                     >
                        Withdraw
                     </Button>
                  }
                  classNames={{
                     root: "bg-gray-100 border-none py-2 shadow-none",
                     icon: "text-gray-600",
                  }}
               />



               <LayersMetricsClubCard
                  title="Total Invoiced Revenue"
                  value={`$${metrics.totalInvoicedRevenue.toLocaleString()}`}
                  trend="Withdrawn successfully"
                  icon={
                     <Wallet className="text-gray-600" size={24} />
                  }
                  classNames={{
                     root: "bg-gray-100 border-none shadow-none",
                     icon: "text-gray-600",
                  }}
               />
            </div>
         </div>

         {/* Revenue Chart */}
         <Card>
            <CardContent className="p-6">
               <MonthlyChart />
            </CardContent>
         </Card>

         {/* Transaction History */}
         <Card>
            <CardContent className="p-6">
               <TransactionTable />
            </CardContent>
         </Card>

         {/* Withdrawal Modal */}
         <WithdrawalModal
            isOpen={isWithdrawalModalOpen}
            onClose={() => setIsWithdrawalModalOpen(false)}
            onSuccess={handleWithdrawalSuccess}
            onSubmitWithdrawal={withdrawalMutation.mutate}
            isLoading={withdrawalMutation.isPending}
         />

         {/* Withdrawal Success Modal */}
         <WithdrawalSuccessModal
            isOpen={isSuccessModalOpen}
            onClose={() => setIsSuccessModalOpen(false)}
            amount={withdrawalAmount}
         />
      </div>
   );
}