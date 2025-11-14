/** @format */

import React from "react";
import { MessageAttachment } from "../types";
import { getMIMECategory } from "../utils.tsx";

/**
 * Returns a function that generates attachment from any file for client-side only use, and automatically handles clean up for all generated attachments' urls.
 *
 * **NOTE**: Generated attachments urls are only cleaned up on component unmount. To improve performance, manually clean up any url that is no longer in use with `URL.revokeObjectURL(url)`.
 */
export function useFileToAttachment() {
	const generatedURLsRef = React.useRef<string[]>([]);
	const getAttachmentFrom = React.useCallback(
		(file: File): MessageAttachment => {
			const prevUrls = generatedURLsRef.current;

			const url = URL.createObjectURL(file);
			generatedURLsRef.current = [...prevUrls, url];

			return {
				name: file.name,
				url,
				category: getMIMECategory(file.type),
				mimeType: file.type,
				size: file.size,
			};
		},
		[],
	);

	const revokeAttachmentUrls = React.useCallback(() => {
		// You must take a copy, do not operate directly on the ref array
		const generatedUrls = [...generatedURLsRef.current];
		generatedUrls.forEach((url) => {
			URL.revokeObjectURL(url);
		});
	}, []);

	React.useEffect(() => {
		return revokeAttachmentUrls;
	}, [revokeAttachmentUrls]);

	return { getAttachmentFrom, revokeAttachmentUrls };
}
