using BuildERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildERP.Infrastructure.Persistence.Configurations;

public class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Amount).HasPrecision(18, 2);
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.Property(e => e.Vendor).HasMaxLength(200);
        builder.Property(e => e.BillPath).HasMaxLength(500);
        builder.Property(e => e.CreatedById).HasMaxLength(450);
        builder.HasIndex(e => e.Date);
        builder.HasIndex(e => e.Category);
    }
}
