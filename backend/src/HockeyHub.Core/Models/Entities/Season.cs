namespace HockeyHub.Core.Models.Entities;

public class Season
{
    public int Id { get; set; }
    public int LeagueId { get; set; }
    public int YearStart { get; set; }
    public int YearEnd { get; set; }
    public required string Label { get; set; }
    public required string Era { get; set; }
    public bool IsCurrent { get; set; }

    public League League { get; set; } = null!;
}
