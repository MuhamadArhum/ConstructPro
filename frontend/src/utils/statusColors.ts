export const PROJECT_STATUS_COLORS: Record<string, 'info' | 'success' | 'warning' | 'primary' | 'error' | 'default'> = {
  Planning: 'info',
  Active: 'success',
  'On Hold': 'warning',
  Completed: 'primary',
  Cancelled: 'error',
};

export const MACHINERY_STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  Active: 'success',
  UnderMaintenance: 'warning',
  Inactive: 'error',
};

export const VEHICLE_STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  Active: 'success',
  UnderMaintenance: 'warning',
  Inactive: 'error',
};

export const PLANT_STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  Active: 'success',
  UnderMaintenance: 'warning',
  Inactive: 'error',
};

export const INVOICE_STATUS_COLORS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  Draft: 'default',
  Sent: 'info',
  Paid: 'success',
  Cancelled: 'warning',
};

export const PO_STATUS_COLORS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  Draft: 'default',
  Sent: 'info',
  Received: 'success',
  Cancelled: 'error',
  PartiallyReceived: 'warning',
};
