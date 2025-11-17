/** @format */

import {
	keepPreviousData,
	useInfiniteQuery,
	useQuery,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useLiveQuery } from "dexie-react-hooks";
import { parseAsString, useQueryState } from "nuqs";
import React from "react";
import { getDb } from "../db";
import { newChatRecipientsQueries } from "../query-factory";
import { useSelectedRecipientId } from "./use-selected-recipient-id";
import { ChatRecipient } from "../../chat/types";

export const useRecipientsQuery = () => {
	const [search, setSearch] = useQueryState(
		"search",
		parseAsString.withDefault(""),
	);

	const queryOptions = React.useMemo(
		() => ({
			...newChatRecipientsQueries.inifiniteRecipients({ search }),
			placeholderData: keepPreviousData,
		}),
		[search],
	);

	const queryResult = useInfiniteQuery(queryOptions);
	const { data: inifiniteRecipients } = queryResult;

	const [selectedRecipientId] = useSelectedRecipientId();

	const localRecipientIds = useLiveQuery(() => {
		const db = getDb();
		return db.getRecipientIds();
	}, []);

	const deleteStaleLocalRecipients = React.useCallback(
		async (returnedIds: Set<string> | null) => {
			if (!localRecipientIds?.length) {
				return;
			}

			let staleLocalIds: string[] = [];
			if (returnedIds) {
				staleLocalIds = localRecipientIds.filter(
					(id) => !returnedIds.has(id),
				);
			} else {
				staleLocalIds = localRecipientIds;
			}

			if (staleLocalIds.length > 0) {
				const db = getDb();
				await db.transaction("rw", db.messages, async () => {
					for (const id of staleLocalIds) {
						// Delete all messages associated with the stale ID
						await db.deleteRecipientMessages(id);
					}
				});
			}
		},
		[localRecipientIds],
	);

	const recipientIdsToFetchDirectly = React.useMemo(() => {
		const recipientIds: string[] = [
			...(selectedRecipientId ? [selectedRecipientId] : []),
		];

		if (localRecipientIds) {
			localRecipientIds.forEach((id) => {
				if (id !== selectedRecipientId) {
					recipientIds.push(id);
				}
			});
		}
		return recipientIds;
	}, [localRecipientIds, selectedRecipientId]);
	const { data: recipientsFetchedDirectly } = useQuery({
		...newChatRecipientsQueries.recipients(recipientIdsToFetchDirectly),
		enabled: !!recipientIdsToFetchDirectly.length,
		select: (data) => {
			const returnedIds = new Set(data.map((r) => r.id));
			void deleteStaleLocalRecipients(returnedIds);

			return data;
		},
		meta: {
			onError: (error) => {
				if (isAxiosError(error) && error.status === 404) {
					void deleteStaleLocalRecipients(null); // delete all local recipients if 404
				}
				return "none";
			},
		},
	});

	const uniqueRecipientsFromPagination = React.useMemo(() => {
		const recipientIdsFetchedDirectlySet = new Set(
			recipientsFetchedDirectly?.map((r) => r.id),
		);
		const recipients: ChatRecipient[] = [];
		inifiniteRecipients?.pages.forEach((page) => {
			page.data.forEach((r) => {
				if (!recipientIdsFetchedDirectlySet.has(r.id)) {
					recipients.push(r);
				}
			});
		});

		return recipients;
	}, [inifiniteRecipients?.pages, recipientsFetchedDirectly]);

	const finalRecipients = React.useMemo(() => {
		return [
			...(recipientsFetchedDirectly ?? []),
			...(uniqueRecipientsFromPagination ?? []),
		];
	}, [recipientsFetchedDirectly, uniqueRecipientsFromPagination]);

	return {
		recipients: finalRecipients,
		queryResult,
		search,
		setSearch,
		queryOptions,
	};
};
