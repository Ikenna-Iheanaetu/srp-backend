/** @format */

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";
import { LayersMetricsClubCard } from "@/routes/main/routes/dashboard/club/components/club-metrics-card";

// Withdrawal Modal Component
export const WithdrawalModal: React.FC<{
   isOpen: boolean;
   onClose: () => void;
   onSuccess: (amount: string) => void;
   onSubmitWithdrawal: (data: { invoiceId: string; amount: number; notes?: string }) => void;
   isLoading?: boolean;
}> = ({ isOpen, onClose, onSubmitWithdrawal, isLoading = false }) => {
   const [invoiceId, setInvoiceId] = useState("INV_0029AC");
   const [withdrawalAmount, setWithdrawalAmount] = useState("500.00");
   const [notes, setNotes] = useState("");

   const handleSubmit = () => {
      const amount = parseFloat(withdrawalAmount);
      if (isNaN(amount) || amount <= 0) {
         return;
      }

      onSubmitWithdrawal({
         invoiceId,
         amount,
         notes: notes || undefined,
      });
   };

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-[600px] p-0">
            <DialogHeader className="p-6 pb-4">
               <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-semibold text-gray-900">
                     Withdrawal
                  </DialogTitle>
               </div>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-6">
               {/* Current Balance Section */}
               <LayersMetricsClubCard
                  title="Current Balance"
                  value="$2,000"
                  icon={
                     <Wallet className="text-gray-600" size={24} />
                  }
                  trend="Available to be withdrawn"
                  classNames={{
                     root: "bg-yellow-50 border-none py-2 shadow-none",
                     icon: "text-yellow-500",
                  }}
               />

               {/* Invoice ID Input */}
               <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Invoice ID</label>
                  <Input
                     value={invoiceId}
                     onChange={(e) => setInvoiceId(e.target.value)}
                     className="bg-gray-50 border-gray-200"
                     placeholder="Enter invoice ID"
                     disabled={isLoading}
                  />
               </div>

               {/* Withdrawal Amount Input */}
               <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">How much do you want to withdraw?</label>
                  <Input
                     value={withdrawalAmount}
                     onChange={(e) => setWithdrawalAmount(e.target.value)}
                     className="text-lg font-medium"
                     placeholder="Enter amount"
                     type="number"
                     step="0.01"
                     min="0.01"
                     disabled={isLoading}
                  />
               </div>

               {/* Notes Input */}
               <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <Input
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     className="bg-gray-50 border-gray-200"
                     placeholder="Add any additional notes"
                     disabled={isLoading}
                  />
               </div>

               {/* Status Notice */}
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                     <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.491 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                     </div>
                     <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                           Pending Approval
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                           <p>
                              Your withdrawal will be submitted with a pending status and requires admin approval before processing.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                     variant="outline"
                     onClick={onClose}
                     className="px-6"
                     disabled={isLoading}
                  >
                     Cancel
                  </Button>
                  <Button
                     className="bg-lime-400 hover:bg-green-600 text-black px-6"
                     onClick={handleSubmit}
                     disabled={isLoading || !withdrawalAmount || !invoiceId}
                  >
                     {isLoading ? "Submitting..." : "Request Withdrawal"}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
};
