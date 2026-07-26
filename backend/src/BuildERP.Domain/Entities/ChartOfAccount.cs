using BuildERP.Domain.Enums;
namespace BuildERP.Domain.Entities;
public class ChartOfAccount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public Guid? ParentId { get; set; }
    public ChartOfAccount? Parent { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<JournalEntryLine> JournalLines { get; set; } = new List<JournalEntryLine>();
}
