/** @format */

// @ts-check

import pluginQuery from "@tanstack/eslint-plugin-query";
import vitest from "@vitest/eslint-plugin";
import jestDom from "eslint-plugin-jest-dom";
import reactQueryKeys from "eslint-plugin-react-query-keys";
import { defineConfig } from "eslint/config";

import baseConfig from "@repo/eslint-config/react";

export default defineConfig(
	{
		extends: [...baseConfig, ...pluginQuery.configs["flat/recommended"]],

		plugins: {
			// @ts-ignore setup correct according to docs
			"react-query-keys": reactQueryKeys,
		},
		rules: {
			"react-query-keys/no-plain-query-keys": "warn",
			"no-restricted-imports": [
				"error",
				{
					// We use 'paths' for explicit matching. 'patterns' can cause false positives,
					// like incorrectly flagging `import { zodResolver } from '@hookform/resolvers/zod';`.
					paths: [
						{
							name: "zod",
							message:
								"Importing from 'zod' is deprecated. Use 'zod/v4' instead.",
						},
						{
							name: "zod/v3",
							message:
								"Importing from 'zod/v3' is deprecated. Use 'zod/v4' instead.",
						},
						{
							name: "zod/mini",
							message:
								"Importing from 'zod/mini' is not allowed. Use 'zod/v4' instead.",
						},
					],
				},
			],
		},
	},
	{
		files: [
			"**/__tests__/**/*.[jt]s?(x)",
			"**/?(*.)+(spec|test).[jt]s?(x)",
		],
		plugins: {
			vitest,
			"jest-dom": jestDom,
		},
		rules: {
			...vitest.configs.recommended.rules,
			...jestDom.configs["flat/recommended"].rules,
		},
		settings: {
			vitest: {
				typecheck: true,
			},
		},
		languageOptions: {
			globals: {
				...vitest.environments.env.globals,
			},
		},
	},
);
