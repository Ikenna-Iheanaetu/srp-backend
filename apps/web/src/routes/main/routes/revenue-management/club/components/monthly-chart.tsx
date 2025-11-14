/** @format */

import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { revenueManagementQueries } from "../query-factory";

// Monthly Chart Component
export const MonthlyChart: React.FC = () => {
   const [selectedPeriod, setSelectedPeriod] = useState<"this-month" | "last-month" | "this-year">("this-month");

   // Fetch chart data
   const { data: chartData, isLoading } = useQuery(
      revenueManagementQueries.chart({ period: selectedPeriod })
   );

   if (isLoading) {
      return (
         <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
               </div>
               <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
         </div>
      );
   }

   const data = chartData?.chartData || [];
   const summary = chartData?.summary || { inflow: 0, outflow: 0 };

   const maxValue = Math.max(...data.map(d => Math.max(d.invoice, d.accumulate)), 1000);

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C7.0293 21 3 16.9707 3 12C3 7.9698 5.6487 4.5588 9.3 3.4122V5.3238C7.75283 5.95204 6.47202 7.09834 5.67665 8.5666C4.88129 10.0349 4.62079 11.7339 4.93973 13.373C5.25866 15.0121 6.13721 16.4895 7.42509 17.5524C8.71297 18.6153 10.3301 19.1977 12 19.2C13.4344 19.2 14.8361 18.7716 16.0256 17.9699C17.215 17.1682 18.138 16.0296 18.6762 14.7H20.5878C19.4412 18.3513 16.0302 21 12 21ZM20.955 12.9H11.1V3.045C11.3961 3.0153 11.6967 3 12 3C16.9707 3 21 7.0293 21 12C21 12.3033 20.9847 12.6039 20.955 12.9ZM12.9 4.8558V11.1H19.1442C18.9439 9.51385 18.2216 8.0394 17.0911 6.90891C15.9606 5.77842 14.4862 5.05613 12.9 4.8558Z" fill="#64748B" />
               </svg>
               <h2 className="text-md font-normal text-gray-900">Revenue</h2>
            </div>
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
               <SelectTrigger className="w-32">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
               </SelectContent>
            </Select>
         </div>

         <div className="flex items-center border-b border-[#F1F1F4] pb-4 justify-between">
            <div className="flex items-center gap-4">
               <div className="flex-col items-center gap-2">
                  <p className="text-sm text-gray-600">Inflow </p>
                  <span className="font-semibold text-gray-900">${summary.inflow.toLocaleString()}</span>
               </div>
               <div className="w-px h-10 bg-[#F1F1F4]"></div>
               <div className="flex-col items-center gap-2">
                  <p className="text-sm text-gray-600">Outflow </p>
                  <span className="font-semibold text-gray-900">${summary.outflow.toLocaleString()}</span>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#84CC16' }}></div>
                  <span className="text-sm text-gray-600">Invoice Revenue</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#BAE6FD' }}></div>
                  <span className="text-sm text-gray-600">Accumulate Revenue</span>
               </div>
            </div>
         </div>

         <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-48 flex flex-col justify-between text-xs text-gray-500 pr-4">
               <span>{Math.round(maxValue / 1000)}k</span>
               <span>{Math.round(maxValue / 2000)}k</span>
               <span>{Math.round(maxValue / 4000)}k</span>
               <span>0</span>
            </div>

            {/* Chart container */}
            <div className="ml-12 h-64 flex items-end justify-between gap-2">
               {data.map((dataPoint) => {
                  const invoicePercent = (dataPoint.invoice / maxValue) * 100;
                  const accumulatePercent = (dataPoint.accumulate / maxValue) * 100;

                  return (
                     <div key={dataPoint.month} className="flex flex-col items-center gap-2 flex-1">
                        {/* Bar container */}
                        <div className="relative w-full" style={{ height: '12rem' }}>
                           {/* Background bar */}
                           <div
                              className="absolute bottom-0 w-full rounded-sm"
                              style={{
                                 height: '100%',
                                 backgroundColor: '#F6F8FA'
                              }}
                           />

                           {/* Green bar (invoice) */}
                           <div
                              className="absolute bottom-0 w-full"
                              style={{
                                 height: `${invoicePercent}%`,
                                 backgroundColor: '#84CC16'
                              }}
                           />

                           {/* Blue bar (accumulate) stacked on top */}
                           <div
                              className="absolute w-full border-2 border-white"
                              style={{
                                 height: `${accumulatePercent}%`,
                                 bottom: `${invoicePercent}%`,
                                 backgroundColor: '#BAE6FD'
                              }}
                           />

                           {/* Tooltip for largest value */}
                           {dataPoint.invoice > 0 && (
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                 ${dataPoint.invoice.toLocaleString()}
                              </div>
                           )}
                        </div>

                        {/* Month label */}
                        <span className="text-xs text-gray-600 font-medium">{dataPoint.month}</span>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
   );
};
