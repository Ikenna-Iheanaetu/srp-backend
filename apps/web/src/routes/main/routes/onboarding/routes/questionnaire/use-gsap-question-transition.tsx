/** @format */

"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react"; // Import useEffect

interface UseGsapQuestionTransitionProps {
	/**
	 * The total number of questions in the questionnaire.
	 * This is used for boundary checks and animation logic.
	 */
	totalQuestions: number /**
	 * The initial index to start the questionnaire at. Defaults to 0.
	 */;
	initialIndex?: number /**
	 * Indicates if the questionnaire is currently in a submitting state.
	 * This is needed to animate the progress to 100% on submit.
	 */;
	isSubmitting: boolean; // Added isSubmitting prop from consuming component
}

/**
 * Custom hook for animating transitions between question elements and progress using GSAP and useGSAP.
 * Manages content/height animations (initial via useEffect, subsequent via useGSAP) and progress (via separate useEffect).
 * Adjusts progress animation parameters for a "gentler" feel, aligning with content transitions.
 *
 * @param {UseGsapQuestionTransitionProps} props - The properties for the hook.
 * @returns {object} An object containing the current state, refs, animated values, and navigation functions.
 */
export function useGsapQuestionTransition({
	totalQuestions,
	initialIndex = 0,
	isSubmitting, // Receive isSubmitting from consuming component
}: UseGsapQuestionTransitionProps) {
	// State for tracking the current question index
	const [currentIndex, setCurrentIndex] = useState(initialIndex); // State to indicate if ANY animation triggered by navigation is currently running (exit or entrance)
	// This state is NOT set to true for the initial load animation.

	const [isAnimating, setIsAnimating] = useState(false); // State for the progress value that will be animated
	// Initialize to 0; the progress animation useEffect will handle setting the initial animated value.

	const [animatedProgressValue, setAnimatedProgressValue] = useState(0); // Ref for the *inner* element whose content changes and is animated.

	const contentRef = useRef<HTMLDivElement>(null); // Ref for the *outer* container element. This will be the scope for useGSAP.

	const containerRef = useRef<HTMLDivElement>(null); // Ref to store the index *before* the state update. Used to determine animation direction for entrance.

	const prevIndexRef = useRef(initialIndex); // Ref to track if the initial entrance animation (content/height) has already run.

	const initialAnimationRan = useRef(false); // Ref to hold the GSAP tween instance for progress animation, allowing us to kill it.

	const progressTweenRef = useRef<gsap.core.Tween | null>(null); // --- useEffect for Initial Entrance Animation (Runs once on load) ---
	// This effect specifically handles the content/height animation for the very first question
	// when the component mounts and data is ready. It does NOT animate progress directly.

	useEffect(() => {
		const containerEl = containerRef.current;
		const contentEl = contentRef.current; // Conditions for running the initial content animation:
		// 1. Total questions are loaded and valid (> 0).
		// 2. The container and content elements are available in the DOM.
		// 3. The current index is still the initial index.
		// 4. The initial content animation hasn't been marked as run before.
		// 5. isAnimating is false (initial load doesn't use this state).
		// 6. isSubmitting is false (initial load shouldn't happen while submitting).

		if (
			totalQuestions > 0 &&
			containerEl &&
			contentEl &&
			currentIndex === initialIndex &&
			!initialAnimationRan.current &&
			!isAnimating &&
			!isSubmitting
		) {
			// Should not run initial load animation if already submitting (unlikely, but safe)
			console.log(
				"useEffect: Running initial load content/height animation for index",
				currentIndex
			); // Define the initial animation sequence: slide in from right, fade in, adjust height.

			gsap.set(contentEl, { opacity: 0, x: 50, y: 0 }); // Start off-screen right
			// Measure height *after* content is in DOM but before animation starts

			const initialHeight = contentEl.offsetHeight;
			gsap.set(containerEl, { height: initialHeight }); // Set container initial height instantly
			// Create and run the initial content/height timeline

			gsap.timeline({
				onComplete: () => {
					console.log(
						"useEffect: Initial load content/height animation complete for index",
						currentIndex
					);
					gsap.set(contentEl, { opacity: 1, x: 0, y: 0 }); // Ensure final state
				}, // Add a slight delay before the timeline starts on initial load
				delay: 0.05, // A small buffer
			})
				.from(containerEl, {
					height: 0,
					duration: 0.7,
					ease: "power2.inOut",
				}) // Height animates up
				.to(
					contentEl,
					{ opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
					"<0.2"
				); // Content slides/fades in
			// Mark initial content animation as having run *after* setting it up

			initialAnimationRan.current = true; // Update prevIndexRef here too, so the *first* navigation uses the correct previous index
			prevIndexRef.current = currentIndex;
		} // Dependencies: Re-run this effect if totalQuestions, currentIndex, refs, or animation states change.
		// The checks inside ensure it effectively runs only once under the specific initial conditions.
	}, [
		totalQuestions,
		currentIndex,
		initialIndex,
		containerRef,
		contentRef,
		isAnimating,
		isSubmitting,
	]); // --- useGSAP for Subsequent Transition Entrance Animation (Runs after Exit) ---
	// This hook runs whenever `currentIndex` changes (triggered by a navigation-based exit animation complete)
	// or when `isAnimating` changes (e.g., reset to false).
	// It specifically handles the content/height animation for transitions *after* the initial load.
	// Its scope is the containerRef.

	useGSAP(
		() => {
			const containerEl = containerRef.current;
			const contentEl = contentRef.current; // Only run content/height animation if elements are available, questions exist,
			// AND we are currently in the animating state triggered by navigation (`isAnimating` is true),
			// AND the index has actually changed from the previous non-animating state (`currentIndex !== prevIndexRef.current`).
			// Also ensure we are not submitting (submission animation is handled separately by the component).

			const prevIndexAtEffectStart = prevIndexRef.current; // Capture value at effect start
			const needsContentEntranceAnimation =
				isAnimating &&
				currentIndex !== prevIndexAtEffectStart &&
				totalQuestions > 0 &&
				containerEl &&
				contentEl &&
				// Explicitly exclude the submitting state from triggering navigation animations
				!isSubmitting;

			if (needsContentEntranceAnimation) {
				console.log(
					`useGSAP: Running subsequent content/height animation to index ${currentIndex}`
				); // Determine the direction the *new* content should enter from

				const prevIndex = prevIndexRef.current; // Use prevIndexRef captured at effect start
				const isComingFromPrevDirection = currentIndex < prevIndex; // True if navigating to a lower index
				// Set initial state for the incoming content (off-screen left or right, transparent)

				const startX = isComingFromPrevDirection ? -50 : 50; // Enter from left if going prev, right if going next
				gsap.set(contentEl, { opacity: 0, x: startX, y: 0 }); // Ensure y is reset
				// Measure the new content height

				const newHeight = contentEl.offsetHeight; // Create the timeline for the entrance animation and container height adjustment.

				gsap.timeline({
					onComplete: () => {
						// Content/Height animation complete
						setIsAnimating(false); // Animation sequence (exit + entrance) complete, reset flag
						console.log(
							`useGSAP: Subsequent entrance animation complete for index ${currentIndex}`
						);
						gsap.set(contentEl, { opacity: 1, x: 0, y: 0 }); // Ensure final state
					},
				})
					.to(containerEl, {
						height: newHeight,
						duration: 0.5,
						ease: "power2.inOut",
					}) // Height animates
					.to(
						contentEl,
						{
							opacity: 1,
							x: 0,
							duration: 0.4,
							ease: "power2.inOut",
						},
						"-=0.3"
					); // Content animates
				// prevIndexRef.current is updated at the end of this effect block
			} // --- Post-Animation State / Direct Render (No Animation Needed) ---
			// This runs when NOT animating navigation content, and elements/questions are valid.
			// This ensures the element is correctly positioned/visible instantly.
			// It covers states after an animation finishes, or if rendering when not animating and not initial load.
			// Now it also handles the state when submitting on the last question, keeping it visible.
			else if (
				!isAnimating &&
				totalQuestions > 0 &&
				containerEl &&
				contentEl
			) {
				// Removed the !isSubmitting condition here so it applies during submission too
				console.log(
					`useGSAP: Setting state instantly for index ${currentIndex} (not animating navigation content, potentially submitting)`
				); // Ensure content is visible and in final position instantly
				gsap.set(contentEl, { opacity: 1, x: 0, y: 0 }); // Set container height instantly
				const currentContentHeight = contentEl.offsetHeight;
				gsap.set(containerEl, { height: currentContentHeight }); // prevIndexRef.current is updated at the end of this effect block
			} // Removed the specific else if block for isSubmitting on the last question
			// Always update prevIndexRef at the end of the effect if totalQuestions is valid.
			// This ensures the next time this effect is triggered by currentIndex changing,
			// prevIndexRef holds the currentIndex from *this* effect's run.
			if (totalQuestions > 0) {
				prevIndexRef.current = currentIndex;
			} else {
				// Reset prevIndexRef if totalQuestions becomes 0 (e.g., on error or before load)
				prevIndexRef.current = initialIndex;
			}
		},
		{
			scope: containerRef,
			dependencies: [
				currentIndex,
				isAnimating,
				totalQuestions,
				containerRef,
				contentRef,
				isSubmitting, // isSubmitting is still a dependency because it affects which branch runs
			],
		}
	); // Dependencies for useGSAP still include isSubmitting
	// --- NEW useEffect for Progress Animation ---
	// This effect animates the progress value whenever the target progress changes.
	// It depends on currentIndex, totalQuestions, and isSubmitting state from the consuming component.

	useEffect(() => {
		// Calculate the target percentage based on the current state.
		let targetPercentage;
		if (totalQuestions <= 0) {
			targetPercentage = 0;
		} else if (isSubmitting && currentIndex === totalQuestions - 1) {
			// When submitting the last question, animate to 100%
			targetPercentage = 100;
		} else {
			// For any other state (initial load, navigating next/prev, waiting)
			// calculate based on current index (1-based for progress display).
			targetPercentage = ((currentIndex + 1) / totalQuestions) * 100;
		} // Determine animation duration and ease.
		// To feel "gentle" like the initial animation, let's match its content animation duration (0.6s) and ease (power2.out)
		// for navigation steps (including initial load progress). Use a longer duration for the final submit.

		const animationDuration =
			isSubmitting && currentIndex === totalQuestions - 1 ? 1 : 0.6; // 1s for submit, 0.6s for nav/initial
		const animationEase =
			isSubmitting && currentIndex === totalQuestions - 1
				? "power2.inOut"
				: "power2.out"; // power2.inOut for submit, power2.out for nav/initial
		// Kill any existing progress animation before starting a new one

		if (progressTweenRef.current) {
			progressTweenRef.current.kill();
			progressTweenRef.current = null; // Clear the ref
		} // Determine the starting percentage for the progress animation.
		// We always animate FROM the current *visual* value (`animatedProgressValue`).

		const startProgress = animatedProgressValue; // Create and store the new progress tween.
		// Animate a temporary object. GSAP animates from its current value by default.
		// We start the animation FROM the current *visual* value of the animatedProgressValue state.

		progressTweenRef.current = gsap.to(
			{ value: startProgress },
			{
				value: targetPercentage, // Animate TO the calculated target percentage
				duration: animationDuration, // Use determined duration
				ease: animationEase, // Use determined ease

				onUpdate: function () {
					// 'this' inside GSAP callbacks refers to the tween's target.
					// Update the React state variable with the tweening value.
					setAnimatedProgressValue(this.targets()[0].value);
				},
				onComplete: function () {
					// Ensure the final value is set correctly in state when animation finishes
					setAnimatedProgressValue(this.targets()[0].value);
					progressTweenRef.current = null; // Clear the ref once animation is done
				},
			}
		); // Cleanup: Kill the tween on unmount or when dependencies change

		return () => {
			if (progressTweenRef.current) {
				progressTweenRef.current.kill();
				progressTweenRef.current = null;
			}
		}; // Dependencies: Trigger this effect when currentIndex, totalQuestions, or the received isSubmitting prop changes.
		// These are the state changes that define the target percentage.
		// We include animatedProgressValue here because we are animating FROM its current value,
		// ensuring the tween starts from where the progress bar currently *looks* like it is.
	}, [currentIndex, totalQuestions, isSubmitting, animatedProgressValue]); // Derived state - Uses totalQuestions prop correctly

	const isLastQuestion =
		totalQuestions > 0 && currentIndex === totalQuestions - 1; // --- Navigation functions (remain as in the working version) ---
	// They update currentIndex and isAnimating. The consuming component manages isSubmitting.

	const goToNext = useCallback(() => {
		const currentContentEl = contentRef.current;
		const containerEl = containerRef.current;

		if (
			isAnimating ||
			isLastQuestion ||
			!currentContentEl ||
			!containerEl ||
			totalQuestions <= 0
		) {
			console.log("goToNext: Prevented navigation", {
				isAnimating,
				isLastQuestion,
				hasRefs: !!(currentContentEl && containerEl),
				totalQuestions,
			});
			return;
		}

		setIsAnimating(true); // Indicate start of the animation sequence (exit + entrance)
		console.log(
			"goToNext: Starting exit animation from index",
			currentIndex
		);

		gsap.timeline({
			onComplete: () => {
				console.log(
					"goToNext: Exit animation complete, updating index to",
					currentIndex + 1
				);
				setCurrentIndex((prev) => prev + 1); // Trigger entrance via useGSAP
			}, // Optional: Add a small delay if you want a brief pause between exit and entrance
			// delay: 0.05,
		}).to(currentContentEl, {
			opacity: 0,
			x: -50, // Exit left
			duration: 0.4,
			ease: "power2.inOut",
			y: 0, // Ensure y is at 0
		});
	}, [
		isLastQuestion,
		isAnimating,
		contentRef,
		containerRef,
		totalQuestions,
		currentIndex,
	]);

	const goToPrev = useCallback(() => {
		const currentContentEl = contentRef.current;
		const containerEl = containerRef.current;

		if (
			isAnimating ||
			currentIndex <= 0 ||
			!currentContentEl ||
			!containerEl ||
			totalQuestions <= 0
		) {
			console.log("goToPrev: Prevented navigation", {
				isAnimating,
				currentIndex,
				hasRefs: !!(currentContentEl && containerEl),
				totalQuestions,
			});
			return;
		}

		setIsAnimating(true); // Indicate start of the animation sequence
		console.log(
			"goToPrev: Starting exit animation from index",
			currentIndex
		);

		gsap.timeline({
			onComplete: () => {
				console.log(
					"goToPrev: Exit animation complete, updating index to",
					currentIndex - 1
				);
				setCurrentIndex((prev) => prev - 1); // Trigger entrance via useGSAP
			}, // Optional: Add a small delay if you want a brief pause between exit and entrance
			// delay: 0.05,
		}).to(currentContentEl, {
			opacity: 0,
			x: 50, // Exit right
			duration: 0.4,
			ease: "power2.inOut",
			y: 0, // Ensure y is at 0
		});
	}, [currentIndex, isAnimating, contentRef, containerRef, totalQuestions]); // Helper functions for determining if navigation is possible
	// These rely on the isAnimating state covering the entire transition process.

	const canGoNext = useCallback(
		(additionalCondition = true): boolean => {
			return (
				totalQuestions > 0 &&
				!isLastQuestion &&
				!isAnimating &&
				additionalCondition
			);
		},
		[totalQuestions, isLastQuestion, isAnimating] // totalQuestions is a dependency
	);

	const canGoPrev = useCallback(
		(additionalCondition = true): boolean => {
			return (
				totalQuestions > 0 &&
				currentIndex > 0 &&
				!isAnimating &&
				additionalCondition
			);
		},
		[totalQuestions, currentIndex, isAnimating] // totalQuestions is a dependency
	); // Return values needed by the consuming component

	return {
		isLastQuestion,
		currentIndex,
		contentRef, // Ref for the inner changing content element
		containerRef, // Ref for the outer container element
		isAnimating, // Expose animating state
		goToNext,
		goToPrev,
		canGoNext,
		canGoPrev,
		animatedProgressValue, // Expose the animated progress state value
	};
}

export type TransitionsInstance = ReturnType<typeof useGsapQuestionTransition>;
