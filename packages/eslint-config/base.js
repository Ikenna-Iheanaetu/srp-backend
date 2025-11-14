/** @format */

// @ts-check

import "node:path"; // for type import.meta types

import eslintJs from "@eslint/js";
import turboPlugin from "eslint-plugin-turbo";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({
	ignores: ["eslint.config.js", "node_modules"],
	extends: [
		eslintJs.configs.recommended,
		tseslint.configs.recommendedTypeChecked,
	],

	languageOptions: {
		parserOptions: {
			projectService: true,
			tsconfigRootDir: import.meta.dirname,
		},
	},

	plugins: {
		turbo: turboPlugin,
	},
	rules: {
		"turbo/no-undeclared-env-vars": "warn",
		"@typescript-eslint/no-unused-vars": [
			"error",
			{
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
				caughtErrorsIgnorePattern: "^_",
			},
		],
	},
});
