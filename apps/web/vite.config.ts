/** @format */
/// <reference types="vitest/config" />

import { reactRouter } from "@react-router/dev/vite";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./vitest.setup.ts",
	},
	plugins: [!process.env.VITEST && reactRouter()],
	server: {
		host: true,
		port: 3000,
		proxy: {
			"/api": {
				target: "https://api.mmsoft.com.br",
				changeOrigin: true,
				secure: false,
			},
		},
	},
	preview: {
		port: 4173,
		allowedHosts: ["sportsrekryteing.ngrok.dev", "localhost", "127.0.0.1"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	define: {
		"process.env.ALLOWED_HOSTS": JSON.stringify([
			"srs-front.mmsoft.com.br",
			"localhost",
			"localhost:3000",
			"api.mmsoft.com.br",
			"api.sportsscout.com.br",
			"sportsrekryteing.ngrok.dev",
		]),
	},
});
