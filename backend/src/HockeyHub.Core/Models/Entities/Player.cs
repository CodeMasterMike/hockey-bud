namespace HockeyHub.Core.Models.Entities;

public class Player
{
    public int Id { get; set; }
    public required string ExternalId { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public DateOnly DateOfBirth { get; set; }
    public required string BirthCity { get; set; }
    public string? BirthStateProvince { get; set; }
    public required string BirthCountry { get; set; }
    public int Height { get; set; }
    public int Weight { get; set; }
    public required string ShootsCatches { get; set; }
    public int? DraftYear { get; set; }
    public int? DraftRound { get; set; }
    public int? DraftPick { get; set; }
    public int? DraftTeamId { get; set; }
    public int? CurrentTeamId { get; set; }
    public int? JerseyNumber { get; set; }
    public bool IsActive { get; set; }
    public bool IsEbug { get; set; }

    public Team? DraftTeam { get; set; }
    public Team? CurrentTeam { get; set; }
}
