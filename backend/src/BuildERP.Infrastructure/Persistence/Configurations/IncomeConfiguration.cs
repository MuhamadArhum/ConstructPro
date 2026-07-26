using BuildERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildERP.Infrastructure.Persistence.Configurations;

public class IncomeConfiguration : IEntityTypeConfiguration<Income>
{
    public void Configure(EntityTypeBuilder<Income> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Amount).HasPrecision(18, 2);
        builder.Property(i => i.Description).HasMaxLength(500);
        builder.Property(i => i.CustomerName).HasMaxLength(200);
        builder.Property(i => i.ProjectName).HasMaxLength(200);
        builder.Property(i => i.ReceiptPath).HasMaxLength(500);
        builder.Property(i => i.CreatedById).HasMaxLength(450);
        builder.HasIndex(i => i.Date);
        builder.HasIndex(i => i.Category);
    }
}
