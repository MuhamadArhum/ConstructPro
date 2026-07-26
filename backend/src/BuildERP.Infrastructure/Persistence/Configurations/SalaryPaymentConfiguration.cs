using BuildERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildERP.Infrastructure.Persistence.Configurations;

public class SalaryPaymentConfiguration : IEntityTypeConfiguration<SalaryPayment>
{
    public void Configure(EntityTypeBuilder<SalaryPayment> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.BasicSalary).HasPrecision(18, 2);
        builder.Property(p => p.Bonus).HasPrecision(18, 2);
        builder.Property(p => p.Deductions).HasPrecision(18, 2);
        builder.Property(p => p.NetSalary).HasPrecision(18, 2);
        builder.Property(p => p.Remarks).HasMaxLength(500);
        builder.HasIndex(p => new { p.EmployeeId, p.Month, p.Year }).IsUnique();
    }
}
