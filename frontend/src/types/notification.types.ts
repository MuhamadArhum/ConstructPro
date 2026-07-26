export type NotificationType = 'SalaryDue' | 'TaxDue' | 'MaintenanceDue' | 'LowStock' | 'PendingPayment' | 'General';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  typeDisplay: string;
  title: string;
  message: string;
  isRead: boolean;
  entityId?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationQuery {
  pageNumber?: number;
  pageSize?: number;
  isRead?: boolean;
}

export interface UnreadCountDto {
  count: number;
}
