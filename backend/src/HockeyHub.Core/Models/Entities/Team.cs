namespace HockeyHub.Core.Models.Entities;

public class Team
{
    public int Id { get; set; }
    public int LeagueId { get; set; }
    public required string LocationName { get; set; }
    public required string Name { get; set; }
    public required string Abbreviation { get; set; }
    public string? LogoUrl { get; set; }
    public required string PrimaryColor { get; set; }
    public int JoinedSeasonYear { get; set; }
    public int OriginalJoinYear { get; set; }
    public int StanleyCupsTotal { get; set; }
    public int StanleyCupsSince1973 { get; set; }
    public int StanleyCupsSince2006 { get; set; }
    public bool IsActive { get; set; }

    public League League { get; set; } = null!;
    public ICollection<FranchiseHistory> FranchiseHistories { get; set; } = [];
    public ICollection<Player> Players { get; set; } = [];
    public ICollection<Personnel> Personnel { get; set; } = [];
}
