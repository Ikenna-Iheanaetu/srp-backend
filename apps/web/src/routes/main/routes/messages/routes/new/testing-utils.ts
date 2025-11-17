/** @format */

/**
 * Creates a regular expression matcher for selecting a company option by name.
 *
 * @param companyName - The name of the company to match in the selection prompt.
 * @returns A case-insensitive regular expression that matches the string "Select company {companyName}".
 */
export const getCompanyOptionMatcher = (companyName: string) =>
	new RegExp(`Select company ${companyName}`, "i");
