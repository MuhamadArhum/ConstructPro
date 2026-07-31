import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PermissionRoute from '../components/common/PermissionRoute';
import LoginPage from '../features/auth/LoginPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import UserListPage from '../features/users/UserListPage';
import UserFormPage from '../features/users/UserFormPage';
import RoleListPage from '../features/roles/RoleListPage';
import RoleFormPage from '../features/roles/RoleFormPage';
import ProfilePage from '../features/profile/ProfilePage';
import AuditLogListPage from '../features/auditLogs/AuditLogListPage';
import IncomeListPage from '../features/income/IncomeListPage';
import IncomeFormPage from '../features/income/IncomeFormPage';
import ExpenseListPage from '../features/expense/ExpenseListPage';
import ExpenseFormPage from '../features/expense/ExpenseFormPage';
import LabourListPage from '../features/labour/LabourListPage';
import LabourFormPage from '../features/labour/LabourFormPage';
import LabourAttendancePage from '../features/labour/LabourAttendancePage';
import EmployeeListPage from '../features/employees/EmployeeListPage';
import EmployeeFormPage from '../features/employees/EmployeeFormPage';
import SalaryPage from '../features/employees/SalaryPage';
import MachineryListPage from '../features/machinery/MachineryListPage';
import MachineryFormPage from '../features/machinery/MachineryFormPage';
import MachineryMaintenancePage from '../features/machinery/MachineryMaintenancePage';
import VehicleListPage from '../features/vehicles/VehicleListPage';
import VehicleFormPage from '../features/vehicles/VehicleFormPage';
import VehicleMaintenancePage from '../features/vehicles/VehicleMaintenancePage';
import PlantListPage from '../features/plants/PlantListPage';
import PlantFormPage from '../features/plants/PlantFormPage';
import CustomerListPage from '../features/customers/CustomerListPage';
import CustomerFormPage from '../features/customers/CustomerFormPage';
import CustomerLedgerPage from '../features/customers/CustomerLedgerPage';
import SupplierListPage from '../features/suppliers/SupplierListPage';
import SupplierFormPage from '../features/suppliers/SupplierFormPage';
import SupplierLedgerPage from '../features/suppliers/SupplierLedgerPage';
import InventoryListPage from '../features/inventory/InventoryListPage';
import InventoryFormPage from '../features/inventory/InventoryFormPage';
import StockTransactionPage from '../features/inventory/StockTransactionPage';
import TaxListPage from '../features/taxes/TaxListPage';
import TaxFormPage from '../features/taxes/TaxFormPage';
import ChartOfAccountsPage from '../features/accounts/ChartOfAccountsPage';
import AccountFormPage from '../features/accounts/AccountFormPage';
import JournalEntryListPage from '../features/accounts/JournalEntryListPage';
import JournalEntryFormPage from '../features/accounts/JournalEntryFormPage';
import InvoiceListPage from '../features/invoices/InvoiceListPage';
import InvoiceFormPage from '../features/invoices/InvoiceFormPage';
import InvoiceDetailPage from '../features/invoices/InvoiceDetailPage';
import PurchaseOrderListPage from '../features/purchase-orders/PurchaseOrderListPage';
import PurchaseOrderFormPage from '../features/purchase-orders/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from '../features/purchase-orders/PurchaseOrderDetailPage';
import ReportsPage from '../features/reports/ReportsPage';
import NotificationsPage from '../features/notifications/NotificationsPage';
import SettingsPage from '../features/settings/SettingsPage';
import { lazy, Suspense } from 'react';
import Loader from '../components/common/Loader';
import { Perms } from '../utils/permissions';

