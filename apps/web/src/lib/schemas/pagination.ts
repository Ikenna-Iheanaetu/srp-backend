/** @format */

import { z } from "zod";

export const PaginationStateSchema = z.object({
	pageIndex: z.number().int().nonnegative(),
	pageSize: z.number().int().positive(),
});
export type PaginationState = z.infer<typeof PaginationStateSchema>;

export const ServerPaginationParamsSchema = z.object({
	/**1-based indexing */
	page: z.number().int().positive().optional(),
	limit: z.number().int().positive().optional(),
});
export type ServerPaginationParams = z.infer<
	typeof ServerPaginationParamsSchema
>;

export const PaginationSchema = z.union([
	PaginationStateSchema,
	ServerPaginationParamsSchema,
]);
export type Pagination = z.infer<typeof PaginationSchema>;
