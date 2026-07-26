using BuildERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildERP.Infrastructure.Persistence.Configurations;

public class LabourAdvanceConfiguration : IEntityTypeConfiguration<LabourAdvance>
{
    public void Configure(EntityTypeBuilder<LabourAdvance> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Amount).HasPrecision(18, 2);
        builder.Property(a => a.Reason).HasMaxLength(500);
        builder.HasIndex(a => a.LabourId);
        builder.HasIndex(a => a.Date);
    }
}
