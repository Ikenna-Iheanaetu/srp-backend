/** @format */

/**
/**
 * Converts array of objects to CSV format
 */
export function convertToCSV<T extends Record<string, unknown>>(
	data: T[],
	headers?: Partial<Record<keyof T, string>>
): string {
	if (!Array.isArray(data) || data.length === 0) return "";

	// Get keys from first object or use headers
	const keys = data[0]
		? (Object.keys(data[0]) as (keyof T)[])
		: headers
		? (Object.keys(headers) as (keyof T)[])
		: [];

	// Create header row
	const headerRow = headers
		? keys.map((key) => headers[key] || String(key)).join(",")
		: keys.join(",");

	// Create data rows
	const dataRows = data.map((row) => {
		return keys
			.map((key) => {
				const value = row[key];
				// Handle values that contain commas or quotes
				if (
					typeof value === "string" &&
					(value.includes(",") || value.includes('"') || value.includes("\n"))
				) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value ?? "";
			})
			.join(",");
	});

	return [headerRow, ...dataRows].join("\n");
}

/**
 * Downloads a file with the given content
 */
export function downloadFile(
	content: string | Blob,
	filename: string,
	type: string
) {
	const blob =
		content instanceof Blob ? content : new Blob([content], { type });
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}

/**
 * Exports data as CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
	data: T[],
	filename: string,
	headers?: Record<keyof T, string>
) {
	const csv = convertToCSV(data, headers);
	downloadFile(csv, filename, "text/csv;charset=utf-8;");
}

/**
 * Exports data as Excel file (simple CSV with .xlsx extension)
 * For true Excel format, consider using libraries like xlsx or exceljs
 */
export function exportToExcel<T extends Record<string, unknown>>(
	data: T[],
	filename: string,
	headers?: Record<keyof T, string>
) {
	const csv = convertToCSV(data, headers);
	// For basic Excel export, we can use CSV with .xlsx extension
	// For more complex Excel features, integrate a library like xlsx
	downloadFile(
		csv,
		filename.replace(/\.csv$/, ".xlsx"),
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	);
}

