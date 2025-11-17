/**
 * @format
 * @type {import('tailwindcss').Config}
 */

const plugin = require("tailwindcss/plugin");
const {
	tableActionPlugin,
	statusColorPlugin,
	minHeightVariantPlugin,
	twScrollbarPlugin,
	coreStylesPlugin,
} = require("./tailwind-plugins");

export default {
	darkMode: ["class"],
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			colors: {
				sidebar: {
					DEFAULT: "hsl(var(--sidebar-background))",
					foreground: "hsl(var(--sidebar-foreground))",
					primary: "hsl(var(--sidebar-primary))",
					"primary-foreground":
						"hsl(var(--sidebar-primary-foreground))",
					accent: "hsl(var(--sidebar-accent))",
					"accent-foreground":
						"hsl(var(--sidebar-accent-foreground))",
					border: "hsl(var(--sidebar-border))",
					ring: "hsl(var(--sidebar-ring))",
				},
			},
			fontFamily: {
				inter: "Inter, serif",
				roboto: ["Roboto", "sans-serif"],
			},
			aspectRatio: {
				"profile-banner": "4 / 1",
				"hero-banner": "682 / 171",
			},
			keyframes: {
				"accordion-down": {
					from: {
						height: "0",
					},
					to: {
						height: "var(--radix-accordion-content-height)",
					},
				},
				"accordion-up": {
					from: {
						height: "var(--radix-accordion-content-height)",
					},
					to: {
						height: "0",
					},
				},
				"caret-blink": {
					"0%,70%,100%": { opacity: "1" },
					"20%,50%": { opacity: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"caret-blink": "caret-blink 1.25s ease-out infinite",
			},
			screens: {
				"h-xs": {
					raw: "(max-height: 480px)",
				},
				"h-sm": {
					raw: "(min-height: 480px) and (max-height: 720px)",
				},
				"h-md": {
					raw: "(min-height: 720px) and (max-height: 1024px)",
				},
				"h-lg": {
					raw: "(min-height: 1024px) and (max-height: 1366px)",
				},
				"h-xl": {
					raw: "(min-height: 1366px)",
				},
			},
		},
	},
	plugins: [
		require("tailwindcss-animate"),
		require("tailwind-scrollbar")({
			preferredStrategy: "pseudoelements",
			nocompatible: true,
		}),
		require("@tailwindcss/container-queries"),
		tableActionPlugin,
		statusColorPlugin,
		minHeightVariantPlugin,
		twScrollbarPlugin,
		coreStylesPlugin,
	],
};
