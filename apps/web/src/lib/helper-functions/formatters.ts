/** @format */

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(
	amount: number,
	options: Intl.NumberFormatOptions = {}
): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
		...options,
	}).format(amount);
}
