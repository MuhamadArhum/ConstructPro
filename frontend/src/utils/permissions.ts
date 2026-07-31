export const Perms = {
  Dashboard: { View: 'Dashboard.View' },
  Users: {
    View: 'Users.View',
    Create: 'Users.Create',
    Edit: 'Users.Edit',
    Delete: 'Users.Delete',
  },
  Roles: {
    View: 'Roles.View',
    Create: 'Roles.Create',
    Edit: 'Roles.Edit',
    Delete: 'Roles.Delete',
  },
  AuditLogs: { View: 'AuditLogs.View' },
  Profile: { View: 'Profile.View', Edit: 'Profile.Edit' },
  Income: { View: 'Income.View', Create: 'Income.Create', Edit: 'Income.Edit', Delete: 'Income.Delete' },
  Expense: { View: 'Expense.View', Create: 'Expense.Create', Edit: 'Expense.Edit', Delete: 'Expense.Delete' },
  Labour: { View: 'Labour.View', Create: 'Labour.Create', Edit: 'Labour.Edit', Delete: 'Labour.Delete' },
  Employees: { View: 'Employees.View', Create: 'Employees.Create', Edit: 'Employees.Edit', Delete: 'Employees.Delete' },
  Machinery: { View: 'Machinery.View', Create: 'Machinery.Create', Edit: 'Machinery.Edit', Delete: 'Machinery.Delete' },
  Vehicles: { View: 'Vehicles.View', Create: 'Vehicles.Create', Edit: 'Vehicles.Edit', Delete: 'Vehicles.Delete' },
  Plants: { View: 'Plants.View', Create: 'Plants.Create', Edit: 'Plants.Edit', Delete: 'Plants.Delete' },
  Customers: { View: 'Customers.View', Create: 'Customers.Create', Edit: 'Customers.Edit', Delete: 'Customers.Delete' },
  Suppliers: { View: 'Suppliers.View', Create: 'Suppliers.Create', Edit: 'Suppliers.Edit', Delete: 'Suppliers.Delete' },
  Inventory: { View: 'Inventory.View', Create: 'Inventory.Create', Edit: 'Inventory.Edit', Delete: 'Inventory.Delete' },
  Tax: { View: 'Tax.View', Create: 'Tax.Create', Edit: 'Tax.Edit', Delete: 'Tax.Delete' },
  Accounts: { View: 'Accounts.View', Create: 'Accounts.Create', Edit: 'Accounts.Edit', Delete: 'Accounts.Delete' },
  Projects: { View: 'Project.View', Manage: 'Project.Manage' },
  Invoices: { View: 'Invoice.View', Manage: 'Invoice.Manage' },
  PurchaseOrders: { View: 'PurchaseOrder.View', Manage: 'PurchaseOrder.Manage' },
  Reports: { View: 'Reports.View' },
  Notifications: { View: 'Notifications.View' },
  Settings: { View: 'Settings.View', Edit: 'Settings.Edit' },
} as const;

export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function hasAnyPermission(permissions: string[], ...perms: string[]): boolean {
  return perms.some((p) => permissions.includes(p));
}
