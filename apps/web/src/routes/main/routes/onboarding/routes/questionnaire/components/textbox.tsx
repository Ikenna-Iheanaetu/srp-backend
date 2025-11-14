/** @format */

import {
	DebouncedTextarea,
	DebouncedTextareaProps,
} from "@/components/common/debounced-input";
import { FC } from "react";

interface Props
	extends Required<
		Pick<DebouncedTextareaProps, "value" | "onChange" | "onKeyDown">
	> {
	disabled: boolean;
}

export const Textbox: FC<Props> = ({ disabled, ...props }) => {
	return (
		<DebouncedTextarea
			{...props}
			rows={4}
			placeholder="Type your answer here..."
			disabled={disabled}
		/>
	);
};
