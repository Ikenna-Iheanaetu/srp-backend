/** @format */

import {
	FormFieldErrorAndLabelWrapper,
	FormFieldErrorAndLabelWrapperProps,
} from "@/components/common/form/wrapper";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { Control, FieldValues } from "react-hook-form";
import { StringOnlyField } from "./form-select";

// Popular currencies with their symbols and names
export const CURRENCIES = [
	{ code: "USD", symbol: "$", name: "US Dollar" },
	{ code: "EUR", symbol: "€", name: "Euro" },
	{ code: "GBP", symbol: "£", name: "British Pound" },
	{ code: "JPY", symbol: "¥", name: "Japanese Yen" },
	{ code: "CAD", symbol: "C$", name: "Canadian Dollar" },
	{ code: "AUD", symbol: "A$", name: "Australian Dollar" },
	{ code: "CHF", symbol: "CHF", name: "Swiss Franc" },
	{ code: "CNY", symbol: "¥", name: "Chinese Yuan" },
	{ code: "SEK", symbol: "kr", name: "Swedish Krona" },
	{ code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
	{ code: "MXN", symbol: "$", name: "Mexican Peso" },
	{ code: "SGD", symbol: "S$", name: "Singapore Dollar" },
	{ code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
	{ code: "NOK", symbol: "kr", name: "Norwegian Krone" },
	{ code: "KRW", symbol: "₩", name: "South Korean Won" },
	{ code: "TRY", symbol: "₺", name: "Turkish Lira" },
	{ code: "RUB", symbol: "₽", name: "Russian Ruble" },
	{ code: "INR", symbol: "₹", name: "Indian Rupee" },
	{ code: "BRL", symbol: "R$", name: "Brazilian Real" },
	{ code: "ZAR", symbol: "R", name: "South African Rand" },
] as const;

export const getCurrencyByCode = (code: string) => {
	return CURRENCIES.find((currency) => currency.code === code);
};

// type CurrencyCode = (typeof currencies)[number]["code"];

interface CurrencyPickerProps {
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

function CurrencyPicker({
	value,
	onValueChange,
	placeholder = "Select currency...",
	className,
	disabled = false,
}: CurrencyPickerProps) {
	const [open, setOpen] = React.useState(false);

	const selectedCurrency = CURRENCIES.find(
		(currency) => currency.code === value
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between", className)}
					disabled={disabled}>
					{selectedCurrency ? (
						<div className="flex items-center gap-2">
							<span className="font-medium">
								{selectedCurrency.symbol}
							</span>
							<span>{selectedCurrency.code}</span>
							<span className="text-muted-foreground">
								{selectedCurrency.name}
							</span>
						</div>
					) : (
						<span className="text-muted-foreground">
							{placeholder}
						</span>
					)}
					<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<Command>
					<CommandInput placeholder="Search currencies..." />
					<CommandList>
						<CommandEmpty>No currency found.</CommandEmpty>
						<CommandGroup>
							{CURRENCIES.map((currency) => (
								<CommandItem
									key={currency.code}
									value={`${currency.code} ${currency.name}`}
									onSelect={() => {
										onValueChange?.(currency.code);
										setOpen(false);
									}}>
									<div className="flex items-center gap-3 w-full">
										<span className="font-medium text-lg w-8">
											{currency.symbol}
										</span>
										<div className="flex flex-col">
											<span className="font-medium">
												{currency.code}
											</span>
											<span className="text-sm text-muted-foreground">
												{currency.name}
											</span>
										</div>
									</div>
									<Check
										className={cn(
											"ml-auto h-4 w-4",
											value === currency.code
												? "opacity-100"
												: "opacity-0"
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

// type CurrencyCodeOnlyField<TForm extends FieldValues> = {
// 	[P in Path<TForm>]: PathValue<TForm, P> extends CurrencyCode
// 		? P
// 		: CurrencyCode extends PathValue<TForm, P>
// 		? P
// 		: never;
// }[Path<TForm>];

interface FormCurrencyPickerProps<TForm extends FieldValues>
	extends SafeOmit<
			FormFieldErrorAndLabelWrapperProps<TForm>,
			"children" | "path"
		>,
		Pick<CurrencyPickerProps, "placeholder" | "className" | "disabled"> {
	control: Control<TForm>;
	path: StringOnlyField<TForm>;
}
export const FormCurrencyPicker = <TForm extends FieldValues>({
	control,
	path,
	label,
	showError,
	disabled,
	placeholder,
	className,
}: FormCurrencyPickerProps<TForm>) => {
	return (
		<FormField
			control={control}
			name={path}
			render={({ field }) => (
				<FormFieldErrorAndLabelWrapper
					control={control}
					path={path}
					label={label}
					showError={showError}
					disabled={disabled}
					className={className}>
					<FormItem>
						<FormControl>
							<CurrencyPicker
								value={field.value}
								onValueChange={field.onChange}
								placeholder={placeholder}
							/>
						</FormControl>
					</FormItem>
				</FormFieldErrorAndLabelWrapper>
			)}
		/>
	);
};
