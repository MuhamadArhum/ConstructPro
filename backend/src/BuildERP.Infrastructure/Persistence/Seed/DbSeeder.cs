using BuildERP.Domain.Constants;
using BuildERP.Domain.Entities;
using BuildERP.Domain.Enums;
using BuildERP.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BuildERP.Infrastructure.Persistence.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider sp)
    {
        var roleManager = sp.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
        var context = sp.GetRequiredService<ApplicationDbContext>();
        var config = sp.GetRequiredService<IConfiguration>();
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        // --- Roles ---
        foreach (var roleName in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
                logger.LogInformation("Seeded role {Role}", roleName);
            }
        }

        // --- Permissions ---
        var descriptions = new Dictionary<string, string>
        {
            ["Dashboard.View"]       = "View dashboard overview",
            ["Users.View"]           = "View user list and details",
            ["Users.Create"]         = "Create new users",
            ["Users.Edit"]           = "Edit existing users",
            ["Users.Delete"]         = "Deactivate users",
            ["Roles.View"]           = "View roles and permissions",
            ["Roles.Create"]         = "Create new roles",
            ["Roles.Edit"]           = "Edit role permissions",
            ["Roles.Delete"]         = "Delete custom roles",
            ["AuditLogs.View"]       = "View audit logs",
            ["Profile.View"]         = "View own profile",
            ["Profile.Edit"]         = "Edit own profile",
            ["Income.View"]          = "View income records",
            ["Income.Create"]        = "Create income records",
            ["Income.Edit"]          = "Edit income records",
            ["Income.Delete"]        = "Delete income records",
            ["Expense.View"]         = "View expense records",
            ["Expense.Create"]       = "Create expense records",
            ["Expense.Edit"]         = "Edit expense records",
            ["Expense.Delete"]       = "Delete expense records",
            ["Labour.View"]          = "View labour records",
            ["Labour.Create"]        = "Create labour records",
            ["Labour.Edit"]          = "Edit labour records",
            ["Labour.Delete"]        = "Delete labour records",
            ["Employees.View"]       = "View employee records",
            ["Employees.Create"]     = "Create employee records",
            ["Employees.Edit"]       = "Edit employee records",
            ["Employees.Delete"]     = "Delete employee records",
            ["Machinery.View"]       = "View machinery records",
            ["Machinery.Create"]     = "Create machinery records",
            ["Machinery.Edit"]       = "Edit machinery records",
            ["Machinery.Delete"]     = "Delete machinery records",
            ["Vehicles.View"]        = "View vehicle records",
            ["Vehicles.Create"]      = "Create vehicle records",
            ["Vehicles.Edit"]        = "Edit vehicle records",
            ["Vehicles.Delete"]      = "Delete vehicle records",
            ["Plants.View"]          = "View plant and equipment records",
            ["Plants.Create"]        = "Create plant and equipment records",
            ["Plants.Edit"]          = "Edit plant and equipment records",
            ["Plants.Delete"]        = "Delete plant and equipment records",
            ["Customers.View"]       = "View customer records",
            ["Customers.Create"]     = "Create customer records",
            ["Customers.Edit"]       = "Edit customer records",
            ["Customers.Delete"]     = "Delete customer records",
            ["Suppliers.View"]       = "View supplier records",
            ["Suppliers.Create"]     = "Create supplier records",
            ["Suppliers.Edit"]       = "Edit supplier records",
            ["Suppliers.Delete"]     = "Delete supplier records",
            ["Inventory.View"]       = "View inventory items",
            ["Inventory.Create"]     = "Create inventory items",
            ["Inventory.Edit"]       = "Edit inventory items",
            ["Inventory.Delete"]     = "Delete inventory items",
            ["Tax.View"]             = "View tax records",
            ["Tax.Create"]           = "Create tax records",
            ["Tax.Edit"]             = "Edit tax records",
            ["Tax.Delete"]           = "Delete tax records",
            ["Accounts.View"]        = "View chart of accounts and journal entries",
            ["Accounts.Create"]      = "Create accounts and journal entries",
            ["Accounts.Edit"]        = "Edit accounts",
            ["Accounts.Delete"]      = "Delete accounts and journal entries",
            ["Reports.View"]         = "View financial and operational reports",
            ["Notifications.View"]   = "View system notifications",
            ["Settings.View"]        = "View company settings",
            ["Settings.Edit"]        = "Edit company settings",
        };

        var permMap = new Dictionary<string, Permission>();
        foreach (var code in Permissions.All)
        {
            var parts = code.Split('.');
            var existing = await context.Permissions.FirstOrDefaultAsync(p => p.Code == code);
            if (existing is null)
            {
                existing = new Permission
                {
                    Module = parts[0],
                    Action = parts[1],
                    Code = code,
                    Description = descriptions.GetValueOrDefault(code, code),
                };
                context.Permissions.Add(existing);
                logger.LogInformation("Seeded permission {Code}", code);
            }
            permMap[code] = existing;
        }
        await context.SaveChangesAsync();

        // --- Role → Permission assignments ---
        var rolePermissions = new Dictionary<string, string[]>
        {
            [Roles.Admin] = Permissions.All,
            [Roles.Manager] = new[]
            {
                Permissions.DashboardView,
                Permissions.UsersView,
                Permissions.AuditLogsView,
                Permissions.ProfileView, Permissions.ProfileEdit,
                Permissions.IncomeView, Permissions.IncomeCreate, Permissions.IncomeEdit,
                Permissions.ExpenseView, Permissions.ExpenseCreate, Permissions.ExpenseEdit,
                Permissions.LabourView, Permissions.LabourCreate, Permissions.LabourEdit,
                Permissions.EmployeesView, Permissions.EmployeesCreate, Permissions.EmployeesEdit,
                Permissions.MachineryView, Permissions.MachineryCreate, Permissions.MachineryEdit,
                Permissions.VehiclesView, Permissions.VehiclesCreate, Permissions.VehiclesEdit,
                Permissions.PlantsView, Permissions.PlantsCreate, Permissions.PlantsEdit,
                Permissions.CustomersView, Permissions.CustomersCreate, Permissions.CustomersEdit,
                Permissions.SuppliersView, Permissions.SuppliersCreate, Permissions.SuppliersEdit,
                Permissions.InventoryView, Permissions.InventoryCreate, Permissions.InventoryEdit,
                Permissions.TaxView,
                Permissions.AccountsView,
                Permissions.ReportsView,
                Permissions.NotificationsView,
                Permissions.SettingsView,
            },
            [Roles.Accountant] = new[]
            {
                Permissions.DashboardView,
                Permissions.ProfileView, Permissions.ProfileEdit,
                Permissions.IncomeView, Permissions.IncomeCreate, Permissions.IncomeEdit,
                Permissions.ExpenseView, Permissions.ExpenseCreate, Permissions.ExpenseEdit,
                Permissions.TaxView, Permissions.TaxCreate, Permissions.TaxEdit,
                Permissions.AccountsView, Permissions.AccountsCreate, Permissions.AccountsEdit,
                Permissions.ReportsView,
                Permissions.NotificationsView,
                Permissions.SettingsView,
            },
            [Roles.DataEntryOperator] = new[]
            {
                Permissions.DashboardView,
                Permissions.ProfileView, Permissions.ProfileEdit,
                Permissions.IncomeView, Permissions.IncomeCreate,
                Permissions.ExpenseView, Permissions.ExpenseCreate,
                Permissions.LabourView, Permissions.LabourCreate,
                Permissions.InventoryView, Permissions.InventoryCreate,
                Permissions.CustomersView,
                Permissions.SuppliersView,
                Permissions.NotificationsView,
            },
        };

        foreach (var (roleName, permCodes) in rolePermissions)
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role is null) continue;

            foreach (var code in permCodes)
            {
                if (!permMap.TryGetValue(code, out var perm)) continue;
                var exists = await context.RolePermissions
                    .AnyAsync(rp => rp.RoleId == role.Id && rp.PermissionId == perm.Id);
                if (!exists)
                    context.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = perm.Id });
            }
        }
        await context.SaveChangesAsync();

        // --- Default Admin User ---
        var adminEmail = config["DefaultAdmin:Email"] ?? "admin@builderp.local";
        var adminPassword = config["DefaultAdmin:Password"] ?? "ChangeMe123!";

        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "System Administrator",
                EmailConfirmed = true,
                IsActive = true,
            };
            var result = await userManager.CreateAsync(adminUser, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, Roles.Admin);
                logger.LogWarning(
                    "Seeded default Admin user {Email}. Change this password after first login.",
                    adminEmail);
            }
            else
            {
                logger.LogError(
                    "Failed to seed admin: {Errors}",
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        await SeedSampleDataAsync(context, logger);
        await SeedDailyEntriesAsync(context, logger);
    }

    private static async Task SeedSampleDataAsync(ApplicationDbContext ctx, ILogger logger)
    {
        // EF Core DbContext is not thread-safe — check tables sequentially
        bool hasSettings  = await ctx.CompanySettings.AnyAsync();
        bool hasCustomers = await ctx.Customers.AnyAsync();
        bool hasSuppliers = await ctx.Suppliers.AnyAsync();
        bool hasEmployees = await ctx.Employees.AnyAsync();
        bool hasLabour    = await ctx.Labours.AnyAsync();
        bool hasIncome    = await ctx.Incomes.AnyAsync();
        bool hasExpenses  = await ctx.Expenses.AnyAsync();
        bool hasMachinery = await ctx.Machineries.AnyAsync();
        bool hasVehicles  = await ctx.Vehicles.AnyAsync();
        bool hasPlants    = await ctx.Plants.AnyAsync();
        bool hasInventory = await ctx.InventoryItems.AnyAsync();
        bool hasTax       = await ctx.TaxRecords.AnyAsync();
        bool hasAccounts  = await ctx.ChartOfAccounts.AnyAsync();
        bool hasNotifs    = await ctx.Notifications.AnyAsync();
        bool hasAuditLogs = await ctx.AuditLogs.AnyAsync();

        if (hasSettings && hasCustomers && hasSuppliers && hasEmployees && hasLabour &&
            hasIncome && hasExpenses && hasMachinery && hasVehicles && hasPlants &&
            hasInventory && hasTax && hasAccounts && hasNotifs && hasAuditLogs)
        {
            logger.LogInformation("Sample data already seeded — skipping");
            return;
        }

        // ── Company Settings ─────────────────────────────────────────────────
        if (!hasSettings)
        {
            ctx.CompanySettings.Add(new CompanySettings
            {
                CompanyName     = "Al-Rehman Construction Company",
                Address         = "Plot 47, Industrial Area, Lahore, Punjab",
                Phone           = "042-35761234",
                Email           = "info@alrehman-construction.pk",
                Website         = "www.alrehman-construction.pk",
                NTN             = "1234567-8",
                STRN            = "12-34-5678-001-23",
                Currency        = "PKR",
                FinancialYearStart = "July",
                UpdatedAt       = DateTime.UtcNow,
            });
        }

        // ── Customers ────────────────────────────────────────────────────────
        if (!hasCustomers)
        {
            ctx.Customers.AddRange(
                new Customer { Name = "Tariq Mahmood",     CompanyName = "Mahmood Developers",    Phone = "0300-1234567", Email = "tariq@mahmoodb.pk",   Address = "House 12, Gulberg III, Lahore",        NTN = "2345678-9", ProjectName = "DHA Phase 8 Villas",    TotalBilled = 4500000, TotalPaid = 3000000, IsActive = true, CreatedAt = DateTime.UtcNow },
                new Customer { Name = "Amjad Ali Khan",    CompanyName = "Khan Builders",          Phone = "0333-9876543", Email = "amjad@khanbuilders.pk", Address = "Office 3, Model Town, Lahore",         NTN = "3456789-0", ProjectName = "Raiwind Road Apartments", TotalBilled = 8200000, TotalPaid = 8200000, IsActive = true, CreatedAt = DateTime.UtcNow },
                new Customer { Name = "Saba Noor",         CompanyName = null,                     Phone = "0321-5556677", Email = "saba.noor@gmail.com",  Address = "Flat 5B, Johar Town, Lahore",          NTN = null,        ProjectName = "Home Extension",          TotalBilled = 950000,  TotalPaid = 475000,  IsActive = true, CreatedAt = DateTime.UtcNow },
                new Customer { Name = "Fahad Enterprises", CompanyName = "Fahad Enterprises Ltd",  Phone = "0311-7778899", Email = "info@fahad-ent.pk",    Address = "Plot 22, Faisal Town, Islamabad",      NTN = "4567890-1", ProjectName = "Commercial Plaza Block B", TotalBilled = 12500000, TotalPaid = 6000000, IsActive = true, CreatedAt = DateTime.UtcNow },
                new Customer { Name = "Hina Malik",        CompanyName = "Malik Real Estate",      Phone = "0345-2223344", Email = "hina@malikre.pk",      Address = "Bahria Town Sector C, Rawalpindi",    NTN = "5678901-2", ProjectName = "Bahria Townhouse",        TotalBilled = 3100000, TotalPaid = 3100000, IsActive = false, CreatedAt = DateTime.UtcNow }
            );
        }

        // ── Suppliers ────────────────────────────────────────────────────────
        if (!hasSuppliers)
        {
            ctx.Suppliers.AddRange(
                new Supplier { Name = "Usman Cement Store",    CompanyName = "Usman & Sons Traders",   Phone = "042-37891234", Email = "usman@cementstore.pk",   Address = "Badami Bagh, Lahore",              NTN = "6789012-3", Category = "Cement & Aggregates", TotalPurchased = 2800000, TotalPaid = 2800000, IsActive = true, CreatedAt = DateTime.UtcNow },
                new Supplier { Name = "Raza Steel Works",      CompanyName = "Raza Steel Industries",  Phone = "042-35431122", Email = "raza@steelworks.pk",     Address = "Kot Lakhpat Industrial, Lahore",   NTN = "7890123-4", Category = "Steel & Iron",         TotalPurchased = 5100000, TotalPaid = 4000000, IsActive = true, CreatedAt = DateTime.UtcNow },
                new Supplier { Name = "Bilal Timber Mart",     CompanyName = null,                     Phone = "0300-8765432", Email = null,                     Address = "Ring Road, Lahore",                NTN = null,        Category = "Wood & Timber",        TotalPurchased = 780000,  TotalPaid = 780000,  IsActive = true, CreatedAt = DateTime.UtcNow },
                new Supplier { Name = "Pak Electric Supply",   CompanyName = "Pak Electric Co.",       Phone = "0311-4445566", Email = "info@pakelectric.pk",    Address = "Hall Road, Lahore",                NTN = "8901234-5", Category = "Electrical Materials", TotalPurchased = 1200000, TotalPaid = 900000,  IsActive = true, CreatedAt = DateTime.UtcNow },
                new Supplier { Name = "Sunrise Plumbing Store",CompanyName = "Sunrise Traders",        Phone = "0333-1112233", Email = "sunrise@plumbing.pk",    Address = "Akbari Mandi, Lahore",             NTN = "9012345-6", Category = "Plumbing & Sanitary",  TotalPurchased = 640000,  TotalPaid = 640000,  IsActive = true, CreatedAt = DateTime.UtcNow }
            );
        }

        // ── Employees + SalaryPayments ────────────────────────────────────────
        if (!hasEmployees)
        {
            var employees = new List<Employee>
            {
                new Employee { FullName = "Imran Aslam",      Designation = "Site Engineer",    Department = "Engineering", PhoneNumber = "0300-2223344", CNIC = "35202-1234567-1", Address = "Iqbal Town, Lahore",         BasicSalary = 85000,  JoinDate = new DateTime(2022, 3, 1),  IsActive = true },
                new Employee { FullName = "Nasreen Bibi",      Designation = "Accountant",       Department = "Finance",     PhoneNumber = "0321-3334455", CNIC = "35201-2345678-2", Address = "Gulshan-e-Ravi, Lahore",     BasicSalary = 65000,  JoinDate = new DateTime(2023, 1, 15), IsActive = true },
                new Employee { FullName = "Zafar Iqbal",       Designation = "Store Keeper",     Department = "Operations",  PhoneNumber = "0333-4445566", CNIC = "35301-3456789-3", Address = "Shahdara, Lahore",           BasicSalary = 45000,  JoinDate = new DateTime(2021, 7, 1),  IsActive = true },
                new Employee { FullName = "Komal Shahzad",     Designation = "HR Officer",       Department = "HR",          PhoneNumber = "0345-5556677", CNIC = "35202-4567890-4", Address = "Model Town, Lahore",         BasicSalary = 55000,  JoinDate = new DateTime(2023, 6, 10), IsActive = true },
                new Employee { FullName = "Shahid Mehmood",    Designation = "Project Manager",  Department = "Management",  PhoneNumber = "0311-6667788", CNIC = "35401-5678901-5", Address = "Johar Town, Lahore",         BasicSalary = 110000, JoinDate = new DateTime(2020, 9, 1),  IsActive = true },
            };
            ctx.Employees.AddRange(employees);

            // ── Salary Payments — use in-memory list, no extra DB query needed ──
            var salaryPayments = new List<SalaryPayment>();
            foreach (var emp in employees)
            {
                salaryPayments.Add(new SalaryPayment
                {
                    EmployeeId  = emp.Id,
                    Month       = 5,
                    Year        = 2026,
                    BasicSalary = emp.BasicSalary,
                    Bonus       = emp.BasicSalary * 0.10m,
                    Deductions  = 2000,
                    NetSalary   = emp.BasicSalary + emp.BasicSalary * 0.10m - 2000,
                    DaysPresent = 26,
                    TotalDays   = 26,
                    PaidAt      = new DateTime(2026, 6, 1),
                    Remarks     = "May 2026 salary paid",
                    CreatedAt   = DateTime.UtcNow,
                });
                salaryPayments.Add(new SalaryPayment
                {
                    EmployeeId  = emp.Id,
                    Month       = 6,
                    Year        = 2026,
                    BasicSalary = emp.BasicSalary,
                    Bonus       = 0,
                    Deductions  = 1500,
                    NetSalary   = emp.BasicSalary - 1500,
                    DaysPresent = 25,
                    TotalDays   = 26,
                    PaidAt      = new DateTime(2026, 7, 1),
                    Remarks     = "June 2026 salary paid",
                    CreatedAt   = DateTime.UtcNow,
                });
            }
            ctx.SalaryPayments.AddRange(salaryPayments);
        }

        // ── Labour + Attendance + Advances ───────────────────────────────────
        if (!hasLabour)
        {
            var labours = new List<Labour>
            {
                new Labour { Name = "Muhammad Aslam",  PhoneNumber = "0300-1112233", CNIC = "35201-1111111-1", Address = "Shadbagh, Lahore",     Trade = "Mason",      DailyWage = 1800, OvertimeRatePerHour = 300, JoinDate = new DateTime(2024, 1, 10), IsActive = true },
                new Labour { Name = "Ghulam Rasool",   PhoneNumber = "0321-2223344", CNIC = "35202-2222222-2", Address = "Data Gunj Bakhsh Town", Trade = "Carpenter",  DailyWage = 2000, OvertimeRatePerHour = 350, JoinDate = new DateTime(2024, 2, 1),  IsActive = true },
                new Labour { Name = "Bashir Ahmad",    PhoneNumber = "0333-3334455", CNIC = "35301-3333333-3", Address = "Nishtar Colony, Lahore", Trade = "Electrician",DailyWage = 2200, OvertimeRatePerHour = 400, JoinDate = new DateTime(2023, 11, 5), IsActive = true },
                new Labour { Name = "Ali Hassan",      PhoneNumber = "0345-4445566", CNIC = "35401-4444444-4", Address = "Begum Pura, Lahore",    Trade = "Plumber",    DailyWage = 2000, OvertimeRatePerHour = 350, JoinDate = new DateTime(2024, 3, 15), IsActive = true },
                new Labour { Name = "Riaz Hussain",    PhoneNumber = "0311-5556677", CNIC = "35501-5555555-5", Address = "Ravi Road, Lahore",     Trade = "Helper",     DailyWage = 1200, OvertimeRatePerHour = 200, JoinDate = new DateTime(2024, 4, 1),  IsActive = false },
            };
            ctx.Labours.AddRange(labours);

            // ── Labour Attendance — use in-memory list ────────────────────────
            var attendances = new List<LabourAttendance>();
            var baseDate = new DateTime(2026, 7, 1);
            foreach (var l in labours)
            {
                for (int d = 0; d < 7; d++)
                {
                    attendances.Add(new LabourAttendance
                    {
                        LabourId      = l.Id,
                        Date          = baseDate.AddDays(d),
                        IsPresent     = d != 4,
                        OvertimeHours = d % 3 == 0 ? 2 : 0,
                        Notes         = d == 4 ? "Absent - personal reasons" : null,
                    });
                }
            }
            ctx.LabourAttendances.AddRange(attendances);

            // ── Labour Advances ───────────────────────────────────────────────
            var advances = new List<LabourAdvance>();
            foreach (var l in labours.Take(3))
            {
                advances.Add(new LabourAdvance
                {
                    LabourId = l.Id,
                    Amount   = 5000,
                    Date     = new DateTime(2026, 7, 5),
                    Reason   = "Medical emergency advance",
                });
            }
            ctx.LabourAdvances.AddRange(advances);
        }

        // ── Income ───────────────────────────────────────────────────────────
        if (!hasIncome)
        {
            ctx.Incomes.AddRange(
                new Income { Category = IncomeCategory.CustomerPayment, Amount = 1500000, Date = new DateTime(2026, 5, 10), Description = "Advance payment from Mahmood Developers",  CustomerName = "Tariq Mahmood",     ProjectName = "DHA Phase 8 Villas",    IsPaid = true, CreatedAt = DateTime.UtcNow },
                new Income { Category = IncomeCategory.ProjectIncome,   Amount = 3200000, Date = new DateTime(2026, 5, 25), Description = "Milestone 1 payment – structure complete", CustomerName = "Amjad Ali Khan",    ProjectName = "Raiwind Road Apartments",IsPaid = true, CreatedAt = DateTime.UtcNow },
                new Income { Category = IncomeCategory.CustomerPayment, Amount = 475000,  Date = new DateTime(2026, 6, 3),  Description = "First installment received",              CustomerName = "Saba Noor",         ProjectName = "Home Extension",         IsPaid = true, CreatedAt = DateTime.UtcNow },
                new Income { Category = IncomeCategory.ProjectIncome,   Amount = 6000000, Date = new DateTime(2026, 6, 15), Description = "Commercial plaza phase 1 cleared",        CustomerName = "Fahad Enterprises", ProjectName = "Commercial Plaza Block B",IsPaid = true, CreatedAt = DateTime.UtcNow },
                new Income { Category = IncomeCategory.OtherIncome,     Amount = 125000,  Date = new DateTime(2026, 7, 1),  Description = "Equipment rental income – JCB hired out", CustomerName = null,                ProjectName = null,                     IsPaid = true, CreatedAt = DateTime.UtcNow },
                new Income { Category = IncomeCategory.CustomerPayment, Amount = 3100000, Date = new DateTime(2026, 7, 10), Description = "Final payment – project handover",         CustomerName = "Hina Malik",        ProjectName = "Bahria Townhouse",       IsPaid = true, CreatedAt = DateTime.UtcNow }
            );
        }

        // ── Expenses ─────────────────────────────────────────────────────────
        if (!hasExpenses)
        {
            ctx.Expenses.AddRange(
                new Expense { Category = ExpenseCategory.LabourExpenses,          Amount = 216000,  Date = new DateTime(2026, 5, 31), Description = "Daily wages – May 2026 (12 workers × 26 days)",   Vendor = null,                    CreatedAt = DateTime.UtcNow },
                new Expense { Category = ExpenseCategory.Salaries,                Amount = 360000,  Date = new DateTime(2026, 6, 1),  Description = "Staff salaries – May 2026",                       Vendor = null,                    CreatedAt = DateTime.UtcNow },
                new Expense { Category = ExpenseCategory.SuppliesMaterialPurchase,Amount = 850000,  Date = new DateTime(2026, 5, 15), Description = "Cement purchase – 500 bags (DHA project)",         Vendor = "Usman Cement Store",    CreatedAt = DateTime.UtcNow },
                new Expense { Category = ExpenseCategory.SuppliesMaterialPurchase,Amount = 1200000, Date = new DateTime(2026, 5, 20), Description = "Steel bars – 10 tonnes (Raiwind Apartments)",      Vendor = "Raza Steel Works",      CreatedAt = DateTime.UtcNow },
                new Expense { Category = ExpenseCategory.MachineryMaintenance,    Amount = 45000,   Date = new DateTime(2026, 6, 10), Description = "Concrete mixer service & repair",                  Vendor = "Ashraf Engineering",    CreatedAt = DateTime.UtcNow },
                new Expense { Category = ExpenseCategory.VehicleExpenses,         Amount = 22000,   Date = new DateTime(2026, 6, 12), Description = "Truck tyre replacement – LHR-1234",                Vendor = "Riaz Tyres",            CreatedAt = DateTime.UtcNow },
                new Expense { Category = ExpenseCategory.Fuel,                    Amount = 38500,   Date = new DateTime(2026, 6, 25), Description = "Diesel – generator + vehicles June 2026",          Vendor = "PSO Petrol Station",    CreatedAt = DateTime.UtcNow },
                new Expense { Category = ExpenseCategory.ElectricalExpenses,      Amount = 95000,   Date = new DateTime(2026, 7, 5),  Description = "Electrical wiring materials – Plaza project",      Vendor = "Pak Electric Supply",   CreatedAt = DateTime.UtcNow },
                new Expense { Category = ExpenseCategory.OfficeExpenses,          Amount = 18000,   Date = new DateTime(2026, 7, 10), Description = "Office stationery and utility bills",              Vendor = null,                    CreatedAt = DateTime.UtcNow },
                new Expense { Category = ExpenseCategory.Miscellaneous,           Amount = 12000,   Date = new DateTime(2026, 7, 15), Description = "Site security charges – July",                     Vendor = "Safe Guard Services",   CreatedAt = DateTime.UtcNow }
            );
        }

        // ── Machinery + Maintenance ───────────────────────────────────────────
        if (!hasMachinery)
        {
            var machineries = new List<Machinery>
            {
                new Machinery { Name = "Concrete Mixer 500L",  Model = "CM-500",    SerialNumber = "SN-CM-001", PurchaseDate = new DateTime(2021, 4, 15), PurchasePrice = 450000, Status = MachineryStatus.Active,            TotalRunningHours = 3200, NextMaintenanceDate = new DateTime(2026, 9, 1),  Notes = "Primary mixer for DHA project", CreatedAt = DateTime.UtcNow },
                new Machinery { Name = "Tower Crane 5T",       Model = "TC-5000",   SerialNumber = "SN-TC-001", PurchaseDate = new DateTime(2020, 8, 1),  PurchasePrice = 3500000,Status = MachineryStatus.Active,            TotalRunningHours = 8500, NextMaintenanceDate = new DateTime(2026, 8, 15), Notes = "Deployed at Raiwind site",       CreatedAt = DateTime.UtcNow },
                new Machinery { Name = "Excavator JCB 3CX",    Model = "3CX",       SerialNumber = "SN-JCB-001",PurchaseDate = new DateTime(2019, 3, 10), PurchasePrice = 5200000,Status = MachineryStatus.UnderMaintenance,  TotalRunningHours = 12000,NextMaintenanceDate = new DateTime(2026, 7, 30), Notes = "Hydraulic arm repair in progress",CreatedAt = DateTime.UtcNow },
                new Machinery { Name = "Concrete Vibrator",    Model = "CV-100",    SerialNumber = "SN-CV-001", PurchaseDate = new DateTime(2022, 6, 20), PurchasePrice = 85000,  Status = MachineryStatus.Active,            TotalRunningHours = 1800, NextMaintenanceDate = new DateTime(2026, 10, 1), Notes = null,                             CreatedAt = DateTime.UtcNow },
                new Machinery { Name = "Generator 25 KVA",     Model = "GEN-25",    SerialNumber = "SN-GEN-001",PurchaseDate = new DateTime(2020, 12, 5), PurchasePrice = 320000, Status = MachineryStatus.Active,            TotalRunningHours = 6800, NextMaintenanceDate = new DateTime(2026, 8, 1),  Notes = "Backup power at office site",    CreatedAt = DateTime.UtcNow },
            };
            ctx.Machineries.AddRange(machineries);

            // ── Machinery Maintenance — use in-memory list ────────────────────
            ctx.MachineryMaintenances.AddRange(
                new MachineryMaintenance { MachineryId = machineries[0].Id, MaintenanceDate = new DateTime(2026, 3, 10), Type = MaintenanceType.Scheduled, Description = "Oil change and belt replacement", Cost = 8500,  RunningHoursAtService = 3100, NextMaintenanceDate = new DateTime(2026, 9, 1),  ServiceProvider = "Ashraf Engineering", CreatedAt = DateTime.UtcNow },
                new MachineryMaintenance { MachineryId = machineries[2].Id, MaintenanceDate = new DateTime(2026, 7, 20), Type = MaintenanceType.Repair,    Description = "Hydraulic arm cylinder seal replacement", Cost = 65000, RunningHoursAtService = 11950, NextMaintenanceDate = new DateTime(2026, 10, 1), ServiceProvider = "JCB Service Center Lahore", CreatedAt = DateTime.UtcNow },
                new MachineryMaintenance { MachineryId = machineries[4].Id, MaintenanceDate = new DateTime(2026, 2, 5),  Type = MaintenanceType.Scheduled, Description = "Full generator service – filters & spark plugs", Cost = 12000, RunningHoursAtService = 6600, NextMaintenanceDate = new DateTime(2026, 8, 1), ServiceProvider = "Pak Power Services", CreatedAt = DateTime.UtcNow }
            );
        }

        // ── Vehicles + Maintenance ────────────────────────────────────────────
        if (!hasVehicles)
        {
            var vehicles = new List<Vehicle>
            {
                new Vehicle { RegistrationNumber = "LHR-1234", Make = "Isuzu",   Model = "NPR",         Year = 2019, DriverName = "Saeed Anwar",   DriverContact = "0300-9876543", PurchasePrice = 2800000, PurchaseDate = new DateTime(2019, 6, 1),  Status = VehicleStatus.Active,           TotalMileage = 85000, NextMaintenanceDate = new DateTime(2026, 9, 1),  Notes = "Material transport truck",    CreatedAt = DateTime.UtcNow },
                new Vehicle { RegistrationNumber = "LHR-5678", Make = "Toyota",  Model = "Hilux Revo",  Year = 2021, DriverName = "Aamir Cheema",  DriverContact = "0321-8765432", PurchasePrice = 5500000, PurchaseDate = new DateTime(2021, 3, 15), Status = VehicleStatus.Active,           TotalMileage = 42000, NextMaintenanceDate = new DateTime(2026, 8, 15), Notes = "Management vehicle",           CreatedAt = DateTime.UtcNow },
                new Vehicle { RegistrationNumber = "LHR-9012", Make = "Shehzore",Model = "Pickup",      Year = 2018, DriverName = "Bashir Khadim", DriverContact = "0333-7654321", PurchasePrice = 1200000, PurchaseDate = new DateTime(2018, 1, 20), Status = VehicleStatus.UnderMaintenance, TotalMileage = 120000,NextMaintenanceDate = new DateTime(2026, 7, 31), Notes = "Engine overhaul in progress", CreatedAt = DateTime.UtcNow },
                new Vehicle { RegistrationNumber = "LHR-3456", Make = "Hino",    Model = "300 Series",  Year = 2022, DriverName = "Zahid Mehmood", DriverContact = "0345-6543210", PurchasePrice = 4200000, PurchaseDate = new DateTime(2022, 9, 10), Status = VehicleStatus.Active,           TotalMileage = 28000, NextMaintenanceDate = new DateTime(2026, 10, 1), Notes = "Concrete transport",           CreatedAt = DateTime.UtcNow },
            };
            ctx.Vehicles.AddRange(vehicles);

            // ── Vehicle Maintenance — use in-memory list ──────────────────────
            ctx.VehicleMaintenances.AddRange(
                new VehicleMaintenance { VehicleId = vehicles[0].Id, MaintenanceDate = new DateTime(2026, 6, 12), Description = "Front tyre replacement (2 tyres)", Cost = 22000, ServiceProvider = "Riaz Tyres",        NextDueDate = new DateTime(2027, 6, 1),  MileageAtService = 84800, CreatedAt = DateTime.UtcNow },
                new VehicleMaintenance { VehicleId = vehicles[1].Id, MaintenanceDate = new DateTime(2026, 4, 20), Description = "Oil change + filter service",     Cost = 7500,  ServiceProvider = "Toyota Workshop",   NextDueDate = new DateTime(2026, 10, 20),MileageAtService = 40000, CreatedAt = DateTime.UtcNow },
                new VehicleMaintenance { VehicleId = vehicles[2].Id, MaintenanceDate = new DateTime(2026, 7, 15), Description = "Engine overhaul – complete",      Cost = 85000, ServiceProvider = "Pak Auto Workshop", NextDueDate = new DateTime(2027, 7, 1),  MileageAtService = 119500,CreatedAt = DateTime.UtcNow }
            );
        }

        // ── Plants ───────────────────────────────────────────────────────────
        if (!hasPlants)
        {
            ctx.Plants.AddRange(
                new Plant { Name = "Mobile Batching Plant",  Type = "Concrete Plant",   Manufacturer = "Ajax Fiori",  SerialNumber = "AF-BP-001", PurchaseDate = new DateTime(2020, 1, 15), PurchasePrice = 12000000, CurrentValue = 9000000, Status = PlantStatus.Active,           Location = "DHA Phase 8 Site",         LastMaintenanceDate = new DateTime(2026, 3, 1),  NextMaintenanceDate = new DateTime(2026, 9, 1),  CreatedAt = DateTime.UtcNow },
                new Plant { Name = "Bar Bending Machine",    Type = "Steel Equipment",  Manufacturer = "Sona Heavy",  SerialNumber = "SH-BB-002", PurchaseDate = new DateTime(2021, 5, 10), PurchasePrice = 350000,   CurrentValue = 280000,  Status = PlantStatus.Active,           Location = "Workshop – Kot Lakhpat",   LastMaintenanceDate = new DateTime(2026, 1, 15), NextMaintenanceDate = new DateTime(2026, 7, 31), CreatedAt = DateTime.UtcNow },
                new Plant { Name = "Scaffolding Set (500m)", Type = "Scaffolding",      Manufacturer = "AMCO",        SerialNumber = "AC-SC-003", PurchaseDate = new DateTime(2019, 8, 20), PurchasePrice = 800000,   CurrentValue = 500000,  Status = PlantStatus.Active,           Location = "Raiwind Apartments Site",  LastMaintenanceDate = null,              NextMaintenanceDate = new DateTime(2026, 12, 1), CreatedAt = DateTime.UtcNow },
                new Plant { Name = "Formwork (Steel)",       Type = "Shuttering",       Manufacturer = "Local",       SerialNumber = "LCL-FW-004",PurchaseDate = new DateTime(2022, 3, 5),  PurchasePrice = 1500000,  CurrentValue = 1200000, Status = PlantStatus.UnderMaintenance, Location = "Warehouse – Shahdara",     LastMaintenanceDate = new DateTime(2026, 6, 20), NextMaintenanceDate = new DateTime(2026, 8, 1),  CreatedAt = DateTime.UtcNow }
            );
        }

        // ── Inventory + StockTransactions ─────────────────────────────────────
        if (!hasInventory)
        {
            var items = new List<InventoryItem>
            {
                new InventoryItem { Name = "OPC Cement 50kg Bag", Category = "Cement",      Unit = "Bags",  CurrentStock = 320,  LowStockThreshold = 50,  UnitPrice = 1150,  SupplierName = "Usman Cement Store",     Location = "Warehouse A",  CreatedAt = DateTime.UtcNow },
                new InventoryItem { Name = "Steel Bar 12mm",      Category = "Steel",       Unit = "Kg",    CurrentStock = 5800, LowStockThreshold = 500, UnitPrice = 260,   SupplierName = "Raza Steel Works",       Location = "Yard",         CreatedAt = DateTime.UtcNow },
                new InventoryItem { Name = "Steel Bar 8mm",       Category = "Steel",       Unit = "Kg",    CurrentStock = 2100, LowStockThreshold = 300, UnitPrice = 255,   SupplierName = "Raza Steel Works",       Location = "Yard",         CreatedAt = DateTime.UtcNow },
                new InventoryItem { Name = "River Sand",          Category = "Aggregate",   Unit = "CFT",   CurrentStock = 1200, LowStockThreshold = 200, UnitPrice = 45,    SupplierName = "Usman Cement Store",     Location = "Yard",         CreatedAt = DateTime.UtcNow },
                new InventoryItem { Name = "Gravel 3/4\"",        Category = "Aggregate",   Unit = "CFT",   CurrentStock = 900,  LowStockThreshold = 150, UnitPrice = 55,    SupplierName = "Usman Cement Store",     Location = "Yard",         CreatedAt = DateTime.UtcNow },
                new InventoryItem { Name = "Brick (First Class)", Category = "Masonry",     Unit = "Pcs",   CurrentStock = 25000,LowStockThreshold = 2000,UnitPrice = 18,    SupplierName = "Zubair Brick Kiln",      Location = "Yard",         CreatedAt = DateTime.UtcNow },
                new InventoryItem { Name = "Paint (Exterior)",    Category = "Finishing",   Unit = "Litre", CurrentStock = 180,  LowStockThreshold = 30,  UnitPrice = 420,   SupplierName = "Berger Paints Dealer",   Location = "Warehouse A",  CreatedAt = DateTime.UtcNow },
                new InventoryItem { Name = "PVC Pipe 4\"",        Category = "Plumbing",    Unit = "Pcs",   CurrentStock = 85,   LowStockThreshold = 20,  UnitPrice = 680,   SupplierName = "Sunrise Plumbing Store", Location = "Warehouse B",  CreatedAt = DateTime.UtcNow },
                new InventoryItem { Name = "Electric Cable 2.5mm",Category = "Electrical",  Unit = "Meter", CurrentStock = 1500, LowStockThreshold = 100, UnitPrice = 95,    SupplierName = "Pak Electric Supply",    Location = "Warehouse B",  CreatedAt = DateTime.UtcNow },
                new InventoryItem { Name = "Plywood 3/4\" 8x4",   Category = "Wood",        Unit = "Sheet", CurrentStock = 45,   LowStockThreshold = 10,  UnitPrice = 3800,  SupplierName = "Bilal Timber Mart",      Location = "Warehouse A",  CreatedAt = DateTime.UtcNow },
            };
            ctx.InventoryItems.AddRange(items);

            // ── Stock Transactions — use in-memory list ───────────────────────
            ctx.StockTransactions.AddRange(
                new StockTransaction { InventoryItemId = items[0].Id, Type = StockTransactionType.StockIn,     Quantity = 500,  UnitPrice = 1150, Date = new DateTime(2026, 5, 10), Reference = "PO-2026-001", ProjectName = null,                     Notes = "Initial stock purchase", CreatedAt = DateTime.UtcNow },
                new StockTransaction { InventoryItemId = items[0].Id, Type = StockTransactionType.MaterialIssue,Quantity = 180,  UnitPrice = 1150, Date = new DateTime(2026, 5, 25), Reference = "SI-2026-001", ProjectName = "DHA Phase 8 Villas",     Notes = "Issued for foundation work", CreatedAt = DateTime.UtcNow },
                new StockTransaction { InventoryItemId = items[1].Id, Type = StockTransactionType.StockIn,     Quantity = 8000, UnitPrice = 260,  Date = new DateTime(2026, 5, 12), Reference = "PO-2026-002", ProjectName = null,                     Notes = "Steel delivery batch 1", CreatedAt = DateTime.UtcNow },
                new StockTransaction { InventoryItemId = items[1].Id, Type = StockTransactionType.MaterialIssue,Quantity = 2200, UnitPrice = 260,  Date = new DateTime(2026, 6, 5),  Reference = "SI-2026-002", ProjectName = "Raiwind Road Apartments", Notes = "Slab reinforcement steel", CreatedAt = DateTime.UtcNow },
                new StockTransaction { InventoryItemId = items[5].Id, Type = StockTransactionType.StockIn,     Quantity = 30000,UnitPrice = 18,   Date = new DateTime(2026, 4, 20), Reference = "PO-2026-003", ProjectName = null,                     Notes = "Bulk brick purchase", CreatedAt = DateTime.UtcNow },
                new StockTransaction { InventoryItemId = items[5].Id, Type = StockTransactionType.MaterialIssue,Quantity = 5000, UnitPrice = 18,   Date = new DateTime(2026, 5, 1),  Reference = "SI-2026-003", ProjectName = "Bahria Townhouse",        Notes = "Wall construction – ground floor", CreatedAt = DateTime.UtcNow },
                new StockTransaction { InventoryItemId = items[9].Id, Type = StockTransactionType.StockIn,     Quantity = 60,   UnitPrice = 3800, Date = new DateTime(2026, 6, 1),  Reference = "PO-2026-004", ProjectName = null,                     Notes = "Formwork shuttering", CreatedAt = DateTime.UtcNow },
                new StockTransaction { InventoryItemId = items[6].Id, Type = StockTransactionType.Adjustment,  Quantity = -5,   UnitPrice = 420,  Date = new DateTime(2026, 7, 8),  Reference = "ADJ-2026-001",ProjectName = null,                     Notes = "Damaged tins written off", CreatedAt = DateTime.UtcNow }
            );
        }

        // ── Tax Records ──────────────────────────────────────────────────────
        if (!hasTax)
        {
            ctx.TaxRecords.AddRange(
                new TaxRecord { TaxType = TaxType.SalesTax,       Amount = 285000, PeriodStart = new DateTime(2026, 4, 1), PeriodEnd = new DateTime(2026, 4, 30), DueDate = new DateTime(2026, 5, 15), PaidDate = new DateTime(2026, 5, 12), IsPaid = true,  Reference = "FBR-ST-APR26", Description = "Sales tax – April 2026",           CreatedAt = DateTime.UtcNow },
                new TaxRecord { TaxType = TaxType.SalesTax,       Amount = 312000, PeriodStart = new DateTime(2026, 5, 1), PeriodEnd = new DateTime(2026, 5, 31), DueDate = new DateTime(2026, 6, 15), PaidDate = new DateTime(2026, 6, 14), IsPaid = true,  Reference = "FBR-ST-MAY26", Description = "Sales tax – May 2026",             CreatedAt = DateTime.UtcNow },
                new TaxRecord { TaxType = TaxType.SalesTax,       Amount = 295000, PeriodStart = new DateTime(2026, 6, 1), PeriodEnd = new DateTime(2026, 6, 30), DueDate = new DateTime(2026, 7, 15), PaidDate = null,                      IsPaid = false, Reference = "FBR-ST-JUN26", Description = "Sales tax – June 2026 (pending)", CreatedAt = DateTime.UtcNow },
                new TaxRecord { TaxType = TaxType.IncomeTax,      Amount = 180000, PeriodStart = new DateTime(2026, 4, 1), PeriodEnd = new DateTime(2026, 6, 30), DueDate = new DateTime(2026, 7, 31), PaidDate = null,                      IsPaid = false, Reference = "FBR-IT-Q1-2627",Description = "Income tax Q1 FY2026-27",          CreatedAt = DateTime.UtcNow },
                new TaxRecord { TaxType = TaxType.WithholdingTax, Amount = 42000,  PeriodStart = new DateTime(2026, 5, 1), PeriodEnd = new DateTime(2026, 5, 31), DueDate = new DateTime(2026, 6, 15), PaidDate = new DateTime(2026, 6, 10), IsPaid = true,  Reference = "WHT-MAY26",    Description = "Withholding tax on supplier payments", CreatedAt = DateTime.UtcNow }
            );
        }

        // ── Chart of Accounts + Journal Entries ──────────────────────────────
        if (!hasAccounts)
        {
            var accounts = new List<ChartOfAccount>
            {
                // Assets
                new ChartOfAccount { Code = "1000", Name = "Current Assets",            AccountType = AccountType.Asset,     ParentId = null,  IsActive = true, Description = "All current assets",          CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "1100", Name = "Cash in Hand",               AccountType = AccountType.Asset,     ParentId = null,  IsActive = true, Description = "Office petty cash",            CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "1200", Name = "Bank Account – HBL",         AccountType = AccountType.Asset,     ParentId = null,  IsActive = true, Description = "HBL current account",          CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "1300", Name = "Accounts Receivable",        AccountType = AccountType.Asset,     ParentId = null,  IsActive = true, Description = "Customer outstanding balances", CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "1400", Name = "Inventory Asset",            AccountType = AccountType.Asset,     ParentId = null,  IsActive = true, Description = "Construction materials stock",  CreatedAt = DateTime.UtcNow },
                // Liabilities
                new ChartOfAccount { Code = "2000", Name = "Current Liabilities",        AccountType = AccountType.Liability, ParentId = null,  IsActive = true, Description = "Short-term obligations",        CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "2100", Name = "Accounts Payable",           AccountType = AccountType.Liability, ParentId = null,  IsActive = true, Description = "Supplier outstanding balances", CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "2200", Name = "Tax Payable",                AccountType = AccountType.Liability, ParentId = null,  IsActive = true, Description = "FBR taxes due",                CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "2300", Name = "Salary Payable",             AccountType = AccountType.Liability, ParentId = null,  IsActive = true, Description = "Staff salaries due",            CreatedAt = DateTime.UtcNow },
                // Equity
                new ChartOfAccount { Code = "3000", Name = "Owner's Equity",             AccountType = AccountType.Equity,    ParentId = null,  IsActive = true, Description = "Proprietor's capital",          CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "3100", Name = "Retained Earnings",           AccountType = AccountType.Equity,    ParentId = null,  IsActive = true, Description = "Accumulated profits",           CreatedAt = DateTime.UtcNow },
                // Revenue
                new ChartOfAccount { Code = "4000", Name = "Contract Revenue",           AccountType = AccountType.Revenue,   ParentId = null,  IsActive = true, Description = "Project billing income",        CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "4100", Name = "Other Income",               AccountType = AccountType.Revenue,   ParentId = null,  IsActive = true, Description = "Equipment hire / misc income",  CreatedAt = DateTime.UtcNow },
                // Expenses
                new ChartOfAccount { Code = "5000", Name = "Direct Costs",               AccountType = AccountType.Expense,   ParentId = null,  IsActive = true, Description = "Material & labour costs",       CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "5100", Name = "Labour & Wages",             AccountType = AccountType.Expense,   ParentId = null,  IsActive = true, Description = "Daily wages expense",           CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "5200", Name = "Material Purchases",         AccountType = AccountType.Expense,   ParentId = null,  IsActive = true, Description = "Raw material cost",             CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "5300", Name = "Machinery & Vehicle Expense",AccountType = AccountType.Expense,   ParentId = null,  IsActive = true, Description = "Running & maintenance costs",   CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "5400", Name = "Salaries Expense",           AccountType = AccountType.Expense,   ParentId = null,  IsActive = true, Description = "Staff monthly salaries",        CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "5500", Name = "Tax Expense",                AccountType = AccountType.Expense,   ParentId = null,  IsActive = true, Description = "FBR taxes paid",               CreatedAt = DateTime.UtcNow },
                new ChartOfAccount { Code = "5600", Name = "General & Admin Expense",    AccountType = AccountType.Expense,   ParentId = null,  IsActive = true, Description = "Office & administrative costs", CreatedAt = DateTime.UtcNow },
            };
            ctx.ChartOfAccounts.AddRange(accounts);

            // ── Journal Entries — use in-memory dict ──────────────────────────
            var coa = accounts.ToDictionary(a => a.Code);

            var je1 = new JournalEntry { EntryNumber = "JE-2026-001", Date = new DateTime(2026, 5, 10), Description = "Customer advance – Mahmood Developers (DHA project)", Reference = "REC-001", TotalDebit = 1500000, TotalCredit = 1500000, IsPosted = true, CreatedAt = DateTime.UtcNow };
            je1.Lines = new List<JournalEntryLine>
            {
                new JournalEntryLine { Account = coa["1200"], Debit = 1500000, Credit = 0,       Description = "Bank receipt" },
                new JournalEntryLine { Account = coa["4000"], Debit = 0,       Credit = 1500000, Description = "Contract revenue recognised" },
            };

            var je2 = new JournalEntry { EntryNumber = "JE-2026-002", Date = new DateTime(2026, 5, 31), Description = "May 2026 labour wages expense", Reference = "PAY-MAY26-LAB", TotalDebit = 216000, TotalCredit = 216000, IsPosted = true, CreatedAt = DateTime.UtcNow };
            je2.Lines = new List<JournalEntryLine>
            {
                new JournalEntryLine { Account = coa["5100"], Debit = 216000, Credit = 0,      Description = "Wages expense" },
                new JournalEntryLine { Account = coa["1100"], Debit = 0,      Credit = 216000, Description = "Cash paid to labourers" },
            };

            var je3 = new JournalEntry { EntryNumber = "JE-2026-003", Date = new DateTime(2026, 5, 15), Description = "Cement purchase – 500 bags (Usman Cement Store)", Reference = "PO-2026-001", TotalDebit = 850000, TotalCredit = 850000, IsPosted = true, CreatedAt = DateTime.UtcNow };
            je3.Lines = new List<JournalEntryLine>
            {
                new JournalEntryLine { Account = coa["5200"], Debit = 850000, Credit = 0,      Description = "Material cost" },
                new JournalEntryLine { Account = coa["2100"], Debit = 0,      Credit = 850000, Description = "Payable to supplier" },
            };

            ctx.JournalEntries.AddRange(je1, je2, je3);
        }

        // ── Notifications ────────────────────────────────────────────────────
        if (!hasNotifs)
        {
            ctx.Notifications.AddRange(
                new Notification { Type = NotificationType.LowStock,        Title = "Low Stock Alert – OPC Cement",     Message = "OPC Cement stock is below the threshold. Current: 320 bags. Reorder recommended.", IsRead = false, CreatedAt = DateTime.UtcNow.AddDays(-2) },
                new Notification { Type = NotificationType.TaxDue,          Title = "Sales Tax Due – June 2026",         Message = "Sales tax for June 2026 (PKR 295,000) is due on 15 July 2026.",                    IsRead = false, CreatedAt = DateTime.UtcNow.AddDays(-1) },
                new Notification { Type = NotificationType.MaintenanceDue,   Title = "JCB Excavator – Maintenance Due",   Message = "JCB 3CX (SN-JCB-001) maintenance is overdue. Please schedule service.",              IsRead = false, CreatedAt = DateTime.UtcNow },
                new Notification { Type = NotificationType.SalaryDue,       Title = "Salary Processing – July 2026",     Message = "July 2026 salary processing is due. 5 employees pending payment.",                    IsRead = true,  CreatedAt = DateTime.UtcNow.AddDays(-5), ReadAt = DateTime.UtcNow.AddDays(-4) },
                new Notification { Type = NotificationType.PendingPayment,   Title = "Supplier Payment Pending – Raza Steel", Message = "Outstanding payable PKR 1,100,000 to Raza Steel Works. Payment due.",          IsRead = false, CreatedAt = DateTime.UtcNow.AddDays(-3) },
                new Notification { Type = NotificationType.General,         Title = "System Updated",                    Message = "BuildERP has been updated to v2.1. New inventory reports are now available.",         IsRead = true,  CreatedAt = DateTime.UtcNow.AddDays(-7), ReadAt = DateTime.UtcNow.AddDays(-6) }
            );
        }

        // ── Audit Logs ───────────────────────────────────────────────────────
        if (!hasAuditLogs)
        {
            ctx.AuditLogs.AddRange(
                new AuditLog { UserEmail = "admin@builderp.local", Action = "Create", EntityType = "Customer",  EntityId = "seed", NewValues = "{\"Name\":\"Tariq Mahmood\"}",          IpAddress = "127.0.0.1", Succeeded = true, CreatedAt = DateTime.UtcNow.AddDays(-10) },
                new AuditLog { UserEmail = "admin@builderp.local", Action = "Create", EntityType = "Supplier",  EntityId = "seed", NewValues = "{\"Name\":\"Raza Steel Works\"}",        IpAddress = "127.0.0.1", Succeeded = true, CreatedAt = DateTime.UtcNow.AddDays(-10) },
                new AuditLog { UserEmail = "admin@builderp.local", Action = "Create", EntityType = "Employee",  EntityId = "seed", NewValues = "{\"FullName\":\"Imran Aslam\"}",         IpAddress = "127.0.0.1", Succeeded = true, CreatedAt = DateTime.UtcNow.AddDays(-9)  },
                new AuditLog { UserEmail = "admin@builderp.local", Action = "Create", EntityType = "Income",    EntityId = "seed", NewValues = "{\"Amount\":1500000}",                   IpAddress = "127.0.0.1", Succeeded = true, CreatedAt = DateTime.UtcNow.AddDays(-8)  },
                new AuditLog { UserEmail = "admin@builderp.local", Action = "Create", EntityType = "Expense",   EntityId = "seed", NewValues = "{\"Amount\":850000}",                    IpAddress = "127.0.0.1", Succeeded = true, CreatedAt = DateTime.UtcNow.AddDays(-7)  },
                new AuditLog { UserEmail = "admin@builderp.local", Action = "Update", EntityType = "Vehicle",   EntityId = "seed", OldValues = "{\"Status\":\"Active\"}",   NewValues = "{\"Status\":\"UnderMaintenance\"}", IpAddress = "192.168.1.10", Succeeded = true, CreatedAt = DateTime.UtcNow.AddDays(-3) },
                new AuditLog { UserEmail = "admin@builderp.local", Action = "Login",  EntityType = "User",      EntityId = "seed", NewValues = "{\"Email\":\"admin@builderp.local\"}",  IpAddress = "192.168.1.5",  Succeeded = true, CreatedAt = DateTime.UtcNow.AddDays(-1)  }
            );
        }

        // ── Single SaveChangesAsync for everything ────────────────────────────
        var changes = await ctx.SaveChangesAsync();
        logger.LogInformation("Seeded sample data — {Count} rows inserted", changes);
    }

    private static async Task SeedDailyEntriesAsync(ApplicationDbContext ctx, ILogger logger)
    {
        var startDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var endDate   = new DateTime(2026, 7, 24, 0, 0, 0, DateTimeKind.Utc);
        int totalDays = (int)(endDate - startDate).TotalDays + 1; // 205 days

        // If already seeded (income count >= expected days), skip
        if (await ctx.Incomes.CountAsync() >= totalDays)
        {
            logger.LogInformation("Daily entries already seeded — skipping");
            return;
        }

        // Clear previous partial data and re-seed cleanly
        await ctx.Incomes.ExecuteDeleteAsync();
        await ctx.Expenses.ExecuteDeleteAsync();
        await ctx.LabourAttendances.ExecuteDeleteAsync();

        // ── Reference data ────────────────────────────────────────────────────
        string[] customers = { "Tariq Mahmood", "Amjad Ali Khan", "Saba Noor", "Fahad Enterprises", "Hina Malik" };
        string[] projects  = { "DHA Phase 8 Villas", "Raiwind Road Apartments", "Home Extension", "Commercial Plaza Block B", "Bahria Townhouse" };
        string[] vendors   = { "Usman Cement Store", "Raza Steel Works", "Bilal Timber Mart", "Pak Electric Supply", "Sunrise Plumbing Store", "PSO Petrol Station", "Ashraf Engineering", "Riaz Tyres" };

        var incomeCats = new[] { IncomeCategory.CustomerPayment, IncomeCategory.ProjectIncome, IncomeCategory.OtherIncome };
        var expenseCats = new[]
        {
            ExpenseCategory.LabourExpenses,
            ExpenseCategory.Salaries,
            ExpenseCategory.SuppliesMaterialPurchase,
            ExpenseCategory.MachineryMaintenance,
            ExpenseCategory.VehicleExpenses,
            ExpenseCategory.Fuel,
            ExpenseCategory.ElectricalExpenses,
            ExpenseCategory.OfficeExpenses,
            ExpenseCategory.Miscellaneous,
            ExpenseCategory.CarpentryExpenses,
            ExpenseCategory.PlantExpenses,
        };

        // Realistic income descriptions per category
        string[] incomeDescs = {
            "Customer advance payment received",
            "Milestone payment – structure work complete",
            "Partial payment against invoice",
            "Project completion payment",
            "Monthly progress billing",
            "Material supply payment",
            "Equipment hire income",
            "Contract deposit received",
            "Retention amount released",
            "Final settlement payment",
        };

        // Realistic expense descriptions per category
        var expenseDescs = new Dictionary<ExpenseCategory, string[]>
        {
            [ExpenseCategory.LabourExpenses]           = new[] { "Daily wages – site workers", "Weekly labour payment", "Overtime wages paid" },
            [ExpenseCategory.Salaries]                 = new[] { "Monthly salaries disbursed", "Staff salary payment" },
            [ExpenseCategory.SuppliesMaterialPurchase] = new[] { "Cement purchase", "Steel bar delivery", "Brick supply", "Sand & gravel purchase", "Plumbing materials" },
            [ExpenseCategory.MachineryMaintenance]     = new[] { "Concrete mixer service", "Generator maintenance", "JCB repair", "Equipment servicing" },
            [ExpenseCategory.VehicleExpenses]          = new[] { "Tyre replacement", "Vehicle service", "Engine repair", "Vehicle insurance" },
            [ExpenseCategory.Fuel]                     = new[] { "Diesel – site generator", "Petrol – vehicles", "Fuel for machinery" },
            [ExpenseCategory.ElectricalExpenses]       = new[] { "Electrical wiring materials", "Switchgear purchase", "Electric cable supply" },
            [ExpenseCategory.OfficeExpenses]           = new[] { "Office stationery", "Utility bills", "Office rent", "Internet & phone" },
            [ExpenseCategory.Miscellaneous]            = new[] { "Site security charges", "Miscellaneous site expense", "Tool & equipment purchase" },
            [ExpenseCategory.CarpentryExpenses]        = new[] { "Wood & formwork materials", "Carpenter tools purchase", "Door/window frames" },
            [ExpenseCategory.PlantExpenses]            = new[] { "Plant hire charges", "Batching plant fuel", "Plant operator wages" },
        };

        var incomes   = new List<Income>(totalDays);
        var expenses  = new List<Expense>(totalDays);

        for (int d = 0; d < totalDays; d++)
        {
            var date   = startDate.AddDays(d);
            bool isSun = date.DayOfWeek == DayOfWeek.Sunday;

            // ── Income ────────────────────────────────────────────────────────
            var cat    = incomeCats[d % incomeCats.Length];
            int primeA = (d * 7919 % 19) + 1;   // 1-19
            int primeB = (d * 1013 % 9)  + 1;   // 1-9

            decimal amount = cat switch
            {
                IncomeCategory.CustomerPayment => 100000 + primeA * 50000m + primeB * 10000m,
                IncomeCategory.ProjectIncome   => 300000 + primeA * 80000m + primeB * 20000m,
                _                              => 30000  + primeA * 10000m + primeB * 5000m,
            };

            incomes.Add(new Income
            {
                Category     = cat,
                Amount       = amount,
                Date         = date,
                Description  = incomeDescs[d % incomeDescs.Length] + $" – {projects[d % projects.Length]}",
                CustomerName = cat != IncomeCategory.OtherIncome ? customers[d % customers.Length] : null,
                ProjectName  = projects[d % projects.Length],
                IsPaid       = true,
                CreatedAt    = date,
            });

            // ── Expense ───────────────────────────────────────────────────────
            var expCat = expenseCats[d % expenseCats.Length];
            int primeC = (d * 3571 % 13) + 1;
            int primeD = (d * 2017 % 7)  + 1;

            decimal expAmount = expCat switch
            {
                ExpenseCategory.Salaries                 => 300000 + primeC * 10000m,
                ExpenseCategory.SuppliesMaterialPurchase => 80000  + primeC * 20000m + primeD * 5000m,
                ExpenseCategory.LabourExpenses           => 40000  + primeC * 8000m,
                ExpenseCategory.MachineryMaintenance     => 15000  + primeC * 5000m,
                ExpenseCategory.VehicleExpenses          => 8000   + primeC * 3000m,
                ExpenseCategory.Fuel                     => 15000  + primeC * 2000m,
                ExpenseCategory.ElectricalExpenses       => 20000  + primeC * 5000m,
                ExpenseCategory.CarpentryExpenses        => 12000  + primeC * 4000m,
                ExpenseCategory.PlantExpenses            => 25000  + primeC * 6000m,
                ExpenseCategory.OfficeExpenses           => 3000   + primeC * 1000m,
                _                                        => 5000   + primeC * 1500m,
            };

            var descList = expenseDescs[expCat];
            expenses.Add(new Expense
            {
                Category    = expCat,
                Amount      = expAmount,
                Date        = date,
                Description = descList[d % descList.Length] + $" – {date:dd MMM yyyy}",
                Vendor      = expCat != ExpenseCategory.OfficeExpenses ? vendors[d % vendors.Length] : null,
                CreatedAt   = date,
            });
        }

        ctx.Incomes.AddRange(incomes);
        ctx.Expenses.AddRange(expenses);

        // ── Labour Attendance (per labour × per day) ──────────────────────────
        var labours = await ctx.Labours.ToListAsync();
        if (labours.Count > 0)
        {
            var attendances = new List<LabourAttendance>(totalDays * labours.Count);
            for (int d = 0; d < totalDays; d++)
            {
                var date   = startDate.AddDays(d);
                bool isSun = date.DayOfWeek == DayOfWeek.Sunday;
                foreach (var labour in labours)
                {
                    attendances.Add(new LabourAttendance
                    {
                        LabourId      = labour.Id,
                        Date          = date,
                        IsPresent     = !isSun,
                        OvertimeHours = (!isSun && d % 6 == 0) ? 2 : 0,
                        Notes         = isSun ? "Weekly off – Sunday" : null,
                    });
                }
            }
            ctx.LabourAttendances.AddRange(attendances);
        }

        var saved = await ctx.SaveChangesAsync();
        logger.LogInformation(
            "Seeded daily entries: {Days} days ({Start:dd-MMM-yyyy} → {End:dd-MMM-yyyy}) — {Rows} total rows",
            totalDays, startDate, endDate, saved);
    }
}
