namespace BuildERP.Domain.Constants;

public static class Permissions
{
    public const string DashboardView = "Dashboard.View";

    public const string UsersView   = "Users.View";
    public const string UsersCreate = "Users.Create";
    public const string UsersEdit   = "Users.Edit";
    public const string UsersDelete = "Users.Delete";

    public const string RolesView   = "Roles.View";
    public const string RolesCreate = "Roles.Create";
    public const string RolesEdit   = "Roles.Edit";
    public const string RolesDelete = "Roles.Delete";

    public const string AuditLogsView = "AuditLogs.View";

    public const string ProfileView = "Profile.View";
    public const string ProfileEdit = "Profile.Edit";

    public const string IncomeView   = "Income.View";
    public const string IncomeCreate = "Income.Create";
    public const string IncomeEdit   = "Income.Edit";
    public const string IncomeDelete = "Income.Delete";

    public const string ExpenseView   = "Expense.View";
    public const string ExpenseCreate = "Expense.Create";
    public const string ExpenseEdit   = "Expense.Edit";
    public const string ExpenseDelete = "Expense.Delete";

    public const string LabourView   = "Labour.View";
    public const string LabourCreate = "Labour.Create";
    public const string LabourEdit   = "Labour.Edit";
    public const string LabourDelete = "Labour.Delete";

    public const string EmployeesView   = "Employees.View";
    public const string EmployeesCreate = "Employees.Create";
    public const string EmployeesEdit   = "Employees.Edit";
    public const string EmployeesDelete = "Employees.Delete";

    public const string MachineryView   = "Machinery.View";
    public const string MachineryCreate = "Machinery.Create";
    public const string MachineryEdit   = "Machinery.Edit";
    public const string MachineryDelete = "Machinery.Delete";

    public const string VehiclesView   = "Vehicles.View";
    public const string VehiclesCreate = "Vehicles.Create";
    public const string VehiclesEdit   = "Vehicles.Edit";
    public const string VehiclesDelete = "Vehicles.Delete";

    public const string PlantsView   = "Plants.View";
    public const string PlantsCreate = "Plants.Create";
    public const string PlantsEdit   = "Plants.Edit";
    public const string PlantsDelete = "Plants.Delete";

    public const string CustomersView   = "Customers.View";
    public const string CustomersCreate = "Customers.Create";
    public const string CustomersEdit   = "Customers.Edit";
    public const string CustomersDelete = "Customers.Delete";

    public const string SuppliersView   = "Suppliers.View";
    public const string SuppliersCreate = "Suppliers.Create";
    public const string SuppliersEdit   = "Suppliers.Edit";
    public const string SuppliersDelete = "Suppliers.Delete";

    public const string InventoryView   = "Inventory.View";
    public const string InventoryCreate = "Inventory.Create";
    public const string InventoryEdit   = "Inventory.Edit";
    public const string InventoryDelete = "Inventory.Delete";

    public const string TaxView   = "Tax.View";
    public const string TaxCreate = "Tax.Create";
    public const string TaxEdit   = "Tax.Edit";
    public const string TaxDelete = "Tax.Delete";

    public const string AccountsView   = "Accounts.View";
    public const string AccountsCreate = "Accounts.Create";
    public const string AccountsEdit   = "Accounts.Edit";
    public const string AccountsDelete = "Accounts.Delete";

    public const string ReportsView = "Reports.View";

    public const string NotificationsView = "Notifications.View";

    public const string SettingsView = "Settings.View";
    public const string SettingsEdit = "Settings.Edit";

    public static readonly string[] All =
    {
        DashboardView,
        UsersView, UsersCreate, UsersEdit, UsersDelete,
        RolesView, RolesCreate, RolesEdit, RolesDelete,
        AuditLogsView,
        ProfileView, ProfileEdit,
        IncomeView, IncomeCreate, IncomeEdit, IncomeDelete,
        ExpenseView, ExpenseCreate, ExpenseEdit, ExpenseDelete,
        LabourView, LabourCreate, LabourEdit, LabourDelete,
        EmployeesView, EmployeesCreate, EmployeesEdit, EmployeesDelete,
        MachineryView, MachineryCreate, MachineryEdit, MachineryDelete,
        VehiclesView, VehiclesCreate, VehiclesEdit, VehiclesDelete,
        PlantsView, PlantsCreate, PlantsEdit, PlantsDelete,
        CustomersView, CustomersCreate, CustomersEdit, CustomersDelete,
        SuppliersView, SuppliersCreate, SuppliersEdit, SuppliersDelete,
        InventoryView, InventoryCreate, InventoryEdit, InventoryDelete,
        TaxView, TaxCreate, TaxEdit, TaxDelete,
        AccountsView, AccountsCreate, AccountsEdit, AccountsDelete,
        ReportsView,
        NotificationsView,
        SettingsView, SettingsEdit,
    };
}
