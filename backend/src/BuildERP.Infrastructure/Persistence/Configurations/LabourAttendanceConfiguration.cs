using BuildERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildERP.Infrastructure.Persistence.Configurations;

public class LabourAttendanceConfiguration : IEntityTypeConfiguration<LabourAttendance>
{
    public void Configure(EntityTypeBuilder<LabourAttendance> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.OvertimeHours).HasPrecision(10, 2);
        builder.Property(a => a.Notes).HasMaxLength(500);
        builder.HasIndex(a => new { a.LabourId, a.Date }).IsUnique();
    }
}
