/** @format */

import { getErrorMessage } from "@/lib/utils";
import {
	chatSocket,
	EventEmitResponse,
} from "@/routes/main/routes/messages/chat-socket-manager";
import { EVENT_EMIT_TIMEOUT } from "@/routes/main/routes/messages/constants";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatQueries } from "../../../../query-factory";
import { PendingChat } from "../../../../types";

export const useResendRequest = () => {
	return useMutation({
		mutationFn: async (data: { chatId: string }) => {
			const response = (await chatSocket
				.timeout(EVENT_EMIT_TIMEOUT)
				.emitWithAck(
					"chat:resend-request",
					data,
				)) as EventEmitResponse<"chat:resend-request">;
			if (!response.success) {
				throw new Error(response.message, {
					cause: response,
				});
			}
			return response.data;
		},
		onSuccess: (_response, { chatId }, _, { client }) => {
			const queryKey = chatQueries.chatDetails(chatId).queryKey;
			client.setQueryData(queryKey, (old) => {
				const canRepend =
					old &&
					old.status === "DECLINED" &&
					old.initiatedBy === "ME";
				if (!canRepend) {
					return old;
				}

				const { closedBy: _, ...oldDetails } = old;
				return {
					...oldDetails,
					status: "PENDING",
				} satisfies PendingChat;
			});
		},
		onError: (error) => {
			toast.error("Unable to resend chat request", {
				description: getErrorMessage(error),
			});
		},
	});
};
