/** @format */

// prettier-ignore
/* eslint-disable @typescript-eslint/unbound-method */

import plugin from "tailwindcss/plugin";

/**
 * Tailwind plugin to generate `table-action-${color}` utilities.
 * Applies `bg-${color}-100 text-${color}-500` for any Tailwind color.
 */
const tableActionPlugin = plugin(({ matchUtilities, theme }) => {
	matchUtilities(
		{
			"table-action": (value) => ({
				backgroundColor: theme(`colors.${value}.100`),
				color: theme(`colors.${value}.500`),
			}),
		},
		{
			values: Object.keys(theme("colors")).reduce((acc, color) => {
				if (typeof theme(`colors.${color}`) === "object") {
					acc[color] = color;
				}
				return acc;
			}, {} as Record<string, string>),
			type: "color",
		}
	);
});

const statusColorPlugin = plugin(function ({ matchUtilities, theme }) {
	matchUtilities(
		{
			status: (color: Record<number, string>) => {
				return {
					backgroundColor: color[100],
					borderColor: color[200],
					color: color[700],
					paddingLeft: "0.5rem",
					paddingRight: "0.5rem",
					paddingTop: "0.125rem",
					paddingBottom: "0.125rem",
					borderRadius: "9999px",
					textTransform: "capitalize",
					fontWeight: "medium",
					borderWidth: "1px",
					width: "max-content",
					whitespace: "nowrap",
					display: "inline-flex",
					alignItems: "center",
					"&::before": {
						content: '""',
						display: "inline-block",
						width: "0.375rem",
						height: "0.375rem",
						backgroundColor: color[500],
						borderRadius: "9999px",
						marginRight: "0.5rem",
						verticalAlign: "middle",
					},
				};
			},
		},
		{
			values: theme("colors"),
			type: "color",
		}
	);
});

/**
 * Adds arbitrary min-height media query variants using the 'min-h-[value]:' prefix.
 */
const minHeightVariantPlugin = plugin(({ matchVariant }) => {
	matchVariant("min-h", (value: string) => `@media (min-height: ${value})`);
});

/**
 * Adds a '.tw-scrollbar' utility class
 * and applies the same scrollbar styles as base styles to the 'html' element.
 *
 * This plugin requires 'tailwind-scrollbar' to be installed and configured
 * in tailwind.config.js plugins array.
 */
const twScrollbarPlugin = plugin(({ addUtilities, addBase }) => {
	const scrollbarStyles =
		"@apply scrollbar scrollbar-w-2 scrollbar-h-2 scrollbar-corner-transparent scrollbar-thumb-blue-800 scrollbar-track-gray-200";

	addUtilities({
		".tw-scrollbar": {
			[scrollbarStyles]: {},
		},
	});

	addBase({
		html: {
			[scrollbarStyles]: {},
		},
	});
});

const coreStylesPlugin = plugin(({ addUtilities, addComponents, addBase }) => {
	addUtilities({
		".button": {
			"@apply bg-lime-400 text-black hover:!bg-lime-300 px-8": {},
		},
		".button-secondary": {
			"@apply bg-white hover:!bg-blue-700 hover:text-white": {},
		},
		".elevated-on-hover": {
			"@apply transition-opacity duration-200 hover:shadow-md": {},
		},
	});
	addComponents({
		".form-error": {
			"@apply absolute top-[110%] left-0 text-red-500 text-sm italic": {},
		},
	});
	addBase({
		body: { "@apply font-inter": {} },
		svg: { "@apply text-slate-500": {} },
	});
});

export {
	tableActionPlugin,
	statusColorPlugin,
	minHeightVariantPlugin,
	twScrollbarPlugin,
	coreStylesPlugin,
};
