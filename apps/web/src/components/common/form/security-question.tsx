/** @format */

import { SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { DEFAULT_SECURITY_QUESTIONS } from "@/lib/schemas/security";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import {
	type Control,
	type FieldValues,
	type Path,
	type PathValue,
	useFormContext,
} from "react-hook-form";
import {
	FormSelect,
	FormSelectTrigger,
	type StringOnlyField,
} from "./form-select";
import { FormInput } from "./input";
import { FormFieldErrorAndLabelWrapper } from "./wrapper";

interface SecurityQuestionField {
	question: string;
	answer: string;
}

type SecurityQuestionPath<TForm extends FieldValues> = {
	[K in Path<TForm>]: SecurityQuestionField extends PathValue<TForm, K>
		? K
		: never;
}[Path<TForm>];

type QuestionPath<TForm extends FieldValues> = StringOnlyField<TForm> &
	`${SecurityQuestionPath<TForm>}.question`;

type AnswerPath<TForm extends FieldValues> = StringOnlyField<TForm> &
	`${SecurityQuestionPath<TForm>}.answer`;

interface SecurityQuestionFieldProps<TForm extends FieldValues> {
	control: Control<TForm>;
	path: SecurityQuestionPath<TForm>;
	questionOptions?: string[] | readonly string[];
	label?: React.ReactNode;
	questionLabel?: React.ReactNode;
	customQuestionLabel?: React.ReactNode;
	answerLabel?: React.ReactNode;
	questionPlaceholder?: string;
	answerPlaceholder?: string;
	className?: string;
}

export function FormSecurityQuestionField<TForm extends FieldValues>({
	control,
	path,
	questionOptions = DEFAULT_SECURITY_QUESTIONS,
	label = "Security Question",
	questionLabel = <span className="text-xs">Question</span>,
	customQuestionLabel = <span className="text-xs">Custom Question</span>,
	answerLabel = <span className="text-xs">Answer</span>,
	questionPlaceholder = "Select a security question",
	answerPlaceholder = "Enter your answer",
	className,
}: SecurityQuestionFieldProps<TForm>) {
	const { trigger, watch, setValue, getValues } = useFormContext<TForm>();
	const answerId = useId();

	const questionPath = `${path}.question` as QuestionPath<TForm>;
	const answerPath = `${path}.answer` as AnswerPath<TForm>;

	const lowercaseOptions = useMemo(
		() => questionOptions.map((option) => option.toLowerCase()),
		[questionOptions]
	);

	const customOptionValue = "custom";

	const currentQuestion = watch(questionPath) as string | undefined;

	const handleResetToLowerCase = useCallback(
		(path: QuestionPath<TForm> | AnswerPath<TForm>) => {
			const value = getValues(path) as string;
			const valueLowerCase = value.toLowerCase();
			if (value && value !== valueLowerCase) {
				setValue(path, valueLowerCase as PathValue<TForm, typeof path>);
			}
		},
		[getValues, setValue]
	);

	const firstRenderQuestionRef = useRef<string>(getValues(questionPath));

	useEffect(() => {
		const initialValue = firstRenderQuestionRef.current;
		if (!initialValue && initialValue !== "") {
			setValue(
				questionPath,
				lowercaseOptions[0] as PathValue<TForm, QuestionPath<TForm>>
			);
			return;
		}

		if (initialValue !== initialValue.toLowerCase()) {
			handleResetToLowerCase(questionPath);
		}
	}, [handleResetToLowerCase, lowercaseOptions, questionPath, setValue]);

	// console.log("quetion", currentQuestion);

	const isFirstRenderRef = useRef(true);

	const isCustomQuestion =
		!isFirstRenderRef.current &&
		!lowercaseOptions.includes(currentQuestion?.toLowerCase() ?? "");

	const customOptionStyle = "!text-slate-500";

	return (
		<FormFieldErrorAndLabelWrapper
			control={control}
			path={path}
			showError={false}
			label={label}
			className={cn("space-y-4", className)}>
			<FormSelect
				control={control}
				path={questionPath}
				label={questionLabel}
				showError={!isCustomQuestion}
				defaultValue={
					lowercaseOptions[0] as PathValue<TForm, QuestionPath<TForm>>
				}
				onValueChange={() => {
					isFirstRenderRef.current = false;
					void trigger(answerPath);
				}}>
				<FormSelectTrigger
					className={cn(isCustomQuestion && customOptionStyle)}>
					<SelectValue
						placeholder={questionPlaceholder}
						aria-labelledby={answerId}
					/>
				</FormSelectTrigger>
				<SelectContent>
					{lowercaseOptions.map((option) => (
						<SelectItem key={option} value={option}>
							{option}
						</SelectItem>
					))}
					<SelectItem
						value={customOptionValue}
						className={customOptionStyle}>
						custom question
					</SelectItem>
				</SelectContent>
			</FormSelect>

			{isCustomQuestion && (
				<FormInput
					key={`${questionPath}-${isCustomQuestion}`}
					control={control}
					path={questionPath}
					label={customQuestionLabel}
					onBlur={() => handleResetToLowerCase(questionPath)}
					placeholder="Enter your custom question"
				/>
			)}

			<FormInput
				control={control}
				path={answerPath}
				label={answerLabel}
				type="text"
				id={answerId}
				placeholder={answerPlaceholder}
				onBlur={() => handleResetToLowerCase(answerPath)}
				onChange={() => void trigger(answerPath)}
			/>
		</FormFieldErrorAndLabelWrapper>
	);
}
