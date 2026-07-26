namespace BuildERP.Domain.Constants;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Accountant = "Accountant";
    public const string Manager = "Manager";
    public const string DataEntryOperator = "DataEntryOperator";

    public static readonly string[] All =
    {
        Admin,
        Accountant,
        Manager,
        DataEntryOperator
    };
}
