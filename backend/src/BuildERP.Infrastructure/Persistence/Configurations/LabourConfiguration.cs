using BuildERP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildERP.Infrastructure.Persistence.Configurations;

public class LabourConfiguration : IEntityTypeConfiguration<Labour>
{
    public void Configure(EntityTypeBuilder<Labour> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Name).IsRequired().HasMaxLength(200);
        builder.Property(l => l.PhoneNumber).HasMaxLength(20);
        builder.Property(l => l.CNIC).HasMaxLength(20);
        builder.Property(l => l.Address).HasMaxLength(500);
        builder.Property(l => l.Trade).HasMaxLength(100);
        builder.Property(l => l.DailyWage).HasPrecision(18, 2);
        builder.Property(l => l.OvertimeRatePerHour).HasPrecision(18, 2);

        builder.HasMany(l => l.Attendances)
            .WithOne(a => a.Labour)
            .HasForeignKey(a => a.LabourId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(l => l.Advances)
            .WithOne(a => a.Labour)
            .HasForeignKey(a => a.LabourId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
