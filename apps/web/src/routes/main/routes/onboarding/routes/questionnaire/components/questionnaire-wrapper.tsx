/** @format */

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type React from "react";
import { useCallback, useState } from "react";
import { href, useNavigate } from "react-router";
import { Answer, AnswerData, Question } from "../types";
import { TransitionsInstance } from "../use-gsap-question-transition";
import { useSubmitAnswers } from "../use-submit-answer";
import { MultipleChoiceQuestion } from "./multiple-choice-question";
import { ProgressControls, ProgressControlsProps } from "./progress-controls";
import { Textbox } from "./textbox";

interface Props {
	heading: string;
	questions: Question[];
	transitionsInstance: TransitionsInstance;
	isSubmitting: boolean;
	onSubmitAnswers: ReturnType<typeof useSubmitAnswers>["mutate"];
}

export const QuestionnaireWrapper = ({
	questions,
	transitionsInstance,
	isSubmitting,
	onSubmitAnswers,
	heading,
}: Props) => {
	const [answers, setAnswers] = useState<Record<string, AnswerData>>({});

	const {
		currentIndex,
		contentRef,
		containerRef,
		isAnimating,
		goToNext,
		goToPrev,
		canGoNext,
		canGoPrev,
		animatedProgressValue: progress,
		isLastQuestion,
	} = transitionsInstance;

	const currentQuestion = questions?.[currentIndex];

	const currentAnswer = currentQuestion
		? answers[currentQuestion.id]?.answer || ""
		: "";

	const hasValidAnswer = !!currentAnswer.trim();

	const handleSetAnswer = useCallback(
		(value: string) =>
			currentQuestion &&
			setAnswers((old) => ({
				...old,
				[currentQuestion.id]: {
					answer: value,
					enunciado: currentQuestion.text,
				},
			})),
		[currentQuestion]
	);

	const navigate = useNavigate();

	const handleSubmit = useCallback(() => {
		const formattedAnswers: Answer[] = Object.entries(answers).map(
			([questionId, data]) => ({
				questionId,
				enunciado: data.enunciado,
				answer: data.answer,
			})
		);

		onSubmitAnswers(formattedAnswers, {
			onSuccess: () =>
				void navigate(href("/onboarding/completed"), { replace: true }),
		});
	}, [answers, navigate, onSubmitAnswers]);

	const handleNext = useCallback(() => {
		if (isLastQuestion) {
			handleSubmit();
		} else {
			goToNext();
		}
	}, [isLastQuestion, handleSubmit, goToNext]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (
				e.key === "Enter" &&
				!e.shiftKey &&
				currentQuestion?.type === "text" &&
				hasValidAnswer &&
				!isSubmitting &&
				!isAnimating
			) {
				e.preventDefault();
				handleNext();
			}
		},
		[
			currentQuestion?.type,
			hasValidAnswer,
			isSubmitting,
			isAnimating,
			handleNext,
		]
	);

	return (
		<Card className="w-full overflow-auto scrollbar-none p-0 shadow-lg relative">
			<Progress
				value={progress}
				className="rounded-none [&_*]:!bg-blue-700 bg-slate-200 sticky top-0 z-50"
			/>

			<div className="p-8">
				<h1 className="text-2xl font-bold mb-8 text-center">
					{heading}
				</h1>

				<div>
					<div ref={containerRef}>
						{currentQuestion && (
							<div ref={contentRef} className="space-y-6">
								<div className="space-y-2">
									<h2 className="text-gray-500">
										Question {currentIndex + 1} of{" "}
										{questions.length}
									</h2>
									<h3 className="text-2xl font-bold">
										{currentQuestion.text}
									</h3>
								</div>
								<div>
									{currentQuestion.type ===
									"multiple-choice" ? (
										<MultipleChoiceQuestion
											options={currentQuestion.options}
											value={currentAnswer}
											onChange={handleSetAnswer}
											disabled={
												isSubmitting || isAnimating
											}
										/>
									) : (
										<Textbox
											value={currentAnswer}
											onChange={handleSetAnswer}
											onKeyDown={handleKeyDown}
											disabled={
												isSubmitting || isAnimating
											}
										/>
									)}
								</div>
							</div>
						)}
					</div>

					{(() => {
						const props: ProgressControlsProps = {
							handleNext,
							goToPrev,
							canGoNext,
							canGoPrev,
							hasValidAnswer,
							isSubmitting,
							isLastQuestion,
						};
						return <ProgressControls {...props} />;
					})()}
				</div>
			</div>
		</Card>
	);
};
