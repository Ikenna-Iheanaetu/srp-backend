/** @format */

import { Clock, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import React from "react";

// Revenue Cards Component
const RevenueCard: React.FC<{
	title: string;
	amount: string;
	subtitle: string;
	icon: React.ReactNode;
	variant?: "default" | "green" | "white";
	action?: React.ReactNode;
}> = ({ title, amount, subtitle, icon, variant = "default", action }) => {
	const cardVariants = {
		default: "bg-white",
		green: "bg-green-50 border-green-200",
		white: "bg-white",
	};

	return (
		<Card className={cn("p-6", cardVariants[variant])}>
			<CardContent className="p-0">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-gray-100 rounded-lg">
							{icon}
						</div>
						<div>
							<h3 className="text-sm font-medium text-gray-600">{title}</h3>
						</div>
					</div>
				</div>
				<div className="space-y-2">
					<h2 className="text-3xl font-bold text-gray-900">{amount}</h2>
					<p className="text-sm text-gray-500">{subtitle}</p>
					{action && <div className="pt-2">{action}</div>}
				</div>
			</CardContent>
		</Card>
	);
};

// Monthly Chart Component
const MonthlyChart: React.FC = () => {
	const chartData = [
		{ month: "JAN", invoice: 8000, accumulate: 2000 },
		{ month: "FEB", invoice: 12000, accumulate: 3000 },
		{ month: "MAR", invoice: 10000, accumulate: 2500 },
		{ month: "APR", invoice: 15000, accumulate: 4000 },
		{ month: "MAY", invoice: 18000, accumulate: 5000 },
		{ month: "JUN", invoice: 20000, accumulate: 6000 },
		{ month: "JUL", invoice: 22000, accumulate: 7000 },
		{ month: "AUG", invoice: 25000, accumulate: 8000 },
		{ month: "SEP", invoice: 20000, accumulate: 6000 },
		{ month: "OCT", invoice: 18000, accumulate: 5000 },
		{ month: "NOV", invoice: 15000, accumulate: 4000 },
		{ month: "DEC", invoice: 12000, accumulate: 3000 },
	];

	const maxValue = Math.max(...chartData.map(d => d.invoice + d.accumulate));

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M12 21C7.0293 21 3 16.9707 3 12C3 7.9698 5.6487 4.5588 9.3 3.4122V5.3238C7.75283 5.95204 6.47202 7.09834 5.67665 8.5666C4.88129 10.0349 4.62079 11.7339 4.93973 13.373C5.25866 15.0121 6.13721 16.4895 7.42509 17.5524C8.71297 18.6153 10.3301 19.1977 12 19.2C13.4344 19.2 14.8361 18.7716 16.0256 17.9699C17.215 17.1682 18.138 16.0296 18.6762 14.7H20.5878C19.4412 18.3513 16.0302 21 12 21ZM20.955 12.9H11.1V3.045C11.3961 3.0153 11.6967 3 12 3C16.9707 3 21 7.0293 21 12C21 12.3033 20.9847 12.6039 20.955 12.9ZM12.9 4.8558V11.1H19.1442C18.9439 9.51385 18.2216 8.0394 17.0911 6.90891C15.9606 5.77842 14.4862 5.05613 12.9 4.8558Z" fill="#64748B" />
					</svg>
					<h2 className="text-xl font-semibold text-gray-900">Revenue</h2>
				</div>
				<Select defaultValue="this-month">
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

			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<p className="text-sm text-gray-600">Inflow $560,000,000.00</p>
					<p className="text-sm text-gray-600">Outflow $200,000.00</p>
				</div>
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-green-500 rounded-full"></div>
						<span className="text-sm text-gray-600">Invoice Revenue</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-blue-400 rounded-full"></div>
						<span className="text-sm text-gray-600">Accumulate Revenue</span>
					</div>
				</div>
			</div>

			<div className="h-64 flex items-end justify-between gap-2">
				{chartData.map((data) => {
					const invoiceHeight = (data.invoice / maxValue) * 100;
					const accumulateHeight = (data.accumulate / maxValue) * 100;

					return (
						<div key={data.month} className="flex flex-col items-center gap-2 flex-1">
							<div className="relative w-full h-48 flex flex-col justify-end">
								<div className="relative w-full group">
									<div 
										className="w-full bg-blue-400 rounded-t-sm"
										style={{ height: `${accumulateHeight}%` }}
									></div>
									<div 
										className="w-full bg-green-500 rounded-t-sm"
										style={{ height: `${invoiceHeight}%` }}
									></div>
									{data.month === "FEB" && (
										<div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
											$3,246.00
										</div>
									)}
									{data.month === "AUG" && (
										<div className="absolute inset-0 border-2 border-blue-500 rounded-sm"></div>
									)}
								</div>
							</div>
							<span className="text-xs text-gray-600 font-medium">{data.month}</span>
						</div>
					);
				})}
			</div>

			<div className="flex justify-between text-xs text-gray-500">
				<span>0</span>
				<span>10k</span>
				<span>15k</span>
				<span>100k</span>
			</div>
		</div>
	);
};

// Transaction Table Component
const TransactionTable: React.FC = () => {
	const transactions = [
		{ date: "2023-12-08", company: "Coastal Warriors", id: "INV_0029AC", amount: "$100.00", status: "Paid" },
		{ date: "2023-12-09", company: "Visionary Athletes", id: "INV_0019BD", amount: "$150.00", status: "Paid" },
		{ date: "2023-12-10", company: "Elite Match League", id: "INV_0011CT", amount: "$200.00", status: "Paid" },
		{ date: "2023-12-11", company: "Digital Guardians", id: "INV_0033DE", amount: "$175.00", status: "Pending" },
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
			</div>

			<Tabs defaultValue="withdrawals" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="hire-history">Hire History</TabsTrigger>
					<TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
				</TabsList>

				<TabsContent value="withdrawals" className="space-y-4">
					<div className="flex items-center gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input 
								placeholder="Search by Date or Name ..." 
								className="pl-10"
							/>
						</div>
						<Button variant="outline">
							<Download className="h-4 w-4 mr-2" />
							Export
						</Button>
					</div>

					<div className="border rounded-lg overflow-hidden">
						<table className="w-full">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Withdrawal ID</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{transactions.map((transaction, index) => (
									<tr key={index}>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.date}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.company}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.id}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.amount}</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<Badge 
												variant={transaction.status === "Paid" ? "default" : "secondary"}
												className={cn(
													transaction.status === "Paid" 
														? "bg-green-100 text-green-800" 
														: "bg-blue-100 text-blue-800"
												)}
											>
												{transaction.status}
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default function AdminRevenueManagement() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1>
				<p className="text-gray-600">Monitor and manage platform revenue across all clubs and companies.</p>
			</div>

			{/* Dashboard Overview */}
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Clock className="h-5 w-5 text-gray-600" />
						<h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
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
					<RevenueCard
						title="Total Platform Revenue"
						amount="$125,200"
						subtitle="All time earnings across platform"
						icon={
							<svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
							</svg>
						}
						variant="green"
					/>
					<RevenueCard
						title="Monthly Revenue"
						amount="$25,000"
						subtitle="Current month earnings"
						icon={
							<svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
							</svg>
						}
						variant="white"
					/>
					<RevenueCard
						title="Pending Withdrawals"
						amount="$8,200"
						subtitle="Awaiting processing"
						icon={
							<svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
							</svg>
						}
						variant="white"
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
		</div>
	);
}
