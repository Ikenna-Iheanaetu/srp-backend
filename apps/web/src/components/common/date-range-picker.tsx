/** @format */

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { DateRange, Matcher } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { startTransition, useCallback, useEffect } from "react";

export interface DatePickerWithRangeProps
	extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	calendarDisabledOptions?: Matcher | Matcher[];
	/**Use when you need to control the internal state
	 * with `onDateChange`.
	 */
	dateRange?: DateRange;
	/**
	 * Event handler called when the date range state changes
	 */
	onDateChange: (date: DateRange | undefined) => void;
	placeholder?: string;
	triggerClassName?: string;
}

export function DatePickerWithRange({
	className,
	dateRange: externalDate,
	onDateChange,
	placeholder,
	calendarDisabledOptions,
	triggerClassName: triggerClassName,
}: DatePickerWithRangeProps) {
	const [selectedDate, setInternalDate] = React.useState<
		DateRange | undefined
	>(externalDate);

	const handleDateSelect = useCallback(
		(date: typeof selectedDate) => {
			setInternalDate(date);
			// defer the external updater so that the internal updater updates the UI rapidly
			startTransition(() => onDateChange(date));
		},
		[onDateChange]
	);

	useEffect(() => {
		setInternalDate(externalDate);
	}, [externalDate]);

	return (
		<div className={cn("grid gap-2", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="date"
						variant={"outline"}
						className={cn(
							"w-[300px] justify-start text-left font-normal",
							!selectedDate && "text-muted-foreground",
							triggerClassName
						)}>
						<CalendarIcon />
						<div className="flex justify-between gap-2 flex-1">
							{selectedDate?.from ? (
								selectedDate.to ? (
									<>
										<span>
											{format(
												selectedDate.from,
												"LLL dd, y"
											)}
										</span>
										-
										<span>
											{format(
												selectedDate.to,
												"LLL dd, y"
											)}
										</span>
									</>
								) : (
									format(selectedDate.from, "LLL dd, y")
								)
							) : (
								<span>{placeholder ?? "Pick a date"}</span>
							)}
						</div>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						initialFocus
						mode="range"
						defaultMonth={selectedDate?.from}
						selected={selectedDate}
						onSelect={handleDateSelect}
						numberOfMonths={2}
						disabled={calendarDisabledOptions}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
