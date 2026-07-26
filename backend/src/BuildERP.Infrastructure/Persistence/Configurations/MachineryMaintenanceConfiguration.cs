using BuildERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildERP.Infrastructure.Persistence.Configurations;

public class MachineryMaintenanceConfiguration : IEntityTypeConfiguration<MachineryMaintenance>
{
    public void Configure(EntityTypeBuilder<MachineryMaintenance> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Description).IsRequired().HasMaxLength(500);
        builder.Property(r => r.Cost).HasPrecision(18, 2);
        builder.Property(r => r.RunningHoursAtService).HasPrecision(10, 2);
        builder.Property(r => r.ServiceProvider).HasMaxLength(200);
        builder.HasIndex(r => r.MachineryId);
        builder.HasIndex(r => r.MaintenanceDate);
    }
}
