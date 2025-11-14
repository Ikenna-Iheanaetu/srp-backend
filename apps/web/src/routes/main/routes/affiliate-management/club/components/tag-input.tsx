/** @format */

import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { X } from "lucide-react";
import * as React from "react";

interface TagInputProps {
	placeholder?: string;
	tags: string[];
	availableTags?: string[];
	onTagAdd: (tag: string) => void;
	onTagRemove: (tag: string) => void;
}

export function TagInput({
	tags = [],
	placeholder = "Add tags...",
	availableTags = [],
	onTagAdd,
	onTagRemove,
}: TagInputProps) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [inputValue, setInputValue] = React.useState("");
	const [isFocused, setIsFocused] = React.useState(false);
	//   console.log("the tags available", availableTags);

	const suggestions = React.useMemo(() => {
		if (!inputValue.trim() || !isFocused) return [];
		const validAvailableTags = Array.isArray(availableTags)
			? availableTags
			: [];
		const validTags = Array.isArray(tags) ? tags : [];
		return validAvailableTags
			.filter(
				(tag) =>
					tag.toLowerCase().includes(inputValue.toLowerCase()) &&
					!validTags.includes(tag),
			)
			.slice(0, 5);
	}, [inputValue, availableTags, tags, isFocused]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const newTag = inputValue.trim();
			if (newTag && !tags.includes(newTag)) {
				onTagAdd(newTag);
			}
			setInputValue("");
		} else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
			onTagRemove(tags[tags.length - 1] ?? "");
		}
	};

	const handleSuggestionClick = (tag: string) => {
		onTagAdd(tag);
		setInputValue("");
		inputRef.current?.focus();
	};

	return (
		<div className="relative w-full">
			<div
				className={`flex flex-wrap gap-2 rounded-md border p-2 ${
					isFocused
						? "border-primary ring-primary ring-2"
						: "border-input"
				}`}
				onClick={() => inputRef.current?.focus()}>
				{(Array.isArray(tags) ? tags : []).map((tag) => (
					<Badge
						key={tag}
						variant="secondary"
						className="flex items-center gap-1">
						{tag}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onTagRemove(tag);
							}}
							className="focus:outline-none">
							<X className="hover:text-primary h-3 w-3" />
						</button>
					</Badge>
				))}
				<input
					ref={inputRef}
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setTimeout(() => setIsFocused(false), 100)}
					placeholder={tags.length === 0 ? placeholder : ""}
					className="min-w-[120px] flex-1 bg-transparent outline-none"
				/>
			</div>

			{isFocused && suggestions.length > 0 && (
				<div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
					<Command>
						<CommandGroup>
							{suggestions.map((tag) => (
								<CommandItem
									key={tag}
									onSelect={() => handleSuggestionClick(tag)}
									onMouseDown={(e) => {
										e.preventDefault();
										handleSuggestionClick(tag);
									}}
									className="hover:bg-accent cursor-pointer">
									{tag}
								</CommandItem>
							))}
						</CommandGroup>
					</Command>
				</div>
			)}
		</div>
	);
}
