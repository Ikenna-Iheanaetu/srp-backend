/** @format */

import { ColorSchema } from "../schemas";

interface RGB {
	r: number;
	g: number;
	b: number;
}

const HEX_RADIX = 16;
const HEX_PREFIX = "#";

const hexToRgb = (hex: string): RGB => {
	const RED_START_INDEX = 1;
	const GREEN_START_INDEX = 3;
	const BLUE_START_INDEX = 5;
	const COMPONENT_LENGTH = 2; // Each RGB component in hex (e.g., "FF", "00")

	const r = parseInt(
		hex.substring(RED_START_INDEX, RED_START_INDEX + COMPONENT_LENGTH),
		HEX_RADIX
	);
	const g = parseInt(
		hex.substring(GREEN_START_INDEX, GREEN_START_INDEX + COMPONENT_LENGTH),
		HEX_RADIX
	);
	const b = parseInt(
		hex.substring(BLUE_START_INDEX, BLUE_START_INDEX + COMPONENT_LENGTH),
		HEX_RADIX
	);
	return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number) => {
	const toHex = (c: number) => {
		const hex = Math.round(c).toString(HEX_RADIX);
		return hex.length === 1 ? `0${hex}` : hex;
	};
	return `${HEX_PREFIX}${toHex(r)}${toHex(g)}${toHex(b)}` as const;
};

const FALLBACK_HEX_COLOR = "#000000";
/**Calculates the inverse of a color. Similar to CSS `mix-blend-mode:
 * difference`
 *
 * @param backgroundColorHex The hex color (#RRGGBB) to calculate inverse.
 * @param fallbackColorHex The fallback color to calculate instead when `backgroundColorHex` is invalid.
 */
export const getDifferenceColor = (
	backgroundColorHex: string,
	fallbackColorHex?: string
) => {
	let colorToCalc: string;
	const validation = ColorSchema.safeParse(backgroundColorHex);
	if (!validation.success) {
		console.error(
			`Invalid HEX color format for argument backgroundColorHex - '${backgroundColorHex}'. Please use #RRGGBB. Argument fallbackColorHex will used instead if supplied.`
		);
		if (fallbackColorHex) {
			const fallbackValidtion = ColorSchema.safeParse(fallbackColorHex);
			if (!fallbackValidtion.success) {
				console.error(
					`Supplied argument for fallbackColorHex - ${fallbackColorHex} is invalid. Please use #RRGGBB`
				);
				return FALLBACK_HEX_COLOR;
			}
			colorToCalc = fallbackColorHex;
		} else {
			return FALLBACK_HEX_COLOR;
		}
	}
	colorToCalc = backgroundColorHex;

	const MAX_RGB_VALUE = 255;
	const { r: bgR, g: bgG, b: bgB } = hexToRgb(colorToCalc);

	// For the 'difference' effect, we assume the 'other' color is white (MAX_RGB_VALUE, MAX_RGB_VALUE, MAX_RGB_VALUE).
	// The formula for difference is |A - B|. If one color is white (MAX_RGB_VALUE),
	// then the difference is MAX_RGB_VALUE - component, effectively inverting it.
	const diffR = Math.abs(MAX_RGB_VALUE - bgR);
	const diffG = Math.abs(MAX_RGB_VALUE - bgG);
	const diffB = Math.abs(MAX_RGB_VALUE - bgB);

	return rgbToHex(diffR, diffG, diffB);
};
