/** @format */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createRoutesStub } from "react-router";
import { UserTypeSelector } from "./user-type-select";

describe("feat(user-type-selector): selects the preferred user type for sign up", () => {
	// We create a route stub for our component.
	const Stub = createRoutesStub([
		{
			path: "/signup",
			Component: UserTypeSelector,
		},
	]);

	it("should render correctly with initial state", () => {
		// Render the stub and set the initial route
		render(<Stub initialEntries={["/signup"]} />);

		// Assert initial text is present
		expect(
			screen.getByText("What Kind of User are you ?")
		).toBeInTheDocument();
		expect(
			screen.getByText("Welcome! Please select an option.")
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"To continue, please choose your preferred user option."
			)
		).toBeInTheDocument();

		// Assert initial button state (disabled)
		const continueButton = screen.getByRole("link", {
			name: /Continue/i,
		});
		expect(continueButton).toHaveClass("pointer-events-none");
	});

	it("should enable the continue button and update href after a user type is selected", () => {
		render(<Stub initialEntries={["/signup"]} />);

		const selectTrigger = screen.getByRole("combobox", {
			name: /choose user type/i,
		});

		// Click to open the select menu
		fireEvent.click(selectTrigger);

		// Click the 'Company' option
		fireEvent.click(screen.getByText("Company"));

		// Assert the button is now enabled
		const continueButton = screen.getByRole("link", { name: /Continue/i });
		expect(continueButton).not.toHaveClass("pointer-events-none");

		// Assert the help text changes
		expect(
			screen.getByText("Use the button below to proceed.")
		).toBeInTheDocument();
	});

	it("should navigate to the correct route when the continue link is clicked", () => {
		// Render the component
		render(<Stub initialEntries={["/signup"]} />);

		// Simulate the user selecting an option
		fireEvent.click(
			screen.getByRole("combobox", { name: /choose user type/i })
		);
		fireEvent.click(screen.getByText("Company"));

		// Find the button and click it
		const continueButton = screen.getByRole("link", {
			name: /continue/i,
		});
		fireEvent.click(continueButton);

		expect(continueButton).toHaveAttribute("href", "/signup/company");
	});
});
