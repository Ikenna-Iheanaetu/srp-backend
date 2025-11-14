/** @format */

// @ts-check

import { defineConfig } from "eslint/config";
import baseConfig from "./base.js";
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";
import eslintReact from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig({
	plugins: { "react-hooks": reactHooks },
	extends: [
		...baseConfig,
		eslintReact.configs["recommended-typescript"],
		reactYouMightNotNeedAnEffect.configs.recommended,
		"react-hooks/recommended",
	],
	settings: {
		react: {
			version: "detect",
		},
	},
});
