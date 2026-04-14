namespace HockeyHub.Core.Models.Entities;

/// <summary>
/// Per-player, per-team, per-season stat line.
/// Many fields are nullable to handle historical eras where they weren't tracked.
/// Goalie-specific fields are null for skaters.
/// </summary>
public class PlayerSeason
{
    public int Id { get; set; }
    public int PlayerId { get; set; }
    public int TeamId { get; set; }
    public int SeasonId { get; set; }
    public required string LeagueAbbreviation { get; set; }
    public required string Era { get; set; }

    // ── Skater stats ────────────────────────────────────────────────
    public int GamesPlayed { get; set; }
    public int Goals { get; set; }
    public int Assists { get; set; }
    public int Points { get; set; }
    public int PlusMinus { get; set; }
    public int? Hits { get; set; }
    public int PenaltyMinutes { get; set; }
    public decimal? TimeOnIcePerGame { get; set; }
    public int? Shots { get; set; }
    public decimal? ShootingPct { get; set; }
    public int? BlockedShots { get; set; }
    public int? EvenStrengthPoints { get; set; }
    public int? PowerPlayPoints { get; set; }
    public int? ShortHandedPoints { get; set; }
    public int? Giveaways { get; set; }
    public int? Takeaways { get; set; }
    public decimal? FaceoffPct { get; set; }
    public decimal? ShootoutPct { get; set; }

    // ── Advanced stats (null until analytics provider integrated) ────
    public decimal? War { get; set; }
    public decimal? XGFPer60 { get; set; }
    public decimal? XGAPer60 { get; set; }

    // ── Goalie-specific stats (null for skaters) ────────────────────
    public int? Wins { get; set; }
    public int? Losses { get; set; }
    public int? OvertimeLosses { get; set; }
    public decimal? SavePct { get; set; }
    public decimal? GoalsAgainstAvg { get; set; }
    public int? ShotsAgainst { get; set; }
    public int? Saves { get; set; }
    public int? GoalsAgainst { get; set; }
    public int? GamesStarted { get; set; }
    public int? HighDangerChances { get; set; }
    public int? HighDangerSaves { get; set; }
    public int? LowDangerChances { get; set; }
    public int? LowDangerSaves { get; set; }
    public int? GoalieGoals { get; set; }
    public int? GoalieAssists { get; set; }

    public DateTimeOffset LastUpdated { get; set; }

    // Navigation
    public Player Player { get; set; } = null!;
    public Team Team { get; set; } = null!;
    public Season Season { get; set; } = null!;
}
