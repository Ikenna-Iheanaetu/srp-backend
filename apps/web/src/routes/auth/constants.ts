/** @format */

import { RequireKeys } from "@/types";
import { AxiosRequestConfig } from "axios";

export const AUTH_INPUT_STYLES = "bg-white pr-10";

export const AUTH_MUTATION_URL = "/auth";

export const AUTH_REQUEST_DEFAULTS = {
	skipAuthHeader: true,
	skipUserTypePrefix: true,
} satisfies RequireKeys<
	AxiosRequestConfig,
	"skipAuthHeader" | "skipUserTypePrefix"
>;
