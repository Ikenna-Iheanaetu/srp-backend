/** @format */

import { reactRouter } from "@react-router/dev/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	plugins: [!process.env.VITEST && reactRouter()],
	test: {
		globals: true,
		browser: {
			enabled: true,
			provider: playwright(),
			// https://vitest.dev/guide/browser/playwright
			instances: [{ browser: "chromium" }],
			// headless mode is enabled in package.json scripts
			screenshotFailures: false,
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