const ProjectListPage = lazy(() => import('../features/projects/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('../features/projects/ProjectDetailPage'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<PermissionRoute permission={Perms.Income.View} />}>
            <Route path="/income" element={<IncomeListPage />} />
            <Route path="/income/new" element={<IncomeFormPage />} />
            <Route path="/income/:id/edit" element={<IncomeFormPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Expense.View} />}>
            <Route path="/expense" element={<ExpenseListPage />} />
            <Route path="/expense/new" element={<ExpenseFormPage />} />
            <Route path="/expense/:id/edit" element={<ExpenseFormPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Labour.View} />}>
            <Route path="/labour" element={<LabourListPage />} />
            <Route path="/labour/new" element={<LabourFormPage />} />
            <Route path="/labour/:id/edit" element={<LabourFormPage />} />
            <Route path="/labour/:id/attendance" element={<LabourAttendancePage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Employees.View} />}>
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route path="/employees/new" element={<EmployeeFormPage />} />
            <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
            <Route path="/employees/:id/salary" element={<SalaryPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Machinery.View} />}>
            <Route path="/machinery" element={<MachineryListPage />} />
            <Route path="/machinery/new" element={<MachineryFormPage />} />
            <Route path="/machinery/:id/edit" element={<MachineryFormPage />} />
            <Route path="/machinery/:id/maintenance" element={<MachineryMaintenancePage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Vehicles.View} />}>
            <Route path="/vehicles" element={<VehicleListPage />} />
            <Route path="/vehicles/new" element={<VehicleFormPage />} />
            <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />
            <Route path="/vehicles/:id/maintenance" element={<VehicleMaintenancePage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Plants.View} />}>
            <Route path="/plants" element={<PlantListPage />} />
            <Route path="/plants/new" element={<PlantFormPage />} />
            <Route path="/plants/:id/edit" element={<PlantFormPage />} />
          </Route>

          <Route path="/projects" element={<Suspense fallback={<Loader />}><ProjectListPage /></Suspense>} />
          <Route path="/projects/:id" element={<Suspense fallback={<Loader />}><ProjectDetailPage /></Suspense>} />

          <Route element={<PermissionRoute permission={Perms.Customers.View} />}>
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/customers/new" element={<CustomerFormPage />} />
            <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
            <Route path="/customers/:id/ledger" element={<CustomerLedgerPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Suppliers.View} />}>
            <Route path="/suppliers" element={<SupplierListPage />} />
            <Route path="/suppliers/new" element={<SupplierFormPage />} />
            <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
            <Route path="/suppliers/:id/ledger" element={<SupplierLedgerPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Inventory.View} />}>
            <Route path="/inventory" element={<InventoryListPage />} />
            <Route path="/inventory/new" element={<InventoryFormPage />} />
            <Route path="/inventory/:id/edit" element={<InventoryFormPage />} />
            <Route path="/inventory/:id/transactions" element={<StockTransactionPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Tax.View} />}>
            <Route path="/tax" element={<TaxListPage />} />
            <Route path="/tax/new" element={<TaxFormPage />} />
            <Route path="/tax/:id/edit" element={<TaxFormPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Accounts.View} />}>
            <Route path="/accounts" element={<ChartOfAccountsPage />} />
            <Route path="/accounts/new" element={<AccountFormPage />} />
            <Route path="/accounts/:id/edit" element={<AccountFormPage />} />
            <Route path="/accounts/journal" element={<JournalEntryListPage />} />
            <Route path="/accounts/journal/new" element={<JournalEntryFormPage />} />
            <Route path="/accounts/journal/:id" element={<JournalEntryListPage />} />
          </Route>

          <Route path="/invoices" element={<InvoiceListPage />} />
          <Route path="/invoices/new" element={<InvoiceFormPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/invoices/:id/edit" element={<InvoiceFormPage />} />

          <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
          <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
          <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
          <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderFormPage />} />

          <Route element={<PermissionRoute permission={Perms.Reports.View} />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Notifications.View} />}>
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Settings.View} />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Users.View} />}>
            <Route path="/users" element={<UserListPage />} />
            <Route path="/users/new" element={<UserFormPage />} />
            <Route path="/users/:id/edit" element={<UserFormPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.Roles.View} />}>
            <Route path="/roles" element={<RoleListPage />} />
            <Route path="/roles/new" element={<RoleFormPage />} />
            <Route path="/roles/:id/edit" element={<RoleFormPage />} />
          </Route>

          <Route element={<PermissionRoute permission={Perms.AuditLogs.View} />}>
            <Route path="/audit-logs" element={<AuditLogListPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
