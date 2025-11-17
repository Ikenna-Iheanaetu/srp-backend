/** @format */

import { CheckboxStyled } from "@/components/common/checkbox-styled";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MultipleChoiceQuestionProps {
	options: { id: string; text: string }[];
	value: string;
	onChange: (value: string) => void;
	disabled: boolean;
}

export const MultipleChoiceQuestion = ({
	options,
	value,
	onChange,
	disabled,
}: MultipleChoiceQuestionProps) => {
	return (
		<div className="space-y-3">
			{options.map((option) => (
				<Label
					key={option.id}
					className={cn(
						"flex items-center gap-2 rounded-lg border p-4 transition-colors duration-300",
						{
							"bg-gray-100 dark:bg-gray-800": value === option.id,
							"opacity-70 cursor-not-allowed": disabled,
							"cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50":
								!disabled,
						}
					)}>
					<CheckboxStyled
						id={option.id}
						checked={value === option.id}
						onCheckedChange={() => !disabled && onChange(option.id)}
						disabled={disabled}
					/>
					<div className="w-full text-lg font-medium cursor-pointer">
						{option.text}
					</div>
				</Label>
			))}
		</div>
	);
};
