/** @format */

import dayjs from "dayjs";
import { AUTH_COOKIE_KEYS } from "./constants";
import {
	AuthCookiesParams,
	AuthTokenCookieParams,
	UserTypeCookieParams,
} from "./types";

export const isLocalhost = () =>
	["localhost", "127.0.0.1"].includes(window.location.hostname);

export const buildCookieString = ({
	name,
	value,
	expires,
}: {
	name: string;
	value: string;
	expires?: string;
}) => {
	const attributes = ["path=/", "Secure"];

	if (isLocalhost()) {
		attributes.push("SameSite=None");
	} else {
		attributes.push("SameSite=Strict");
	}

	if (expires) {
		attributes.push(`expires=${expires}`);
	}

	return `${name}=${value}; ${attributes.join("; ")}`;
};

export const getCookie = <T extends string>(key: string) => {
	const cookies = document.cookie?.split(";");
	for (const cookie of cookies) {
		const [cookieKey, value] = cookie.trim().split("=");
		if (cookieKey === key) {
			return value as T;
		}
	}
	return null;
};

export const getCookieDeletionExpiry = () =>
	dayjs("1970-01-01").toDate().toUTCString();

export const getRememberMeExpiry = () =>
	dayjs().add(30, "day").toDate().toUTCString();

export const setAuthTokenCookies = ({
	accessToken,
	refreshToken,
}: AuthTokenCookieParams) => {
	const expires = getRememberMeExpiry();

	document.cookie = buildCookieString({
		name: AUTH_COOKIE_KEYS.ACCESS_TOKEN,
		value: accessToken,
		expires,
	});
	document.cookie = buildCookieString({
		name: AUTH_COOKIE_KEYS.REFRESH_TOKEN,
		value: refreshToken,
		expires,
	});
};

export const clearAuthTokenCookies = () => {
	document.cookie = buildCookieString({
		name: AUTH_COOKIE_KEYS.ACCESS_TOKEN,
		value: "",
		expires: getCookieDeletionExpiry(),
	});
	document.cookie = buildCookieString({
		name: AUTH_COOKIE_KEYS.REFRESH_TOKEN,
		value: "",
		expires: getCookieDeletionExpiry(),
	});
};

export const setUserTypeCookie = (options: UserTypeCookieParams) => {
	const { userType: type } = options;

	const expires = getRememberMeExpiry();

	document.cookie = buildCookieString({
		name: AUTH_COOKIE_KEYS.USER_TYPE,
		value: type,
		expires,
	});
};

export const clearUserTypeCookie = () => {
	document.cookie = buildCookieString({
		name: AUTH_COOKIE_KEYS.USER_TYPE,
		value: "",
		expires: getCookieDeletionExpiry(),
	});
};

export const setAuthCookies = ({
	accessToken,
	refreshToken,
	userType,
}: AuthCookiesParams) => {
	setAuthTokenCookies({ accessToken, refreshToken });
	setUserTypeCookie({ userType });
};

export const clearAuthCookies = () => {
	clearAuthTokenCookies();
	clearUserTypeCookie();
};
