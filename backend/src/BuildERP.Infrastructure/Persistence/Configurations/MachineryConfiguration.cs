using BuildERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildERP.Infrastructure.Persistence.Configurations;

public class MachineryConfiguration : IEntityTypeConfiguration<Machinery>
{
    public void Configure(EntityTypeBuilder<Machinery> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Name).IsRequired().HasMaxLength(200);
        builder.Property(m => m.Model).HasMaxLength(100);
        builder.Property(m => m.SerialNumber).HasMaxLength(100);
        builder.Property(m => m.PurchasePrice).HasPrecision(18, 2);
        builder.Property(m => m.TotalRunningHours).HasPrecision(10, 2);
        builder.Property(m => m.Notes).HasMaxLength(1000);
        builder.HasIndex(m => m.Status);

        builder.HasMany(m => m.MaintenanceRecords)
            .WithOne(r => r.Machinery)
            .HasForeignKey(r => r.MachineryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
