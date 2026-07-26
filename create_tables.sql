-- ============================================================
-- ConstructPro ERP - Complete Database Schema
-- Run this FIRST in Supabase SQL Editor, then seed_data.sql
-- ============================================================

-- ============================================================
-- MIGRATION 1: Auth & Identity Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS "AspNetRoles" (
    "Id"               uuid         NOT NULL DEFAULT gen_random_uuid(),
    "Name"             varchar(256),
    "NormalizedName"   varchar(256),
    "ConcurrencyStamp" text,
    CONSTRAINT "PK_AspNetRoles" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "AspNetUsers" (
    "Id"                       uuid         NOT NULL DEFAULT gen_random_uuid(),
    "FullName"                 varchar(200) NOT NULL,
    "IsActive"                 boolean      NOT NULL DEFAULT true,
    "CreatedAt"                timestamptz  NOT NULL DEFAULT NOW(),
    "LastLoginAt"              timestamptz,
    "ProfilePicturePath"       varchar(500),
    "PasswordResetToken"       varchar(500),
    "PasswordResetTokenExpiry" timestamptz,
    "UserName"                 varchar(256),
    "NormalizedUserName"       varchar(256),
    "Email"                    varchar(256),
    "NormalizedEmail"          varchar(256),
    "EmailConfirmed"           boolean      NOT NULL DEFAULT false,
    "PasswordHash"             text,
    "SecurityStamp"            text,
    "ConcurrencyStamp"         text,
    "PhoneNumber"              text,
    "PhoneNumberConfirmed"     boolean      NOT NULL DEFAULT false,
    "TwoFactorEnabled"         boolean      NOT NULL DEFAULT false,
    "LockoutEnd"               timestamptz,
    "LockoutEnabled"           boolean      NOT NULL DEFAULT true,
    "AccessFailedCount"        integer      NOT NULL DEFAULT 0,
    CONSTRAINT "PK_AspNetUsers" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "AuditLogs" (
    "Id"          uuid         NOT NULL DEFAULT gen_random_uuid(),
    "UserId"      uuid,
    "UserEmail"   varchar(256) NOT NULL,
    "Action"      varchar(100) NOT NULL,
    "EntityType"  varchar(100) NOT NULL,
    "EntityId"    varchar(100),
    "OldValues"   text,
    "NewValues"   text,
    "IpAddress"   varchar(45),
    "Succeeded"   boolean      NOT NULL DEFAULT true,
    "ErrorMessage" text,
    "CreatedAt"   timestamptz  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "Permissions" (
    "Id"          uuid         NOT NULL DEFAULT gen_random_uuid(),
    "Module"      varchar(100) NOT NULL,
    "Action"      varchar(50)  NOT NULL,
    "Code"        varchar(150) NOT NULL,
    "Description" varchar(300) NOT NULL,
    CONSTRAINT "PK_Permissions" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "AspNetRoleClaims" (
    "Id"         serial NOT NULL,
    "RoleId"     uuid   NOT NULL,
    "ClaimType"  text,
    "ClaimValue" text,
    CONSTRAINT "PK_AspNetRoleClaims" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId"
        FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AspNetUserClaims" (
    "Id"         serial NOT NULL,
    "UserId"     uuid   NOT NULL,
    "ClaimType"  text,
    "ClaimValue" text,
    CONSTRAINT "PK_AspNetUserClaims" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AspNetUserClaims_AspNetUsers_UserId"
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AspNetUserLogins" (
    "LoginProvider"       text NOT NULL,
    "ProviderKey"         text NOT NULL,
    "ProviderDisplayName" text,
    "UserId"              uuid NOT NULL,
    CONSTRAINT "PK_AspNetUserLogins" PRIMARY KEY ("LoginProvider", "ProviderKey"),
    CONSTRAINT "FK_AspNetUserLogins_AspNetUsers_UserId"
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AspNetUserRoles" (
    "UserId" uuid NOT NULL,
    "RoleId" uuid NOT NULL,
    CONSTRAINT "PK_AspNetUserRoles" PRIMARY KEY ("UserId", "RoleId"),
    CONSTRAINT "FK_AspNetUserRoles_AspNetRoles_RoleId"
        FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AspNetUserRoles_AspNetUsers_UserId"
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AspNetUserTokens" (
    "UserId"        uuid NOT NULL,
    "LoginProvider" text NOT NULL,
    "Name"          text NOT NULL,
    "Value"         text,
    CONSTRAINT "PK_AspNetUserTokens" PRIMARY KEY ("UserId", "LoginProvider", "Name"),
    CONSTRAINT "FK_AspNetUserTokens_AspNetUsers_UserId"
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "RefreshTokens" (
    "Id"               uuid         NOT NULL DEFAULT gen_random_uuid(),
    "UserId"           uuid         NOT NULL,
    "Token"            varchar(500) NOT NULL,
    "ExpiresAt"        timestamptz  NOT NULL,
    "CreatedAt"        timestamptz  NOT NULL DEFAULT NOW(),
    "RevokedAt"        timestamptz,
    "ReplacedByToken"  text,
    CONSTRAINT "PK_RefreshTokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_RefreshTokens_AspNetUsers_UserId"
        FOREIGN KEY ("UserId") REFERENCES "AspNetUsers"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "RolePermissions" (
    "RoleId"       uuid NOT NULL,
    "PermissionId" uuid NOT NULL,
    CONSTRAINT "PK_RolePermissions" PRIMARY KEY ("RoleId", "PermissionId"),
    CONSTRAINT "FK_RolePermissions_AspNetRoles_RoleId"
        FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_RolePermissions_Permissions_PermissionId"
        FOREIGN KEY ("PermissionId") REFERENCES "Permissions"("Id") ON DELETE CASCADE
);

-- Indexes for Auth tables
CREATE UNIQUE INDEX IF NOT EXISTS "RoleNameIndex"       ON "AspNetRoles"("NormalizedName");
CREATE UNIQUE INDEX IF NOT EXISTS "UserNameIndex"       ON "AspNetUsers"("NormalizedUserName");
CREATE        INDEX IF NOT EXISTS "EmailIndex"          ON "AspNetUsers"("NormalizedEmail");
CREATE        INDEX IF NOT EXISTS "IX_AuditLogs_CreatedAt" ON "AuditLogs"("CreatedAt");
CREATE        INDEX IF NOT EXISTS "IX_AuditLogs_UserId"    ON "AuditLogs"("UserId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Permissions_Code"    ON "Permissions"("Code");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_RefreshTokens_Token" ON "RefreshTokens"("Token");
CREATE        INDEX IF NOT EXISTS "IX_RefreshTokens_UserId" ON "RefreshTokens"("UserId");
CREATE        INDEX IF NOT EXISTS "IX_AspNetRoleClaims_RoleId" ON "AspNetRoleClaims"("RoleId");
CREATE        INDEX IF NOT EXISTS "IX_AspNetUserClaims_UserId" ON "AspNetUserClaims"("UserId");
CREATE        INDEX IF NOT EXISTS "IX_AspNetUserLogins_UserId" ON "AspNetUserLogins"("UserId");
CREATE        INDEX IF NOT EXISTS "IX_AspNetUserRoles_RoleId"  ON "AspNetUserRoles"("RoleId");
CREATE        INDEX IF NOT EXISTS "IX_RolePermissions_PermissionId" ON "RolePermissions"("PermissionId");

-- EF Migrations history table
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId"    varchar(150) NOT NULL,
    "ProductVersion" varchar(32)  NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- ============================================================
-- MIGRATION 2: Business Modules
-- ============================================================

CREATE TABLE IF NOT EXISTS "Employees" (
    "Id"          uuid           NOT NULL DEFAULT gen_random_uuid(),
    "FullName"    varchar(200)   NOT NULL,
    "Designation" varchar(100),
    "Department"  varchar(100),
    "PhoneNumber" varchar(20),
    "CNIC"        varchar(20),
    "Address"     varchar(500),
    "BasicSalary" numeric(18,2)  NOT NULL DEFAULT 0,
    "JoinDate"    timestamptz    NOT NULL DEFAULT NOW(),
    "IsActive"    boolean        NOT NULL DEFAULT true,
    CONSTRAINT "PK_Employees" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "Incomes" (
    "Id"           uuid          NOT NULL DEFAULT gen_random_uuid(),
    "Category"     integer       NOT NULL DEFAULT 0,
    "Amount"       numeric(18,2) NOT NULL DEFAULT 0,
    "Date"         timestamptz   NOT NULL DEFAULT NOW(),
    "Description"  varchar(500)  NOT NULL,
    "CustomerName" varchar(200),
    "ProjectName"  varchar(200),
    "ReceiptPath"  varchar(500),
    "IsPaid"       boolean       NOT NULL DEFAULT false,
    "CreatedAt"    timestamptz   NOT NULL DEFAULT NOW(),
    "CreatedById"  varchar(450),
    CONSTRAINT "PK_Incomes" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "Expenses" (
    "Id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
    "Category"    integer       NOT NULL DEFAULT 0,
    "Amount"      numeric(18,2) NOT NULL DEFAULT 0,
    "Date"        timestamptz   NOT NULL DEFAULT NOW(),
    "Description" varchar(500)  NOT NULL,
    "Vendor"      varchar(200),
    "BillPath"    varchar(500),
    "CreatedAt"   timestamptz   NOT NULL DEFAULT NOW(),
    "CreatedById" varchar(450),
    CONSTRAINT "PK_Expenses" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "Labours" (
    "Id"                   uuid          NOT NULL DEFAULT gen_random_uuid(),
    "Name"                 varchar(200)  NOT NULL,
    "PhoneNumber"          varchar(20),
    "CNIC"                 varchar(20),
    "Address"              varchar(500),
    "Trade"                varchar(100),
    "DailyWage"            numeric(18,2) NOT NULL DEFAULT 0,
    "OvertimeRatePerHour"  numeric(18,2) NOT NULL DEFAULT 0,
    "JoinDate"             timestamptz   NOT NULL DEFAULT NOW(),
    "IsActive"             boolean       NOT NULL DEFAULT true,
    CONSTRAINT "PK_Labours" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "Machineries" (
    "Id"                  uuid          NOT NULL DEFAULT gen_random_uuid(),
    "Name"                varchar(200)  NOT NULL,
    "Model"               varchar(100),
    "SerialNumber"        varchar(100),
    "PurchaseDate"        timestamptz,
    "PurchasePrice"       numeric(18,2),
    "Status"              integer       NOT NULL DEFAULT 0,
    "TotalRunningHours"   numeric(10,2) NOT NULL DEFAULT 0,
    "NextMaintenanceDate" timestamptz,
    "Notes"               varchar(1000),
    "CreatedAt"           timestamptz   NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_Machineries" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "SalaryPayments" (
    "Id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
    "EmployeeId"  uuid          NOT NULL,
    "Month"       integer       NOT NULL,
    "Year"        integer       NOT NULL,
    "BasicSalary" numeric(18,2) NOT NULL DEFAULT 0,
    "Bonus"       numeric(18,2) NOT NULL DEFAULT 0,
    "Deductions"  numeric(18,2) NOT NULL DEFAULT 0,
    "NetSalary"   numeric(18,2) NOT NULL DEFAULT 0,
    "DaysPresent" integer       NOT NULL DEFAULT 0,
    "TotalDays"   integer       NOT NULL DEFAULT 26,
    "PaidAt"      timestamptz   NOT NULL DEFAULT NOW(),
    "Remarks"     varchar(500),
    "CreatedAt"   timestamptz   NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_SalaryPayments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SalaryPayments_Employees_EmployeeId"
        FOREIGN KEY ("EmployeeId") REFERENCES "Employees"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "LabourAdvances" (
    "Id"       uuid          NOT NULL DEFAULT gen_random_uuid(),
    "LabourId" uuid          NOT NULL,
    "Amount"   numeric(18,2) NOT NULL DEFAULT 0,
    "Date"     timestamptz   NOT NULL DEFAULT NOW(),
    "Reason"   varchar(500),
    CONSTRAINT "PK_LabourAdvances" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_LabourAdvances_Labours_LabourId"
        FOREIGN KEY ("LabourId") REFERENCES "Labours"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "LabourAttendances" (
    "Id"            uuid          NOT NULL DEFAULT gen_random_uuid(),
    "LabourId"      uuid          NOT NULL,
    "Date"          timestamptz   NOT NULL,
    "IsPresent"     boolean       NOT NULL DEFAULT true,
    "OvertimeHours" numeric(10,2) NOT NULL DEFAULT 0,
    "Notes"         varchar(500),
    CONSTRAINT "PK_LabourAttendances" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_LabourAttendances_Labours_LabourId"
        FOREIGN KEY ("LabourId") REFERENCES "Labours"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "MachineryMaintenances" (
    "Id"                    uuid          NOT NULL DEFAULT gen_random_uuid(),
    "MachineryId"           uuid          NOT NULL,
    "MaintenanceDate"       timestamptz   NOT NULL DEFAULT NOW(),
    "Type"                  integer       NOT NULL DEFAULT 0,
    "Description"           varchar(500)  NOT NULL,
    "Cost"                  numeric(18,2) NOT NULL DEFAULT 0,
    "RunningHoursAtService" numeric(10,2),
    "NextMaintenanceDate"   timestamptz,
    "ServiceProvider"       varchar(200),
    "CreatedAt"             timestamptz   NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_MachineryMaintenances" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_MachineryMaintenances_Machineries_MachineryId"
        FOREIGN KEY ("MachineryId") REFERENCES "Machineries"("Id") ON DELETE CASCADE
);

-- Indexes
CREATE        INDEX IF NOT EXISTS "IX_Incomes_Category"              ON "Incomes"("Category");
CREATE        INDEX IF NOT EXISTS "IX_Incomes_Date"                  ON "Incomes"("Date");
CREATE        INDEX IF NOT EXISTS "IX_Expenses_Category"             ON "Expenses"("Category");
CREATE        INDEX IF NOT EXISTS "IX_Expenses_Date"                 ON "Expenses"("Date");
CREATE        INDEX IF NOT EXISTS "IX_LabourAdvances_Date"           ON "LabourAdvances"("Date");
CREATE        INDEX IF NOT EXISTS "IX_LabourAdvances_LabourId"       ON "LabourAdvances"("LabourId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_LabourAttendances_LabourId_Date" ON "LabourAttendances"("LabourId","Date");
CREATE        INDEX IF NOT EXISTS "IX_SalaryPayments_EmployeeId"    ON "SalaryPayments"("EmployeeId");
CREATE        INDEX IF NOT EXISTS "IX_MachineryMaintenances_MachineryId" ON "MachineryMaintenances"("MachineryId");

-- ============================================================
-- MIGRATION 3: New Modules
-- ============================================================

CREATE TABLE IF NOT EXISTS "Vehicles" (
    "Id"                  uuid          NOT NULL DEFAULT gen_random_uuid(),
    "RegistrationNumber"  varchar(50)   NOT NULL,
    "Make"                varchar(100)  NOT NULL,
    "Model"               varchar(100),
    "Year"                integer,
    "DriverName"          varchar(200),
    "DriverContact"       varchar(50),
    "PurchasePrice"       numeric(18,2),
    "PurchaseDate"        timestamptz,
    "Status"              integer       NOT NULL DEFAULT 0,
    "TotalMileage"        numeric(18,2) NOT NULL DEFAULT 0,
    "NextMaintenanceDate" timestamptz,
    "Notes"               varchar(1000),
    "CreatedAt"           timestamptz   NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_Vehicles" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "VehicleMaintenances" (
    "Id"               uuid          NOT NULL DEFAULT gen_random_uuid(),
    "VehicleId"        uuid          NOT NULL,
    "MaintenanceDate"  timestamptz   NOT NULL DEFAULT NOW(),
    "Description"      varchar(500)  NOT NULL,
    "Cost"             numeric(18,2) NOT NULL DEFAULT 0,
    "ServiceProvider"  varchar(200),
    "NextDueDate"      timestamptz,
    "MileageAtService" numeric(18,2),
    "Notes"            varchar(500),
    "CreatedAt"        timestamptz   NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_VehicleMaintenances" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_VehicleMaintenances_Vehicles_VehicleId"
        FOREIGN KEY ("VehicleId") REFERENCES "Vehicles"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Plants" (
    "Id"                  uuid          NOT NULL DEFAULT gen_random_uuid(),
    "Name"                varchar(200)  NOT NULL,
    "Type"                varchar(100),
    "Manufacturer"        varchar(200),
    "SerialNumber"        varchar(100),
    "PurchaseDate"        timestamptz,
    "PurchasePrice"       numeric(18,2),
    "CurrentValue"        numeric(18,2),
    "Status"              integer       NOT NULL DEFAULT 0,
    "Location"            varchar(200),
    "LastMaintenanceDate" timestamptz,
    "NextMaintenanceDate" timestamptz,
    "Notes"               varchar(1000),
    "CreatedAt"           timestamptz   NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_Plants" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "Customers" (
    "Id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
    "Name"        varchar(200)  NOT NULL,
    "CompanyName" varchar(200),
    "Phone"       varchar(50),
    "Email"       varchar(200),
    "Address"     varchar(500),
    "NTN"         varchar(50),
    "CNIC"        varchar(20),
    "ProjectName" varchar(200),
    "TotalBilled" numeric(18,2) NOT NULL DEFAULT 0,
    "TotalPaid"   numeric(18,2) NOT NULL DEFAULT 0,
    "IsActive"    boolean       NOT NULL DEFAULT true,
    "Notes"       varchar(1000),
    "CreatedAt"   timestamptz   NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_Customers" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "Suppliers" (
    "Id"              uuid          NOT NULL DEFAULT gen_random_uuid(),
    "Name"            varchar(200)  NOT NULL,
    "CompanyName"     varchar(200),
    "Phone"           varchar(50),
    "Email"           varchar(200),
    "Address"         varchar(500),
    "NTN"             varchar(50),
    "Category"        varchar(100),
    "TotalPurchased"  numeric(18,2) NOT NULL DEFAULT 0,
    "TotalPaid"       numeric(18,2) NOT NULL DEFAULT 0,
    "IsActive"        boolean       NOT NULL DEFAULT true,
    "Notes"           varchar(1000),
    "CreatedAt"       timestamptz   NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_Suppliers" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "InventoryItems" (
    "Id"                uuid          NOT NULL DEFAULT gen_random_uuid(),
    "Name"              varchar(200)  NOT NULL,
    "Category"          varchar(100),
    "Unit"              varchar(50),
    "CurrentStock"      numeric(18,2) NOT NULL DEFAULT 0,
    "LowStockThreshold" numeric(18,2) NOT NULL DEFAULT 0,
    "UnitPrice"         numeric(18,2),
    "SupplierName"      varchar(200),
    "Location"          varchar(200),
    "Notes"             varchar(1000),
    "CreatedAt"         timestamptz   NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_InventoryItems" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "StockTransactions" (
    "Id"              uuid          NOT NULL DEFAULT gen_random_uuid(),
    "InventoryItemId" uuid          NOT NULL,
    "Type"            integer       NOT NULL DEFAULT 0,
    "Quantity"        numeric(18,2) NOT NULL DEFAULT 0,
    "UnitPrice"       numeric(18,2),
    "Date"            timestamptz   NOT NULL DEFAULT NOW(),
    "Reference"       varchar(100),
    "ProjectName"     varchar(200),
    "Notes"           varchar(500),
    "CreatedAt"       timestamptz   NOT NULL DEFAULT NOW(),
    "CreatedById"     varchar(450),
    CONSTRAINT "PK_StockTransactions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_StockTransactions_InventoryItems_InventoryItemId"
        FOREIGN KEY ("InventoryItemId") REFERENCES "InventoryItems"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "TaxRecords" (
    "Id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
    "TaxType"     integer       NOT NULL DEFAULT 0,
    "Amount"      numeric(18,2) NOT NULL DEFAULT 0,
    "PeriodStart" timestamptz   NOT NULL,
    "PeriodEnd"   timestamptz   NOT NULL,
    "DueDate"     timestamptz,
    "PaidDate"    timestamptz,
    "IsPaid"      boolean       NOT NULL DEFAULT false,
    "Reference"   varchar(100),
    "Description" varchar(500),
    "Notes"       varchar(1000),
    "CreatedAt"   timestamptz   NOT NULL DEFAULT NOW(),
    "CreatedById" varchar(450),
    CONSTRAINT "PK_TaxRecords" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "ChartOfAccounts" (
    "Id"          uuid         NOT NULL DEFAULT gen_random_uuid(),
    "Code"        varchar(20)  NOT NULL,
    "Name"        varchar(200) NOT NULL,
    "AccountType" integer      NOT NULL DEFAULT 0,
    "ParentId"    uuid,
    "IsActive"    boolean      NOT NULL DEFAULT true,
    "Description" varchar(500),
    "CreatedAt"   timestamptz  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_ChartOfAccounts" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ChartOfAccounts_ChartOfAccounts_ParentId"
        FOREIGN KEY ("ParentId") REFERENCES "ChartOfAccounts"("Id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "JournalEntries" (
    "Id"           uuid          NOT NULL DEFAULT gen_random_uuid(),
    "EntryNumber"  varchar(20)   NOT NULL,
    "Date"         timestamptz   NOT NULL DEFAULT NOW(),
    "Description"  varchar(500)  NOT NULL,
    "Reference"    varchar(100),
    "TotalDebit"   numeric(18,2) NOT NULL DEFAULT 0,
    "TotalCredit"  numeric(18,2) NOT NULL DEFAULT 0,
    "IsPosted"     boolean       NOT NULL DEFAULT false,
    "Notes"        varchar(1000),
    "CreatedAt"    timestamptz   NOT NULL DEFAULT NOW(),
    "CreatedById"  varchar(450),
    CONSTRAINT "PK_JournalEntries" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "JournalEntryLines" (
    "Id"             uuid          NOT NULL DEFAULT gen_random_uuid(),
    "JournalEntryId" uuid          NOT NULL,
    "AccountId"      uuid          NOT NULL,
    "Debit"          numeric(18,2) NOT NULL DEFAULT 0,
    "Credit"         numeric(18,2) NOT NULL DEFAULT 0,
    "Description"    varchar(200),
    CONSTRAINT "PK_JournalEntryLines" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_JournalEntryLines_JournalEntries_JournalEntryId"
        FOREIGN KEY ("JournalEntryId") REFERENCES "JournalEntries"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_JournalEntryLines_ChartOfAccounts_AccountId"
        FOREIGN KEY ("AccountId") REFERENCES "ChartOfAccounts"("Id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id"        uuid          NOT NULL DEFAULT gen_random_uuid(),
    "Type"      integer       NOT NULL DEFAULT 0,
    "Title"     varchar(200)  NOT NULL,
    "Message"   varchar(1000) NOT NULL,
    "IsRead"    boolean       NOT NULL DEFAULT false,
    "UserId"    varchar(450),
    "EntityId"  varchar(100),
    "CreatedAt" timestamptz   NOT NULL DEFAULT NOW(),
    "ReadAt"    timestamptz,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "CompanySettings" (
    "Id"                 uuid         NOT NULL DEFAULT gen_random_uuid(),
    "CompanyName"        varchar(200) NOT NULL,
    "Address"            varchar(500),
    "Phone"              varchar(50),
    "Email"              varchar(200),
    "Website"            varchar(200),
    "NTN"                varchar(50),
    "STRN"               varchar(50),
    "LogoPath"           varchar(500),
    "Currency"           varchar(10),
    "FinancialYearStart" varchar(20),
    "UpdatedAt"          timestamptz  NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_CompanySettings" PRIMARY KEY ("Id")
);

-- Indexes for new modules
CREATE INDEX IF NOT EXISTS "IX_VehicleMaintenances_VehicleId"    ON "VehicleMaintenances"("VehicleId");
CREATE INDEX IF NOT EXISTS "IX_StockTransactions_InventoryItemId" ON "StockTransactions"("InventoryItemId");
CREATE INDEX IF NOT EXISTS "IX_ChartOfAccounts_ParentId"         ON "ChartOfAccounts"("ParentId");
CREATE INDEX IF NOT EXISTS "IX_JournalEntryLines_JournalEntryId" ON "JournalEntryLines"("JournalEntryId");
CREATE INDEX IF NOT EXISTS "IX_JournalEntryLines_AccountId"      ON "JournalEntryLines"("AccountId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_IsRead"             ON "Notifications"("IsRead");
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId"             ON "Notifications"("UserId");
CREATE INDEX IF NOT EXISTS "IX_TaxRecords_TaxType"               ON "TaxRecords"("TaxType");
CREATE INDEX IF NOT EXISTS "IX_TaxRecords_IsPaid"                ON "TaxRecords"("IsPaid");

-- ============================================================
-- DONE! All tables created.
-- Now run seed_data.sql to insert 100 rows per table.
-- ============================================================
