export interface AuditLogDto {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  succeeded: boolean;
  createdAt: string;
}

export interface AuditLogQueryParams {
  search?: string;
  userId?: string;
  action?: string;
  succeeded?: boolean;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}
