/** @format */

export const runInDevOnly = (callback: () => void) => {
	if (import.meta.env.DEV) {
		callback();
	}
};
