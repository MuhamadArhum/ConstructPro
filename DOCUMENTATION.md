# ConstructPro ERP — Full Project Documentation

> **Internal Name:** BuildERP  
> **Version:** 1.0.0  
> **Stack:** ASP.NET Core 8 (Backend) + React 19 + TypeScript (Frontend) + PostgreSQL (Supabase)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Backend — ASP.NET Core 8](#3-backend--aspnet-core-8)
4. [Frontend — React 19 + TypeScript](#4-frontend--react-19--typescript)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Reference](#7-api-reference)
8. [Permissions System](#8-permissions-system)
9. [Getting Started (Local Dev)](#9-getting-started-local-dev)
10. [Deployment](#10-deployment)
11. [Module Status](#11-module-status)

---

## 1. Project Overview

ConstructPro ERP is a full-stack enterprise resource planning system designed for construction companies. It manages day-to-day operations including financial tracking, human resources, asset management, inventory, and procurement — all behind a role-based permission system with a complete audit trail.

### Key Capabilities

| Domain | Features |
|--------|----------|
| Finance | Income & expense tracking, Chart of Accounts, Journal Entries, Tax records, Reports |
| HR | Labour (daily wage) with attendance & advances, Employee (salaried) with salary processing |
| Assets | Machinery, Vehicles, Plants with maintenance scheduling |
| Procurement | Customers, Suppliers, Inventory with low-stock alerts |
| Admin | User/Role management, Permission assignment, Company settings, Audit logs |
| Security | JWT auth, Refresh tokens, Role-based + Permission-based authorization |

---

## 2. Architecture

### Overview

```
┌──────────────────────────────────────────────┐
│              React Frontend (Vite)           │
│   Redux Toolkit + RTK Query + MUI v9        │
│              http://localhost:5173           │
└─────────────────────┬────────────────────────┘
                      │ HTTP / REST JSON
┌─────────────────────▼────────────────────────┐
│           ASP.NET Core 8 Web API             │
│    JWT Auth │ Permission Guards │ Serilog    │
│         https://localhost:5001               │
├──────────────────────────────────────────────┤
│              Clean Architecture              │
│  API → Application → Domain ← Infrastructure│
└─────────────────────┬────────────────────────┘
                      │ EF Core 8
┌─────────────────────▼────────────────────────┐
│         PostgreSQL (Supabase Cloud)          │
│              26 tables                       │
└──────────────────────────────────────────────┘
```

### Backend — Clean Architecture Layers

```
backend/src/
├── BuildERP.Domain/          # Entities, Enums, Constants (no dependencies)
├── BuildERP.Application/     # DTOs, Interfaces, Validators (depends on Domain)
├── BuildERP.Infrastructure/  # EF Core, Services, Repositories (depends on Application)
└── BuildERP.API/             # Controllers, Middleware, Auth (depends on Application)
```

### Frontend — Feature-based Structure

```
frontend/src/
├── app/             # Redux store, typed hooks
├── api/             # RTK Query base + axios client
├── features/        # 21 feature modules (page + API slice per feature)
├── components/      # Layout + common reusable components
├── routes/          # AppRoutes with permission guards
├── types/           # TypeScript interfaces
├── utils/           # Constants, permissions, token storage
└── theme/           # MUI theme configuration
```

---

## 3. Backend — ASP.NET Core 8

### 3.1 Domain Layer (`BuildERP.Domain`)

#### Entities

| Entity | Description |
|--------|-------------|
| `ApplicationUser` | Extended Identity user (FullName, IsActive, ProfilePicturePath, RefreshTokens) |
| `RefreshToken` | JWT refresh token storage with expiry and rotation |
| `Permission` | Single permission record (Code, Name, Module) |
| `RolePermission` | Many-to-many: Role ↔ Permission |
| `AuditLog` | User action audit trail (UserId, Action, Entity, Timestamp) |
| `Income` | Income records (Amount, Date, Category, CustomerName, ProjectName) |
| `Expense` | Expense records (Amount, Date, Category, Vendor) |
| `Labour` | Daily-wage worker (DailyWage, OvertimeRate → Attendances, Advances) |
| `LabourAttendance` | Daily attendance for a labour record |
| `LabourAdvance` | Advance payment issued to a labour worker |
| `Employee` | Salaried employee (BasicSalary, Designation, Department) |
| `SalaryPayment` | Salary disbursement record |
| `Machinery` | Equipment/machinery (Status, RunningHours, NextMaintenanceDate) |
| `MachineryMaintenance` | Maintenance event for machinery |
| `Vehicle` | Fleet vehicle (Registration, Mileage) |
| `VehicleMaintenance` | Maintenance history for a vehicle |
| `Plant` | Plant & equipment record |
| `Customer` | Customer (NTN, CNIC, ProjectName, TotalBilled, TotalPaid) |
| `Supplier` | Supplier record |
| `InventoryItem` | Stock item (UnitPrice, LowStockThreshold → StockTransactions) |
| `StockTransaction` | Inventory movement (In/Out) |
| `ChartOfAccount` | General Ledger account (AccountType, ParentId hierarchy) |
| `JournalEntry` | Double-entry bookkeeping header |
| `JournalEntryLine` | Debit/Credit line on a journal entry |
| `TaxRecord` | Tax record (Type: Sales, Purchase, etc.) |
| `Notification` | System notification for a user |
| `CompanySettings` | Organisation profile (NTN, STRN, Currency, FinancialYearStart) |

#### Enums

| Enum | Values |
|------|--------|
| `IncomeCategory` | ProjectPayment, Advance, Retention, Other |
| `ExpenseCategory` | Material, Labour, Equipment, Fuel, Utilities, Other |
| `AccountType` | Asset, Liability, Equity, Revenue, Expense |
| `MachineryStatus` | Active, UnderMaintenance, Retired |
| `VehicleStatus` | Active, UnderMaintenance, Retired |
| `PlantStatus` | Active, UnderMaintenance, Retired |
| `StockTransactionType` | In, Out |
| `TaxType` | SalesTax, PurchaseTax, IncomeTax, WithholdingTax, Other |
| `NotificationType` | Info, Warning, Error, Success |
| `MaintenanceType` | Scheduled, Emergency |

#### Constants

- **`Roles`** — `Admin`, `Accountant`, `Manager`, `DataEntryOperator`
- **`Permissions`** — 43 permission codes in `Module.Action` format (e.g. `Income.View`, `Users.Create`)
- **`Modules`** — Permission module groupings (Income, Expense, Labour, Employees, …)
- **`Actions`** — Permission action types (View, Create, Update, Delete, Export, …)

---

### 3.2 Application Layer (`BuildERP.Application`)

#### Common Models

```csharp
Result<T>        // Generic success/failure wrapper
PaginatedList<T> // Paginated query results (PageNumber, PageSize, TotalCount)
```

#### Custom Exceptions

| Exception | HTTP Status |
|-----------|-------------|
| `NotFoundException` | 404 |
| `ValidationAppException` | 400 |
| `ForbiddenAccessException` | 403 |
| `AuthenticationException` | 401 |

#### Service Interfaces

**Auth & Identity**
- `IAuthService` — Login, Refresh, Logout, ForgotPassword, ResetPassword, ChangePassword
- `IJwtTokenService` — Generate access/refresh tokens, validate tokens
- `ICurrentUserService` — Extract authenticated user's Id, Email, Roles, Permissions from HttpContext

**User & Role Management**
- `IUserService` — CRUD users, assign roles, admin password reset
- `IRoleService` — CRUD roles, assign permissions
- `IProfileService` — User profile update

**Business Services**
- `IIncomeService`, `IExpenseService` — Financial CRUD with filtering
- `ILabourService` — Labour + attendance + advance management
- `IEmployeeService` — Employee CRUD + salary processing
- `IMachineryService`, `IVehicleService`, `IPlantService` — Asset management
- `ICustomerService`, `ISupplierService` — Relationship management
- `IInventoryService` — Stock management
- `ITaxService` — Tax records
- `IAccountService` — GL accounts + journal entries
- `IDashboardService` — Aggregated dashboard metrics
- `IReportService` — Report generation
- `INotificationService` — Notification management
- `ISettingsService` — Company settings

**Infrastructure**
- `IGenericRepository<T>` — GetById, GetAll, Find, Add, Update, Remove
- `IUnitOfWork` — Wraps repositories + SaveChangesAsync
- `IEmailService` — Send transactional emails

---

### 3.3 Infrastructure Layer (`BuildERP.Infrastructure`)

#### DbContext

`ApplicationDbContext` extends `IdentityDbContext<ApplicationUser>` with 26 `DbSet<T>` properties and fluent configurations for all entities.

#### Repositories

```
GenericRepository<T>   GetByIdAsync, GetAllAsync, FindAsync, AddAsync, Update, Remove
UnitOfWork             Manages repositories and wraps SaveChangesAsync
```

#### EF Core Migrations

| Migration | Description |
|-----------|-------------|
| `20260718170721_InitialCreate` | Identity tables + Permission + AuditLog + RefreshToken |
| `20260718183637_AddBusinessModules` | Income, Expense, Labour, Employee, Machinery, Vehicle |
| `20260724000000_AddNewModules` | Plant, Customer, Supplier, Inventory, Tax, Accounts, Settings, Notifications |

#### DbSeeder (runs on startup in dev)

1. Creates roles: Admin, Accountant, Manager, DataEntryOperator
2. Inserts all 43 permissions
3. Assigns all permissions to Admin role
4. Creates default admin user (`admin@builderp.local` / `Admin@12345`)
5. Inserts sample data for income, expenses, labour, employees

---

### 3.4 API Layer (`BuildERP.API`)

#### Middleware Pipeline

```
HTTPS Redirection
→ CORS
→ RequestLoggingMiddleware    (logs all HTTP in/out)
→ ExceptionHandlingMiddleware (returns RFC 7807 ProblemDetails on errors)
→ Authentication (JWT Bearer)
→ Authorization (Permission-based)
→ Controllers
```

#### Controllers (21 total)

| Controller | Base Route | Key Endpoints |
|------------|-----------|---------------|
| `AuthController` | `/api/auth` | POST /login, /refresh, /logout, /forgot-password, /reset-password, /change-password, GET /me |
| `UsersController` | `/api/users` | CRUD + role assignment + admin password reset |
| `RolesController` | `/api/roles` | CRUD + permission assignment |
| `ProfileController` | `/api/profile` | GET + PUT profile |
| `AuditLogsController` | `/api/audit-logs` | GET with filtering |
| `DashboardController` | `/api/dashboard` | GET stats |
| `IncomeController` | `/api/income` | Full CRUD + summary |
| `ExpenseController` | `/api/expenses` | Full CRUD + summary |
| `LabourController` | `/api/labour` | CRUD + attendance + advances |
| `EmployeesController` | `/api/employees` | CRUD + salary processing |
| `MachineryController` | `/api/machinery` | CRUD + maintenance records |
| `VehicleController` | `/api/vehicles` | CRUD + maintenance records |
| `PlantController` | `/api/plants` | Full CRUD |
| `CustomerController` | `/api/customers` | Full CRUD |
| `SupplierController` | `/api/suppliers` | Full CRUD |
| `InventoryController` | `/api/inventory` | CRUD + stock transactions |
| `TaxController` | `/api/taxes` | Full CRUD |
| `AccountsController` | `/api/accounts` | Chart of Accounts + Journal Entries |
| `NotificationsController` | `/api/notifications` | GET + mark read |
| `SettingsController` | `/api/settings` | GET + PUT |
| `ReportsController` | `/api/reports` | Financial reports |

#### Authorization

Every protected endpoint uses `[HasPermission("Module.Action")]`. The custom `PermissionAuthorizationHandler` reads permission claims embedded in the JWT at login.

---

### 3.5 Configuration (`appsettings.json`)

```json
{
  "JwtSettings": {
    "Secret": "...",
    "Issuer": "BuildERP",
    "Audience": "BuildERP",
    "AccessTokenExpirationMinutes": 30,
    "RefreshTokenExpirationDays": 7
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  },
  "Serilog": {
    "MinimumLevel": "Information",
    "WriteTo": ["Console", "File (logs/ folder, 14-day retention)"]
  }
}
```

---

## 4. Frontend — React 19 + TypeScript

### 4.1 Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8.1 | Build tool / dev server |
| MUI | v9.2 | Component library |
| Redux Toolkit | 2.12 | Global state management |
| RTK Query | (included) | Server state + caching |
| React Router | v7.18 | Client-side routing |
| Axios | 1.18 | HTTP client with interceptors |
| oxlint | 1.71 | Fast linting |

### 4.2 Redux Store

```
store.ts
├── auth          (authSlice) — current user credentials
├── snackbar      (snackbarSlice) — global toast notifications
└── baseApi       (RTK Query) — all server state + cache
```

### 4.3 RTK Query API Slices (21 total)

Each feature exposes hooks like `useGetIncomesQuery`, `useCreateIncomeMutation`, etc.

| Feature API | Tags Used |
|-------------|-----------|
| `authApi` | Auth |
| `usersApi` | Users |
| `rolesApi` | Roles |
| `profileApi` | Profile |
| `auditLogsApi` | AuditLogs |
| `dashboardApi` | Dashboard |
| `incomeApi` | Income |
| `expenseApi` | Expense |
| `labourApi` | Labour |
| `employeeApi` | Employees |
| `machineryApi` | Machinery |
| `vehicleApi` | Vehicles |
| `plantApi` | Plants |
| `customerApi` | Customers |
| `supplierApi` | Suppliers |
| `inventoryApi` | Inventory |
| `taxApi` | Taxes |
| `accountsApi` | Accounts |
| `reportsApi` | Reports |
| `notificationApi` | Notifications |
| `settingsApi` | Settings |

### 4.4 Axios Client (`api/axiosClient.ts`)

- Attaches `Authorization: Bearer <token>` to every request
- On **401** response: automatically calls refresh token endpoint, retries original request
- On refresh failure: clears tokens + redirects to `/login`

### 4.5 Routing (`routes/AppRoutes.tsx`)

```
/login                  → LoginPage          (public)
/forgot-password        → ForgotPasswordPage (public)
/reset-password         → ResetPasswordPage  (public)

/ (ProtectedRoute)
├── /dashboard          → DashboardPage
├── /income             → IncomeListPage       [Income.View]
├── /income/create      → IncomeFormPage       [Income.Create]
├── /income/:id/edit    → IncomeFormPage       [Income.Update]
├── /expenses           → ExpenseListPage      [Expense.View]
├── /labour             → LabourListPage       [Labour.View]
├── /labour/:id/attendance → LabourAttendancePage
├── /employees          → EmployeeListPage     [Employees.View]
├── /machinery          → MachineryListPage    [Machinery.View]
├── /vehicles           → VehicleListPage      [Vehicles.View]
├── /plants             → PlantListPage        [Plants.View]
├── /customers          → CustomerListPage     [Customers.View]
├── /suppliers          → SupplierListPage     [Suppliers.View]
├── /inventory          → InventoryListPage    [Inventory.View]
├── /taxes              → TaxListPage          [Tax.View]
├── /accounts           → ChartOfAccountsPage [Accounts.View]
├── /accounts/journal   → JournalEntryListPage [Accounts.View]
├── /reports            → ReportsPage          [Reports.View]
├── /notifications      → NotificationsPage
├── /users              → UserListPage         [Users.View]
├── /roles              → RoleListPage         [Roles.View]
├── /audit-logs         → AuditLogListPage     [AuditLogs.View]
├── /settings           → SettingsPage         [Settings.View]
└── /profile            → ProfilePage
```

### 4.6 Layout Components

```
MainLayout
├── Header      (top bar, user avatar menu, logout)
├── Sidebar     (240px drawer, 23 navigation items with icons)
└── <Outlet>    (page content)

AuthLayout      (centered card layout for login/forgot/reset)
```

### 4.7 Common Components

| Component | Purpose |
|-----------|---------|
| `ProtectedRoute` | Redirects unauthenticated users to /login |
| `PermissionRoute` | Renders 403 if user lacks required permission |
| `RoleBasedRoute` | Guards routes by role |
| `PermissionGate` | Conditionally renders UI elements by permission |
| `ConfirmDialog` | Reusable "Are you sure?" modal |
| `GlobalSnackbar` | App-wide toast notifications (success/error/info) |
| `Loader` | Full-screen or inline spinner |

### 4.8 Theme

```
Primary color:   #1565c0 (blue)
Secondary color: #00897b (teal)
Mode:            Light
Font:            MUI default (Roboto)
```

### 4.9 Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | `/api` |

---

## 5. Database Schema

**Database:** PostgreSQL (hosted on Supabase)  
**ORM:** Entity Framework Core 8 (Code-First)  
**Total Tables:** 26

### Identity Tables (ASP.NET Identity)

| Table | Description |
|-------|-------------|
| `AspNetUsers` | Extended with FullName, IsActive, ProfilePicturePath |
| `AspNetRoles` | System roles |
| `AspNetUserRoles` | User ↔ Role mapping |
| `AspNetRoleClaims` | Role-level claims |
| `AspNetUserClaims` | User-level claims |
| `AspNetUserLogins` | External login providers |
| `AspNetUserTokens` | Auth tokens |

### Application Tables

| Table | Key Columns |
|-------|-------------|
| `Permissions` | Id, Code, Name, Module |
| `RolePermissions` | RoleId, PermissionId |
| `RefreshTokens` | UserId, Token, Expires, IsRevoked |
| `AuditLogs` | UserId, Action, EntityName, EntityId, Timestamp, OldValues, NewValues |
| `Income` | Amount, Date, Category, CustomerName, ProjectName, Description |
| `Expense` | Amount, Date, Category, Vendor, Description |
| `Labour` | Name, DailyWage, OvertimeRate, JoiningDate, IsActive |
| `LabourAttendance` | LabourId, Date, IsPresent, OvertimeHours |
| `LabourAdvance` | LabourId, Amount, Date, Reason |
| `Employee` | Name, BasicSalary, Designation, Department, JoiningDate |
| `SalaryPayment` | EmployeeId, Month, Year, GrossSalary, Deductions, NetSalary |
| `Machinery` | Name, Model, Status, RunningHours, NextMaintenanceDate |
| `MachineryMaintenance` | MachineryId, Date, Type, Cost, Description |
| `Vehicle` | Registration, Make, Model, Status, Mileage |
| `VehicleMaintenance` | VehicleId, Date, Type, Cost, Description |
| `Plant` | Name, Model, Status |
| `Customer` | Name, NTN, CNIC, ProjectName, TotalBilled, TotalPaid |
| `Supplier` | Name, Contact, Address |
| `InventoryItem` | Name, Unit, Quantity, UnitPrice, LowStockThreshold |
| `StockTransaction` | ItemId, Type (In/Out), Quantity, Date, Reference |
| `TaxRecord` | Type, Amount, Period, Reference |
| `ChartOfAccount` | Code, Name, AccountType, ParentId (self-referential) |
| `JournalEntry` | Date, Reference, Description |
| `JournalEntryLine` | EntryId, AccountId, Debit, Credit |
| `Notification` | UserId, Title, Message, Type, IsRead |
| `CompanySettings` | NTN, STRN, Address, Currency, FinancialYearStart |

### Base Entity Fields

All domain entities inherit `BaseAuditableEntity` which includes:

```
Id           (int, PK, auto-increment)
CreatedAt    (DateTime, set on insert)
UpdatedAt    (DateTime, updated on save)
CreatedBy    (string, current user)
UpdatedBy    (string, current user)
```

---

## 6. Authentication & Authorization

### Token Flow

```
1. POST /api/auth/login  →  { accessToken, refreshToken, user }
2. Frontend stores tokens in localStorage
3. Every request: Authorization: Bearer <accessToken>
4. On 401: POST /api/auth/refresh → new accessToken + refreshToken
5. POST /api/auth/logout → revokes refreshToken server-side
```

### JWT Claims (embedded in access token)

```
sub          → UserId
email        → User email
name         → Full name
role         → Comma-separated role names
permissions  → Comma-separated permission codes
```

**Access token lifetime:** 30 minutes  
**Refresh token lifetime:** 7 days (rotating — each refresh issues a new refresh token)

### Password Policy

- Minimum 8 characters
- Requires uppercase letter
- Requires special character
- Lockout after 5 failed attempts

### Roles

| Role | Typical Access |
|------|---------------|
| `Admin` | All permissions |
| `Accountant` | Financial modules (Income, Expense, Tax, Accounts, Reports) |
| `Manager` | HR, Assets, Customers, Suppliers, Dashboard |
| `DataEntryOperator` | Create/view on Income, Expense, Labour, Inventory |

### Permission Guard (Backend)

```csharp
[HasPermission(Permissions.Income.View)]
[HttpGet]
public async Task<IActionResult> GetAll() { ... }
```

### Permission Gate (Frontend)

```tsx
// Conditionally render UI
<PermissionGate permission={Perms.Income.Create}>
  <Button>Add Income</Button>
</PermissionGate>

// Guard entire route
<PermissionRoute permission={Perms.Users.View}>
  <UserListPage />
</PermissionRoute>
```

---

## 7. API Reference

### Base URL

| Environment | URL |
|-------------|-----|
| Development | `https://localhost:5001/api` |
| Production | `/api` |

### Response Format

**Success:**
```json
{
  "data": { ... },
  "succeeded": true,
  "message": "Operation successful"
}
```

**Error (RFC 7807 ProblemDetails):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation Error",
  "status": 400,
  "errors": { "field": ["error message"] }
}
```

### Auth Endpoints

```
POST   /api/auth/login              Body: { email, password }
POST   /api/auth/refresh            Body: { refreshToken }
POST   /api/auth/logout             Body: { refreshToken }
POST   /api/auth/forgot-password    Body: { email }
POST   /api/auth/reset-password     Body: { email, token, newPassword }
POST   /api/auth/change-password    Body: { currentPassword, newPassword }
GET    /api/auth/me                 Returns current user info
```

### Common CRUD Pattern (all modules)

```
GET    /api/{module}          List all (supports filtering, pagination)
GET    /api/{module}/{id}     Get single record
POST   /api/{module}          Create
PUT    /api/{module}/{id}     Update
DELETE /api/{module}/{id}     Delete
```

### Special Endpoints

```
GET    /api/labour/{id}/attendance              Labour attendance records
POST   /api/labour/{id}/attendance              Upsert attendance
GET    /api/labour/{id}/advances                Labour advance records
POST   /api/labour/{id}/advances                Add advance
POST   /api/employees/{id}/salary              Process salary
GET    /api/machinery/{id}/maintenance          Maintenance records
POST   /api/machinery/{id}/maintenance          Add maintenance record
GET    /api/vehicles/{id}/maintenance           Maintenance records
POST   /api/vehicles/{id}/maintenance           Add maintenance record
GET    /api/inventory/{id}/transactions         Stock transactions
POST   /api/inventory/{id}/transactions         Record stock movement
GET    /api/accounts/journal-entries            Journal entries list
POST   /api/accounts/journal-entries            Create journal entry
GET    /api/dashboard                           Aggregated stats
GET    /api/reports                             Financial reports
POST   /api/users/{id}/assign-role             Assign role to user
POST   /api/roles/{id}/permissions             Assign permissions to role
POST   /api/users/{id}/reset-password          Admin password reset
```

---

## 8. Permissions System

### All 43 Permissions

| Module | Permissions |
|--------|------------|
| Dashboard | Dashboard.View |
| Users | Users.View, Users.Create, Users.Update, Users.Delete |
| Roles | Roles.View, Roles.Create, Roles.Update, Roles.Delete |
| AuditLogs | AuditLogs.View |
| Profile | Profile.View, Profile.Update |
| Income | Income.View, Income.Create, Income.Update, Income.Delete, Income.Export |
| Expense | Expense.View, Expense.Create, Expense.Update, Expense.Delete, Expense.Export |
| Labour | Labour.View, Labour.Create, Labour.Update, Labour.Delete |
| Employees | Employees.View, Employees.Create, Employees.Update, Employees.Delete |
| Machinery | Machinery.View, Machinery.Create, Machinery.Update, Machinery.Delete |
| Vehicles | Vehicles.View, Vehicles.Create, Vehicles.Update, Vehicles.Delete |
| Plants | Plants.View, Plants.Create, Plants.Update, Plants.Delete |
| Customers | Customers.View, Customers.Create, Customers.Update, Customers.Delete |
| Suppliers | Suppliers.View, Suppliers.Create, Suppliers.Update, Suppliers.Delete |
| Inventory | Inventory.View, Inventory.Create, Inventory.Update, Inventory.Delete |
| Tax | Tax.View, Tax.Create, Tax.Update, Tax.Delete |
| Accounts | Accounts.View, Accounts.Create, Accounts.Update, Accounts.Delete |
| Reports | Reports.View, Reports.Export |
| Notifications | Notifications.View |
| Settings | Settings.View, Settings.Update |

---

## 9. Getting Started (Local Dev)

### Prerequisites

- .NET 8 SDK
- Node.js 20+
- PostgreSQL or Supabase project
- Visual Studio 2022 or VS Code

### Backend Setup

```bash
# 1. Navigate to backend
cd "E:\ConstructPro ERP\backend"

# 2. Restore NuGet packages
dotnet restore

# 3. Update appsettings.Development.json with your DB connection string
# ConnectionStrings.DefaultConnection = "Host=...;Database=...;Username=...;Password=..."

# 4. Apply migrations (runs automatically on startup, or manually):
dotnet ef database update --project src/BuildERP.Infrastructure --startup-project src/BuildERP.API

# 5. Run the API
dotnet run --project src/BuildERP.API
# API available at https://localhost:5001
# Swagger UI at https://localhost:5001/swagger
```

**Default Admin Credentials (seeded automatically):**
```
Email:    admin@builderp.local
Password: Admin@12345
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd "E:\ConstructPro ERP\frontend"

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
# App available at http://localhost:5173
```

### Environment Files

**`frontend/.env.development`**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**`frontend/.env.production`**
```
VITE_API_BASE_URL=/api
```

---

## 10. Deployment

### Option A — Azure (Recommended for Production)

| Component | Azure Service |
|-----------|--------------|
| Backend API | Azure App Service (Linux, .NET 8) |
| Frontend | Azure Static Web Apps |
| Database | Azure Database for PostgreSQL |

**Backend steps:**
1. Build: `dotnet publish -c Release -o ./publish`
2. Deploy `./publish` folder to App Service
3. Set environment variables in App Service Configuration:
   - `ConnectionStrings__DefaultConnection`
   - `JwtSettings__Secret`
   - `Cors__AllowedOrigins`

**Frontend steps:**
1. Build: `npm run build`
2. Deploy `dist/` folder to Azure Static Web Apps
3. Add `staticwebapp.config.json` for SPA routing (or use `vercel.json` equivalent)

### Option B — Docker

**Backend Dockerfile** (already exists at `backend/Dockerfile`):
```
Multi-stage build: SDK → Runtime
Exposes port 8080
```

```bash
# Build image
docker build -t builderp-api ./backend

# Run container
docker run -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="..." \
  -e JwtSettings__Secret="..." \
  builderp-api
```

### Option C — Vercel (Frontend) + Railway/Render (Backend)

- Frontend: Already has `vercel.json` configured for SPA routing — just `vercel deploy`
- Backend: Deploy via Docker on Railway or Render
- Database: Use Supabase (already configured)

**Frontend environment on Vercel:**
```
VITE_API_BASE_URL = https://your-backend-url.railway.app/api
```

### Option D — VPS (DigitalOcean / Contabo)

1. Install Nginx as reverse proxy
2. Run backend as systemd service or Docker container
3. Serve frontend build from Nginx static files
4. Configure SSL via Let's Encrypt (Certbot)

```nginx
# Nginx config example
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/builderp/frontend/dist;
        try_files $uri /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 11. Module Status

| Module | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| Authentication | Done | Done | Login, refresh, forgot/reset password |
| Dashboard | Done | Done | Stats aggregation |
| User Management | Done | Done | CRUD + role assignment |
| Role Management | Done | Done | CRUD + permission assignment |
| Profile | Done | Done | View + update |
| Audit Logs | Done | Done | Filterable log viewer |
| Income | Done | Done | CRUD + categories + summary |
| Expense | Done | Done | CRUD + categories + summary |
| Labour | Done | Done | CRUD + attendance + advances |
| Employees | Done | Done | CRUD + salary processing |
| Machinery | Done | Done | CRUD + maintenance records |
| Vehicles | Done | Done | CRUD + maintenance records |
| Plants | Done | Done | CRUD |
| Customers | Done | Done | CRUD |
| Suppliers | Done | Done | CRUD |
| Inventory | Done | Done | CRUD + stock transactions |
| Tax Records | Done | Done | CRUD |
| Chart of Accounts | Done | Done | GL account hierarchy |
| Journal Entries | Done | Done | Double-entry bookkeeping |
| Reports | Done | Placeholder | Backend ready, frontend placeholder UI |
| Notifications | Done | Done | System notifications |
| Settings | Done | Done | Company profile settings |

---

## Project File Map

```
E:\ConstructPro ERP\
├── DOCUMENTATION.md              ← This file
├── SRS.docx                      ← System Requirements Specification
├── create_tables.sql             ← PostgreSQL DDL (reference)
├── seed_data.sql                 ← Sample data SQL
│
├── backend/
│   ├── BuildERP.sln
│   ├── Dockerfile
│   └── src/
│       ├── BuildERP.Domain/
│       │   ├── Entities/         (28 entity classes)
│       │   ├── Enums/            (10 enums)
│       │   └── Constants/        (Roles, Permissions, Modules, Actions)
│       │
│       ├── BuildERP.Application/
│       │   ├── Common/           (Result<T>, PaginatedList<T>, Exceptions)
│       │   ├── Interfaces/       (25 service interfaces)
│       │   └── Features/         (21 feature folders: DTOs, Requests, Validators)
│       │
│       ├── BuildERP.Infrastructure/
│       │   ├── Persistence/
│       │   │   ├── ApplicationDbContext.cs
│       │   │   ├── Configurations/ (14 EF fluent configs)
│       │   │   ├── Migrations/     (3 migrations)
│       │   │   ├── Repositories/   (GenericRepository, UnitOfWork)
│       │   │   └── DbSeeder.cs
│       │   ├── Services/           (16 service implementations)
│       │   └── DependencyInjection.cs
│       │
│       └── BuildERP.API/
│           ├── Controllers/        (21 controllers)
│           ├── Authorization/      (HasPermission, Handler, Provider)
│           ├── Middleware/         (ExceptionHandling, RequestLogging)
│           ├── Program.cs
│           └── appsettings.json
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── vercel.json
    ├── .env.development
    ├── .env.production
    └── src/
        ├── app/               (store, hooks, snackbarSlice)
        ├── api/               (baseApi, axiosClient)
        ├── features/          (21 feature modules)
        ├── components/
        │   ├── layout/        (MainLayout, AuthLayout, Header, Sidebar, Footer)
        │   └── common/        (ProtectedRoute, PermissionRoute, Loader, etc.)
        ├── routes/            (AppRoutes.tsx — 50+ routes)
        ├── types/             (21 TypeScript interface files)
        ├── utils/             (constants, permissions, tokenStorage, axiosClient)
        ├── theme/             (MUI theme)
        ├── App.tsx
        └── main.tsx
```

---

*Documentation generated: 2026-07-26*
