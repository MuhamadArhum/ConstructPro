import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PermissionRoute from '../components/common/PermissionRoute';
import Loader from '../components/common/Loader';
import { Perms } from '../utils/permissions';

// Auth
const LoginPage            = lazy(() => import('../features/auth/LoginPage'));
const ForgotPasswordPage   = lazy(() => import('../features/auth/ForgotPasswordPage'));
const ResetPasswordPage    = lazy(() => import('../features/auth/ResetPasswordPage'));

// Core
const DashboardPage        = lazy(() => import('../features/dashboard/DashboardPage'));
const ProfilePage          = lazy(() => import('../features/profile/ProfilePage'));

// Finance
const IncomeListPage       = lazy(() => import('../features/income/IncomeListPage'));
const IncomeFormPage       = lazy(() => import('../features/income/IncomeFormPage'));
const ExpenseListPage      = lazy(() => import('../features/expense/ExpenseListPage'));
const ExpenseFormPage      = lazy(() => import('../features/expense/ExpenseFormPage'));

// Labour & HR
const LabourListPage       = lazy(() => import('../features/labour/LabourListPage'));
const LabourFormPage       = lazy(() => import('../features/labour/LabourFormPage'));
const LabourAttendancePage = lazy(() => import('../features/labour/LabourAttendancePage'));
const EmployeeListPage     = lazy(() => import('../features/employees/EmployeeListPage'));
const EmployeeFormPage     = lazy(() => import('../features/employees/EmployeeFormPage'));
const SalaryPage           = lazy(() => import('../features/employees/SalaryPage'));

// Assets
const MachineryListPage        = lazy(() => import('../features/machinery/MachineryListPage'));
const MachineryFormPage        = lazy(() => import('../features/machinery/MachineryFormPage'));
const MachineryMaintenancePage = lazy(() => import('../features/machinery/MachineryMaintenancePage'));
const VehicleListPage          = lazy(() => import('../features/vehicles/VehicleListPage'));
const VehicleFormPage          = lazy(() => import('../features/vehicles/VehicleFormPage'));
const VehicleMaintenancePage   = lazy(() => import('../features/vehicles/VehicleMaintenancePage'));
const PlantListPage            = lazy(() => import('../features/plants/PlantListPage'));
const PlantFormPage            = lazy(() => import('../features/plants/PlantFormPage'));

