/** @format */

import { render, type RenderResult } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { MessageTextBox } from "./message-composer";

// Helper function
const getMessageTextbox = (getByRole: RenderResult["getByRole"]) =>
	getByRole("textbox", { name: /message text content/i });

describe("MessageTextBox", () => {
	describe.each([
		{ platform: "desktop", userAgent: undefined },
		{
			platform: "mobile",
			userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
		},
	])("$platform keyboard shortcuts", ({ platform, userAgent }) => {
		beforeEach(() => {
			if (userAgent) {
				vi.stubGlobal("navigator", { ...navigator, userAgent });
			}
		});

		afterEach(() => {
			if (userAgent) {
				vi.unstubAllGlobals();
			}
		});

		// Use it.fails for mobile platform where desktop shortcuts shouldn't work
		const testFn = platform === "mobile" ? it.fails : it;

		testFn("inserts newline at cursor position when Shift+Enter is pressed", async () => {
			const { getByRole } = await render(<MessageTextBox />);
			const textbox = getMessageTextbox(getByRole);
			const user = userEvent.setup();

			// Type initial content
			const initialText = "Hello";
			await user.type(textbox, initialText);

			// Dispatch Shift+Enter keyboard event
			const shiftEnterEvent = new KeyboardEvent("keydown", {
				key: "Enter",
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			textbox.element().dispatchEvent(shiftEnterEvent);

			// Assert newline was inserted at cursor position
			expect(textbox).toHaveValue(`${initialText}\n`);
		});

		testFn("positions cursor after newline when Shift+Enter is pressed in middle of text", async () => {
			const { getByRole } = await render(<MessageTextBox />);
			const textbox = getMessageTextbox(getByRole);
			const user = userEvent.setup();

			// Type text
			const textBefore = "Hello";
			const textAfter = "World";
			await user.type(textbox, `${textBefore}${textAfter}`);

			// Move cursor to middle (after "Hello")
			const element = textbox.element() as HTMLTextAreaElement;
			const cursorPosition = textBefore.length;
			element.setSelectionRange(cursorPosition, cursorPosition);

			// Dispatch Shift+Enter
			const shiftEnterEvent = new KeyboardEvent("keydown", {
				key: "Enter",
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			element.dispatchEvent(shiftEnterEvent);

			// Assert newline inserted at correct position
			expect(textbox).toHaveValue(`${textBefore}\n${textAfter}`);

			// Assert cursor positioned after the newline
			const expectedCursorPosition = cursorPosition + 1; // +1 for the newline
			expect(element.selectionStart).toBe(expectedCursorPosition);
			expect(element.selectionEnd).toBe(expectedCursorPosition);
		});

		testFn("replaces selected text with newline when Shift+Enter is pressed", async () => {
			const { getByRole } = await render(<MessageTextBox />);
			const textbox = getMessageTextbox(getByRole);
			const user = userEvent.setup();

			// Type text with section to be replaced
			const textBefore = "Hello";
			const textToReplace = "Bad";
			const textAfter = "Goodbye";
			await user.type(
				textbox,
				`${textBefore}${textToReplace}${textAfter}`,
			);

			// Select the middle text
			const element = textbox.element() as HTMLTextAreaElement;
			const selectionStart = textBefore.length;
			const selectionEnd = selectionStart + textToReplace.length;
			element.setSelectionRange(selectionStart, selectionEnd);

			// Dispatch Shift+Enter
			const shiftEnterEvent = new KeyboardEvent("keydown", {
				key: "Enter",
				shiftKey: true,
				bubbles: true,
				cancelable: true,
			});
			element.dispatchEvent(shiftEnterEvent);

			// Assert selected text was replaced with newline
			expect(textbox).toHaveValue(`${textBefore}\n${textAfter}`);

			// Assert cursor positioned after the newline
			const expectedCursorPosition = selectionStart + 1;
			expect(element.selectionStart).toBe(expectedCursorPosition);
			expect(element.selectionEnd).toBe(expectedCursorPosition);
		});

		testFn("submits the form when Enter is pressed without Shift", async () => {
			const mockOnSubmit = vi.fn();

			const { getByRole } = await render(
				<form onSubmit={mockOnSubmit}>
					<MessageTextBox />
				</form>,
			);

			const textbox = getMessageTextbox(getByRole);
			const user = userEvent.setup();

			// Type message content
			const messageText = "See you later!";
			await user.type(textbox, messageText);

			// Dispatch plain Enter
			const enterEvent = new KeyboardEvent("keydown", {
				key: "Enter",
				shiftKey: false,
				bubbles: true,
				cancelable: true,
			});
			textbox.element().dispatchEvent(enterEvent);

			// Assert form submission was triggered
			expect(mockOnSubmit).toHaveBeenCalledTimes(1);
			// Assert no newline added to textarea
			expect(textbox).toHaveValue(messageText);
		});
	});
});
