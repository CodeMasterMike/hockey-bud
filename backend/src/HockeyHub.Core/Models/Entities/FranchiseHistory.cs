namespace HockeyHub.Core.Models.Entities;

public class FranchiseHistory
{
    public int Id { get; set; }
    public int CurrentTeamId { get; set; }
    public required string PreviousLocationName { get; set; }
    public required string PreviousName { get; set; }
    public int YearStart { get; set; }
    public int YearEnd { get; set; }
    public int SortOrder { get; set; }

    public Team CurrentTeam { get; set; } = null!;
}
