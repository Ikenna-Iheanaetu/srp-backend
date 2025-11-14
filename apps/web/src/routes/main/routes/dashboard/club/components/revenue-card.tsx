/** @format */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFetchDashboardData } from "../use-fetch-dashboard-data";
import { ChevronRight, Wallet } from "lucide-react";

interface RevenueItemProps {
  title: string;
  amount: number;
  subtitle: string;
  variant?: "default" | "highlighted";
}

const RevenueItem = ({ title, amount, subtitle, variant = "default" }: RevenueItemProps) => {
  const isHighlighted = variant === "highlighted";
  
  return (
    <Card className={`${isHighlighted ? "bg-lime-400 border-none" : "bg-gray-100 border-none"} shadow-none`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Wallet className="text-gray-600" size={24} />
          <span className="text-sm md:text-base font-normal text-gray-800">{title}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-medium text-gray-900">${amount.toLocaleString()}</div>
        <div className={`text-sm font-medium ${isHighlighted ? "text-green-700" : "text-green-700"}`}>
          {subtitle}
        </div>
      </CardContent>
    </Card>
  );
};

export default function RevenueCard() {
  const { data } = useFetchDashboardData();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <Wallet className="text-gray-600" size={24} />
          <span className="text-base md:text-lg font-medium">Revenue</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-2 border-gray-200 bg-white text-gray-900 text-sm"
          onClick={() => {
            window.location.href = '/revenue-management';
          }}
        >
          See more
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Revenue Cards */}
      <div className="space-y-4">
        <RevenueItem
          title="Total Accumulated Revenue"
          amount={data?.revenue || 0}
          subtitle="All time earning"
          variant="highlighted"
        />
        <RevenueItem
          title="Current Balance"
          amount={data?.paidOut || 0}
          subtitle="Available to be withdrawn"
        />
        <RevenueItem
          title="Total Invoiced Revenue"
          amount={(data?.revenue || 0) - (data?.paidOut || 0)}
          subtitle="Withdrawn successfully"
        />
      </div>
    </div>
  );
}