// Projects
const ProjectListPage   = lazy(() => import('../features/projects/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('../features/projects/ProjectDetailPage'));

// Customers & Suppliers
const CustomerListPage   = lazy(() => import('../features/customers/CustomerListPage'));
const CustomerFormPage   = lazy(() => import('../features/customers/CustomerFormPage'));
const CustomerLedgerPage = lazy(() => import('../features/customers/CustomerLedgerPage'));
const SupplierListPage   = lazy(() => import('../features/suppliers/SupplierListPage'));
const SupplierFormPage   = lazy(() => import('../features/suppliers/SupplierFormPage'));
const SupplierLedgerPage = lazy(() => import('../features/suppliers/SupplierLedgerPage'));

// Inventory
const InventoryListPage     = lazy(() => import('../features/inventory/InventoryListPage'));
const InventoryFormPage     = lazy(() => import('../features/inventory/InventoryFormPage'));
const StockTransactionPage  = lazy(() => import('../features/inventory/StockTransactionPage'));

// Finance tools
const TaxListPage           = lazy(() => import('../features/taxes/TaxListPage'));
const TaxFormPage           = lazy(() => import('../features/taxes/TaxFormPage'));
const ChartOfAccountsPage   = lazy(() => import('../features/accounts/ChartOfAccountsPage'));
const AccountFormPage       = lazy(() => import('../features/accounts/AccountFormPage'));
const JournalEntryListPage  = lazy(() => import('../features/accounts/JournalEntryListPage'));
const JournalEntryFormPage  = lazy(() => import('../features/accounts/JournalEntryFormPage'));

// Invoices & POs
const InvoiceListPage         = lazy(() => import('../features/invoices/InvoiceListPage'));
const InvoiceFormPage         = lazy(() => import('../features/invoices/InvoiceFormPage'));
const InvoiceDetailPage       = lazy(() => import('../features/invoices/InvoiceDetailPage'));
const PurchaseOrderListPage   = lazy(() => import('../features/purchase-orders/PurchaseOrderListPage'));
const PurchaseOrderFormPage   = lazy(() => import('../features/purchase-orders/PurchaseOrderFormPage'));
const PurchaseOrderDetailPage = lazy(() => import('../features/purchase-orders/PurchaseOrderDetailPage'));

// Admin
const UserListPage     = lazy(() => import('../features/users/UserListPage'));
const UserFormPage     = lazy(() => import('../features/users/UserFormPage'));
const RoleListPage     = lazy(() => import('../features/roles/RoleListPage'));
const RoleFormPage     = lazy(() => import('../features/roles/RoleFormPage'));
const AuditLogListPage = lazy(() => import('../features/auditLogs/AuditLogListPage'));

// Other
const ReportsPage       = lazy(() => import('../features/reports/ReportsPage'));
const NotificationsPage = lazy(() => import('../features/notifications/NotificationsPage'));
const SettingsPage      = lazy(() => import('../features/settings/SettingsPage'));

const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loader />}>{children}</Suspense>
);

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login"            element={<S><LoginPage /></S>} />
        <Route path="/forgot-password"  element={<S><ForgotPasswordPage /></S>} />
        <Route path="/reset-password"   element={<S><ResetPasswordPage /></S>} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<S><DashboardPage /></S>} />
          <Route path="/profile"   element={<S><ProfilePage /></S>} />

          <Route element={<PermissionRoute permission={Perms.Income.View} />}>
            <Route path="/income"          element={<S><IncomeListPage /></S>} />
            <Route path="/income/new"      element={<S><IncomeFormPage /></S>} />
            <Route path="/income/:id/edit" element={<S><IncomeFormPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Expense.View} />}>
            <Route path="/expense"          element={<S><ExpenseListPage /></S>} />
            <Route path="/expense/new"      element={<S><ExpenseFormPage /></S>} />
            <Route path="/expense/:id/edit" element={<S><ExpenseFormPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Labour.View} />}>
            <Route path="/labour"                  element={<S><LabourListPage /></S>} />
            <Route path="/labour/new"              element={<S><LabourFormPage /></S>} />
            <Route path="/labour/:id/edit"         element={<S><LabourFormPage /></S>} />
            <Route path="/labour/:id/attendance"   element={<S><LabourAttendancePage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Employees.View} />}>
            <Route path="/employees"           element={<S><EmployeeListPage /></S>} />
            <Route path="/employees/new"       element={<S><EmployeeFormPage /></S>} />
            <Route path="/employees/:id/edit"  element={<S><EmployeeFormPage /></S>} />
            <Route path="/employees/:id/salary" element={<S><SalaryPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Machinery.View} />}>
            <Route path="/machinery"                    element={<S><MachineryListPage /></S>} />
            <Route path="/machinery/new"                element={<S><MachineryFormPage /></S>} />
            <Route path="/machinery/:id/edit"           element={<S><MachineryFormPage /></S>} />
            <Route path="/machinery/:id/maintenance"    element={<S><MachineryMaintenancePage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Vehicles.View} />}>
            <Route path="/vehicles"                  element={<S><VehicleListPage /></S>} />
            <Route path="/vehicles/new"              element={<S><VehicleFormPage /></S>} />
            <Route path="/vehicles/:id/edit"         element={<S><VehicleFormPage /></S>} />
            <Route path="/vehicles/:id/maintenance"  element={<S><VehicleMaintenancePage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Plants.View} />}>
            <Route path="/plants"          element={<S><PlantListPage /></S>} />
            <Route path="/plants/new"      element={<S><PlantFormPage /></S>} />
            <Route path="/plants/:id/edit" element={<S><PlantFormPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Projects.View} />}>
            <Route path="/projects"     element={<S><ProjectListPage /></S>} />
            <Route path="/projects/:id" element={<S><ProjectDetailPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Customers.View} />}>
            <Route path="/customers"            element={<S><CustomerListPage /></S>} />
            <Route path="/customers/new"        element={<S><CustomerFormPage /></S>} />
            <Route path="/customers/:id/edit"   element={<S><CustomerFormPage /></S>} />
            <Route path="/customers/:id/ledger" element={<S><CustomerLedgerPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Suppliers.View} />}>
            <Route path="/suppliers"            element={<S><SupplierListPage /></S>} />
            <Route path="/suppliers/new"        element={<S><SupplierFormPage /></S>} />
            <Route path="/suppliers/:id/edit"   element={<S><SupplierFormPage /></S>} />
            <Route path="/suppliers/:id/ledger" element={<S><SupplierLedgerPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Inventory.View} />}>
            <Route path="/inventory"                    element={<S><InventoryListPage /></S>} />
            <Route path="/inventory/new"                element={<S><InventoryFormPage /></S>} />
            <Route path="/inventory/:id/edit"           element={<S><InventoryFormPage /></S>} />
            <Route path="/inventory/:id/transactions"   element={<S><StockTransactionPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Tax.View} />}>
            <Route path="/tax"          element={<S><TaxListPage /></S>} />
            <Route path="/tax/new"      element={<S><TaxFormPage /></S>} />
            <Route path="/tax/:id/edit" element={<S><TaxFormPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Accounts.View} />}>
            <Route path="/accounts"              element={<S><ChartOfAccountsPage /></S>} />
            <Route path="/accounts/new"          element={<S><AccountFormPage /></S>} />
            <Route path="/accounts/:id/edit"     element={<S><AccountFormPage /></S>} />
            <Route path="/accounts/journal"      element={<S><JournalEntryListPage /></S>} />
            <Route path="/accounts/journal/new"  element={<S><JournalEntryFormPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Invoices.View} />}>
            <Route path="/invoices"          element={<S><InvoiceListPage /></S>} />
            <Route path="/invoices/new"      element={<S><InvoiceFormPage /></S>} />
            <Route path="/invoices/:id"      element={<S><InvoiceDetailPage /></S>} />
            <Route path="/invoices/:id/edit" element={<S><InvoiceFormPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.PurchaseOrders.View} />}>
            <Route path="/purchase-orders"          element={<S><PurchaseOrderListPage /></S>} />
            <Route path="/purchase-orders/new"      element={<S><PurchaseOrderFormPage /></S>} />
            <Route path="/purchase-orders/:id"      element={<S><PurchaseOrderDetailPage /></S>} />
            <Route path="/purchase-orders/:id/edit" element={<S><PurchaseOrderFormPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Reports.View} />}>
            <Route path="/reports" element={<S><ReportsPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Notifications.View} />}>
            <Route path="/notifications" element={<S><NotificationsPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Settings.View} />}>
            <Route path="/settings" element={<S><SettingsPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Users.View} />}>
            <Route path="/users"          element={<S><UserListPage /></S>} />
            <Route path="/users/new"      element={<S><UserFormPage /></S>} />
            <Route path="/users/:id/edit" element={<S><UserFormPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Roles.View} />}>
            <Route path="/roles"          element={<S><RoleListPage /></S>} />
            <Route path="/roles/new"      element={<S><RoleFormPage /></S>} />
            <Route path="/roles/:id/edit" element={<S><RoleFormPage /></S>} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.AuditLogs.View} />}>
            <Route path="/audit-logs" element={<S><AuditLogListPage /></S>} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
