/** @format */

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

// Withdrawal Success Modal Component
export const WithdrawalSuccessModal: React.FC<{
   isOpen: boolean;
   onClose: () => void;
   amount: string;
}> = ({ isOpen, onClose, amount }) => {
   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-[500px] py-4 px-0">
            <div className="p-8 text-center space-y-6">
               {/* Close button */}


               {/* Success Icon */}
               <div className="flex justify-center -mt-4">
                  <CheckCircle 
                     size={71}
                     className="text-green-500 drop-shadow-lg"
                     fill="transparent"
                  />
               </div>

               {/* Success Message */}
               <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-gray-900">
                     Withdrawal Request
                  </h2>
                  <h3 className="text-2xl font-semibold text-gray-900">
                     Placed Successfully
                  </h3>
                  <p className="text-gray-600 text-base">
                     Your ${amount} request is pending admin approval. We'll notify you once it's processed.
                  </p>
               </div>

               {/* Action Buttons */}
               <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                     variant="outline"
                     onClick={onClose}
                     className="px-8 text-gray-500 font-semibold"
                  >
                     Cancel
                  </Button>
                  <Button
                     className="bg-lime-400 hover:bg-green-600 font-semibold text-black px-8"
                     onClick={onClose}
                  >
                     View Status
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
};
