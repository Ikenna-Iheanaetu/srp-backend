import { PaginationMetaResponse } from '../common/dto/pagination-meta.dto';

export interface PaginationParams {
  page: number;
  take: number;
  skip: number;
}

/**
 * Creates normalized pagination parameters with validation
 * @param page - Page number (string or number)
 * @param limit - Items per page (string or number)
 * @returns Normalized pagination parameters
 */
export function createPaginationParams(page?: number | string, limit?: number | string): PaginationParams {
  const normalizedPage = Number(page ?? 1);
  const normalizedTake = Number(limit ?? 10);

  validatePagination(normalizedPage, normalizedTake);

  const skip = (normalizedPage - 1) * normalizedTake;

  return {
    page: normalizedPage,
    take: normalizedTake,
    skip
  };
}

/**
 * Validates pagination parameters
 * @param page - Page number
 * @param limit - Items per page
 */
export function validatePagination(page: number, limit: number): void {
  if (page < 1) {
    throw new Error('Page must be greater than 0');
  }
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
}

/**
 * Creates a pagination meta object with calculated totalPages
 * @param total - Total number of items
 * @param page - Current page number (1-based)
 * @param take - Number of items per page
 * @returns PaginationMetaDto object
 */
export function createPaginationMeta(
  total: number,
  page: number,
  take: number,
): PaginationMetaResponse {
  return {
    meta: {
      total,
      totalPages: Math.ceil(total / take),
      page,
      limit: take,
    },
  };
}
