namespace HockeyHub.Core.Models.Entities;

public class GamePeriodScore
{
    public int Id { get; set; }
    public int GameId { get; set; }
    public int Period { get; set; } // 1, 2, 3, 4+ for OT/SO
    public required string PeriodLabel { get; set; } // "1st", "2nd", "3rd", "OT", "2OT", "SO"
    public int HomeGoals { get; set; }
    public int AwayGoals { get; set; }
    public int HomeShots { get; set; }
    public int AwayShots { get; set; }

    // Navigation
    public Game Game { get; set; } = null!;
}
