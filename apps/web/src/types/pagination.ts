/** @format */

import { ServerPaginationParams } from "@/lib/schemas/pagination";

export type { ServerPaginationParams }; // exported again here for backward compatibility

export interface ServerPaginationMeta extends Required<ServerPaginationParams> {
	total: number;
	totalPages: number;
}

// Helper type to detect arrays strictly
type IsArray<T> = [T] extends [unknown[]] ? true : false;

// Distribute over unions and check if any part is an array
type ContainsArray<T> = IsArray<T> extends true ? true : false;

export interface PaginatedServerResponse<TData = unknown> {
	data: ContainsArray<TData> extends true ? never : TData[];
	meta: ServerPaginationMeta;
}
