namespace HockeyHub.Core.Models.Entities;

public class Personnel
{
    public int Id { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public int TeamId { get; set; }
    public required string Role { get; set; }
    public required string Title { get; set; }
    public bool IsActive { get; set; }
    public int? FormerPlayerId { get; set; }

    public Team Team { get; set; } = null!;
    public Player? FormerPlayer { get; set; }
}
