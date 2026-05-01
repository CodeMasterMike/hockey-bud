namespace HockeyHub.Core.Models.Entities;

public class StandingsSnapshot
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public int SeasonId { get; set; }
    public required string Division { get; set; }
    public required string Conference { get; set; }

    public int GamesPlayed { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int OvertimeLosses { get; set; }
    public int Points { get; set; }
    public decimal PointsPct { get; set; }
    public int RegulationWins { get; set; }
    public int RegulationPlusOTWins { get; set; }
    public int GoalsFor { get; set; }
    public int GoalsAgainst { get; set; }
    public int GoalDifferential { get; set; }
    public decimal PowerPlayPct { get; set; }
    public decimal PenaltyKillPct { get; set; }
    public decimal? FaceoffPct { get; set; }
    public int DivisionRank { get; set; }
    public int ConferenceRank { get; set; }
    public int LeagueRank { get; set; }
    public int? WildCardRank { get; set; }
    public string? ClinchIndicator { get; set; }

    public DateTimeOffset LastUpdated { get; set; }

    // Navigation
    public Team Team { get; set; } = null!;
    public Season Season { get; set; } = null!;
}
