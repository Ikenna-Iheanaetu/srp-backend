export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta: {
    timestamp: string;
    path: string;
    method: string;
    requestId: string;
    version?: string;
  };
  errors?: ApiError[];
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
