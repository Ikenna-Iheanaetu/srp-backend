/** @format */
export { formatCurrency } from "./formatters";

export * from "./formatters";

export const moveToNextInputFieldOnEnter = (event: KeyboardEvent) => {
	if (event.code === "Enter") {
		const currentInput = event.target as HTMLInputElement;
		if (
			currentInput.nodeName != "INPUT" &&
			currentInput.nodeName !== "TEXTAREA"
		)
			return;

		const form = currentInput.form;
		if (!form) return;

		const formInputs = Array.from(form).filter(
			(element) =>
				element instanceof HTMLInputElement ||
				element instanceof HTMLTextAreaElement
		);

		const nextInputIndex = formInputs.indexOf(currentInput) + 1;
		if (nextInputIndex >= formInputs.length) return;

		const nextInput = formInputs[nextInputIndex];

		nextInput.focus();
		event.preventDefault();
	}
};

export const generateUUID = () => window.crypto.randomUUID();

// CapitalizeWords using built-in Capitalize<T>
type CapitalizeWords<T extends string> =
	T extends `${infer First} ${infer Rest}`
		? `${Capitalize<First>} ${CapitalizeWords<Rest>}`
		: Capitalize<T>;

/** Capitalize function with CSS-like `text-transform: capitalize` behavior */
export const capitalize = <T extends string>(str: T): CapitalizeWords<T> => {
	if (typeof str !== "string") return str;
	if (str.length === 0)
		return str.toUpperCase() /* toUpperCase() used to clear type mismatch error */ as CapitalizeWords<T>;
	return str
		.split(" ")
		.map((word) =>
			word.length > 0
				? word.charAt(0).toUpperCase() + word.slice(1)
				: word
		)
		.join(" ") as CapitalizeWords<T>;
};

export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
	func: T,
	delay = 300
): ((...args: Parameters<T>) => void) => {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func.apply(this, args), delay);
	};
};
