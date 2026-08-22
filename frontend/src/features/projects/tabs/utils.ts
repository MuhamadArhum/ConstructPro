export const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
export const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');
export const today = () => new Date().toISOString().split('T')[0];
export const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

export const INV_STATUS_COLOR = (s: string): 'default' | 'info' | 'success' | 'error' | 'warning' => {
  if (s === 'Sent') return 'info';
  if (s === 'Paid') return 'success';
  if (s === 'Overdue') return 'error';
  if (s === 'Cancelled') return 'default';
  return 'warning';
};

export const PO_STATUS_COLOR = (s: string): 'default' | 'info' | 'success' | 'error' | 'warning' => {
  if (s === 'Sent') return 'info';
  if (s === 'Received') return 'success';
  if (s === 'Cancelled') return 'default';
  return 'warning';
};
