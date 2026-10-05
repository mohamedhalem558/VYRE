export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiErrorPayload;
  timestamp?: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  timestamp?: string;
  uptime?: number;
  environment?: string;
  database?: "connected" | "disconnected" | "unknown";
  version?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
