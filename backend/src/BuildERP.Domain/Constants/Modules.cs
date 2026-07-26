namespace BuildERP.Domain.Constants;

public static class Modules
{
    public const string Dashboard = "Dashboard";
    public const string Users = "Users";
    public const string Roles = "Roles";
    public const string AuditLogs = "AuditLogs";
    public const string Profile = "Profile";
    public const string Income = "Income";
    public const string Expenses = "Expenses";
    public const string Labour = "Labour";
    public const string Employees = "Employees";
    public const string Machinery = "Machinery";

    public static readonly string[] All = { Dashboard, Users, Roles, AuditLogs, Profile, Income, Expenses, Labour, Employees, Machinery };
}
