namespace HockeyHub.Core.Models.Entities;

public class Game
{
    public int Id { get; set; }
    public int ExternalId { get; set; }
    public int SeasonId { get; set; }
    public int HomeTeamId { get; set; }
    public int AwayTeamId { get; set; }
    public int? ArenaId { get; set; }

    public DateTimeOffset ScheduledStart { get; set; }
    public DateOnly GameDateLocal { get; set; }
    public required string Status { get; set; } // Scheduled, Live, Final, Postponed, Cancelled

    // Live game fields
    public int? CurrentPeriod { get; set; }
    public string? CurrentPeriodLabel { get; set; }
    public string? PeriodTimeRemaining { get; set; }
    public int? PeriodTimeRemainingSeconds { get; set; }
    public bool ClockRunning { get; set; }
    public DateTimeOffset? ClockLastSyncedAt { get; set; }

    // Scores
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }

    // Shots on goal
    public int? HomeShotsOnGoal { get; set; }
    public int? AwayShotsOnGoal { get; set; }

    // Team stats
    public int? HomeHits { get; set; }
    public int? AwayHits { get; set; }
    public int? HomePowerPlayGoals { get; set; }
    public int? HomePowerPlayOpps { get; set; }
    public int? AwayPowerPlayGoals { get; set; }
    public int? AwayPowerPlayOpps { get; set; }
    public decimal? HomeFaceoffPct { get; set; }
    public decimal? AwayFaceoffPct { get; set; }
    public int? HomeTakeaways { get; set; }
    public int? AwayTakeaways { get; set; }
    public int? HomeGiveaways { get; set; }
    public int? AwayGiveaways { get; set; }
    public TimeSpan? HomeTimeOnAttack { get; set; }
    public TimeSpan? AwayTimeOnAttack { get; set; }

    // Overtime/shootout flags
    public bool IsOvertime { get; set; }
    public bool IsShootout { get; set; }

    public DateTimeOffset LastUpdated { get; set; }

    // Navigation
    public Season Season { get; set; } = null!;
    public Team HomeTeam { get; set; } = null!;
    public Team AwayTeam { get; set; } = null!;
    public Arena? Arena { get; set; }
    public ICollection<GamePeriodScore> PeriodScores { get; set; } = [];
}
