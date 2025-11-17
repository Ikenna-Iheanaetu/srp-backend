/** @format */

import { debounce } from "@/lib/helper-functions";
import { SafeOmit } from "@/types";
import React, { FC, useCallback, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export interface DebouncedInputPropsNative
	extends React.ComponentProps<"input"> {
	debounceMs?: number;
}

export const DebouncedInputNative: FC<DebouncedInputPropsNative> = ({
	value: initialValue,
	onChange,
	debounceMs = 500, // This is the wait time, not the function
	...props
}) => {
	const [value, setValue] = useState(initialValue);

	// Sync with initialValue when it changes
	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	// ignored eslint warnings of inline function preferred because that'd harm
	// debounce logic. Note that I've correctly passed the needed deps
	const debouncedOnChange = useCallback(
		// eslint-disable-next-line react-compiler/react-compiler
		debounce((e: React.ChangeEvent<HTMLInputElement>) => {
			onChange?.(e);
		}, debounceMs), // Pass the wait time here
		[debounceMs, onChange] // Dependencies
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value); // Update local state immediately

		debouncedOnChange(e); // Call debounced version
	};

	return <Input {...props} value={value} onChange={handleChange} />;
};

export interface DebouncedInputProps
	extends SafeOmit<React.ComponentProps<"input">, "onChange"> {
	value: string;
	onChange: (value: string) => void;
	debounceMs?: number;
}

export const DebouncedInput: FC<DebouncedInputProps> = ({
	value: initialValue,
	onChange,
	debounceMs = 500, // This is the wait time, not the function
	...props
}) => {
	const [value, setValue] = useState(initialValue);

	// Sync with initialValue when it changes
	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	// ignored eslint warnings of inline function preferred because that'd harm
	// debounce logic. Note that I've correctly passed the needed deps
	const debouncedOnChange = useCallback(
		// eslint-disable-next-line react-compiler/react-compiler
		debounce((newValue: typeof value) => {
			onChange(newValue);
		}, debounceMs), // Pass the wait time here
		[debounceMs, onChange] // Dependencies
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setValue(newValue); // Update local state immediately

		debouncedOnChange(newValue); // Call debounced version
	};

	return <Input {...props} value={value} onChange={handleChange} />;
};
export interface DebouncedTextareaProps
	extends SafeOmit<React.ComponentProps<typeof Textarea>, "onChange"> {
	value: string;
	onChange: (value: string) => void;
	debounceMs?: number;
}

export const DebouncedTextarea: FC<DebouncedTextareaProps> = ({
	value: initialValue,
	onChange,
	debounceMs = 500, // This is the wait time, not the function
	...props
}) => {
	const [value, setValue] = useState(initialValue);

	// Sync with initialValue when it changes
	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	// ignored eslint warnings of inline function preferred because that'd harm
	// debounce logic. Note that I've correctly passed the needed deps
	const debouncedOnChange = useCallback(
		// eslint-disable-next-line react-compiler/react-compiler
		debounce((newValue: typeof value) => {
			onChange(newValue);
		}, debounceMs), // Pass the wait time here
		[debounceMs, onChange] // Dependencies
	);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value;
		setValue(newValue); // Update local state immediately

		debouncedOnChange(newValue); // Call debounced version
	};

	return <Textarea {...props} value={value} onChange={handleChange} />;
};
