namespace HockeyHub.Core.Providers;

public interface INhlDataProvider
{
    Task<IReadOnlyList<NhlTeamData>> GetTeamsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<NhlPlayerData>> GetRosterAsync(string teamAbbreviation, CancellationToken ct = default);
    Task<NhlPlayerData?> GetPlayerAsync(int externalId, CancellationToken ct = default);
    Task<IReadOnlyList<NhlGameData>> GetScoresAsync(DateOnly date, CancellationToken ct = default);
    Task<NhlGameDetailData?> GetGameDetailAsync(int gameId, CancellationToken ct = default);
    Task<IReadOnlyList<NhlStandingsEntry>> GetStandingsAsync(string season, CancellationToken ct = default);
    Task<IReadOnlyList<NhlTradeData>> GetTradesAsync(string season, CancellationToken ct = default);
    Task<IReadOnlyList<NhlScheduleGame>> GetScheduleAsync(string season, CancellationToken ct = default);
    Task<IReadOnlyList<NhlSeasonData>> GetSeasonsAsync(CancellationToken ct = default);
}

public record NhlTeamData(
    int Id,
    string Abbreviation,
    string LocationName,
    string Name,
    string LogoUrl,
    string PrimaryColor
);

public record NhlPlayerData(
    int Id,
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string BirthCity,
    string? BirthStateProvince,
    string BirthCountry,
    int HeightInches,
    int WeightPounds,
    string ShootsCatches,
    string Position,
    int? JerseyNumber,
    int? DraftYear,
    int? DraftRound,
    int? DraftPick,
    string? DraftTeamAbbreviation,
    string TeamAbbreviation,
    string? HeadshotUrl,
    bool IsActive
);

public record NhlGameData(
    int Id,
    string Status,
    DateTimeOffset ScheduledStart,
    string HomeTeamAbbreviation,
    string AwayTeamAbbreviation,
    int? HomeScore,
    int? AwayScore,
    int? HomeShotsOnGoal,
    int? AwayShotsOnGoal,
    int? CurrentPeriod,
    string? CurrentPeriodLabel,
    string? PeriodTimeRemaining,
    int? PeriodTimeRemainingSeconds,
    bool ClockRunning,
    bool IsOvertime,
    bool IsShootout
);

public record NhlGameDetailData(
    int GameId,
    IReadOnlyList<NhlPeriodScore> PeriodScores,
    IReadOnlyList<NhlGameEvent> Events,
    IReadOnlyList<NhlGamePlayerStat> PlayerStats,
    NhlGameTeamStats HomeStats,
    NhlGameTeamStats AwayStats
);

public record NhlPeriodScore(
    int Period,
    string PeriodLabel,
    int HomeGoals,
    int AwayGoals,
    int HomeShots,
    int AwayShots
);

public record NhlGameEvent(
    string EventType,
    int Period,
    string GameClockTime,
    string TeamAbbreviation,
    int? PrimaryPlayerId,
    int? SecondaryPlayerId,
    int? TertiaryPlayerId,
    decimal? CoordinateX,
    decimal? CoordinateY,
    string? VideoUrl,
    string? Description,
    bool IsPowerPlay,
    bool IsShortHanded,
    bool IsEmptyNet,
    string? PenaltyType,
    int? PenaltyMinutes
);

public record NhlGamePlayerStat(
    int PlayerId,
    string TeamAbbreviation,
    bool IsHome,
    int JerseyNumber,
    string Position,
    int Goals,
    int Assists,
    int Points,
    int PlusMinus,
    int Hits,
    int PenaltyMinutes,
    TimeSpan TimeOnIce,
    int Shots,
    int? ShotsAgainst,
    int? Saves,
    decimal? SavePct
);

public record NhlGameTeamStats(
    int ShotsOnGoal,
    int Hits,
    int PowerPlayGoals,
    int PowerPlayOpps,
    decimal FaceoffPct,
    int Takeaways,
    int Giveaways,
    TimeSpan? TimeOnAttack
);

public record NhlStandingsEntry(
    string TeamAbbreviation,
    string Division,
    string Conference,
    int GamesPlayed,
    int Wins,
    int Losses,
    int OvertimeLosses,
    int Points,
    decimal PointsPct,
    int RegulationWins,
    int RegulationPlusOTWins,
    int GoalsFor,
    int GoalsAgainst,
    decimal PowerPlayPct,
    decimal PenaltyKillPct,
    decimal? FaceoffPct
);

public record NhlTradeData(
    DateOnly TradeDate,
    string Description,
    IReadOnlyList<NhlTradeSide> Sides
);

public record NhlTradeSide(
    string TeamAbbreviation,
    string Direction,
    IReadOnlyList<NhlTradeAsset> Assets
);

public record NhlTradeAsset(
    string AssetType,
    int? PlayerId,
    string? PlayerName,
    int? DraftPickYear,
    int? DraftPickRound,
    string? Description
);

public record NhlScheduleGame(
    int GameId,
    DateOnly GameDate,
    DateTimeOffset ScheduledStart,
    string HomeTeamAbbreviation,
    string AwayTeamAbbreviation,
    string? ArenaName,
    string Status
);

public record NhlSeasonData(
    int YearStart,
    int YearEnd,
    string Label,
    bool IsCurrent
);
