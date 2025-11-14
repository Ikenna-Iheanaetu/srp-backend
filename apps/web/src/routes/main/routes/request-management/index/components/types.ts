/** @format */

export interface Request {
	id: string;
	chatId: string;
	requestId: string;
	dateTime: string;
	initiator: {
		id: string;
		name: string;
		type: "player" | "company";
		avatar?: string;
	};
	recipient: {
		id: string;
		name: string;
		type: "player" | "company";
		avatar?: string;
	};
	status: "Pending" | "Hired" | "Closed" | "Cancelled";
	timeline?: TimelineEvent[];
}

export interface TimelineEvent {
	id: string;
	description: string;
	timestamp: string;
}

