/** @format */

// @ts-check

import baseConfig from "./base.js";

const config = {
	...baseConfig,

	plugins: ["prettier-plugin-tailwindcss"],
	tailwindAttributes: ["classNames"],
	tailwindFunctions: ["cn"],
};

export default config;
