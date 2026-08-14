export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiError {
  title?: string;
  message?: string;
  status?: number;
  statusCode?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}
