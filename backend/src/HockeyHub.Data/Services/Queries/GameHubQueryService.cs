using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Data.Services.Queries;

public class GameHubQueryService(
    HockeyHubDbContext db,
    INhlDataProvider nhlProvider,
    RedisCacheService cache)
{
    public async Task<GameHubResponse?> GetGameHubAsync(int gameId, CancellationToken ct = default)
    {
        var game = await db.Games
            .Include(g => g.HomeTeam)
            .Include(g => g.AwayTeam)
            .Include(g => g.Arena)
            .Include(g => g.PeriodScores.OrderBy(p => p.Period))
            .FirstOrDefaultAsync(g => g.Id == gameId, ct);

        if (game is null) return null;

        var isLive = game.Status == "Live";
        var cacheKey = $"gamehub:{gameId}";
        var ttl = isLive ? RedisCacheService.LiveScoresTtl : TimeSpan.FromHours(1);

        var detail = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            return await nhlProvider.GetGameDetailAsync(game.ExternalId, ct);
        }, ttl, ct);

        return new GameHubResponse(
            GameId: game.Id,
            ExternalId: game.ExternalId,
            Status: game.Status,
            HomeTeam: new GameHubTeamDto(game.HomeTeam.Id, game.HomeTeam.Abbreviation,
                $"{game.HomeTeam.LocationName} {game.HomeTeam.Name}", game.HomeTeam.LogoUrl),
            AwayTeam: new GameHubTeamDto(game.AwayTeam.Id, game.AwayTeam.Abbreviation,
                $"{game.AwayTeam.LocationName} {game.AwayTeam.Name}", game.AwayTeam.LogoUrl),
            HomeScore: game.HomeScore ?? 0,
            AwayScore: game.AwayScore ?? 0,
            Arena: game.Arena is not null
                ? new GameHubArenaDto(game.Arena.Name, game.Arena.City)
                : null,
            CurrentPeriod: game.CurrentPeriod,
            PeriodTimeRemaining: game.PeriodTimeRemaining,
            IsOvertime: game.IsOvertime,
            IsShootout: game.IsShootout,
            PeriodScores: game.PeriodScores.Select(p => new GameHubPeriodScoreDto(
                p.PeriodLabel, p.HomeGoals, p.AwayGoals, p.HomeShots, p.AwayShots
            )).ToList(),
            TeamStats: new GameHubTeamStatsDto(
                ShotsOnGoal: new StatPairDto(game.HomeShotsOnGoal ?? 0, game.AwayShotsOnGoal ?? 0),
                Hits: new StatPairDto(game.HomeHits ?? 0, game.AwayHits ?? 0),
                PowerPlay: new StatPairStrDto(
                    FormatPP(game.HomePowerPlayGoals, game.HomePowerPlayOpps),
                    FormatPP(game.AwayPowerPlayGoals, game.AwayPowerPlayOpps)),
                FaceoffPct: new StatPairDecDto(game.HomeFaceoffPct ?? 0, game.AwayFaceoffPct ?? 0),
                Giveaways: new StatPairDto(game.HomeGiveaways ?? 0, game.AwayGiveaways ?? 0),
                Takeaways: new StatPairDto(game.HomeTakeaways ?? 0, game.AwayTakeaways ?? 0)
            ),
            Events: detail?.Events.Select(e => new GameHubEventDto(
                e.EventType,
                e.Period,
                e.GameClockTime,
                e.TeamAbbreviation,
                e.Description,
                e.IsPowerPlay,
                e.IsShortHanded,
                e.IsEmptyNet,
                e.PenaltyType,
                e.PenaltyMinutes,
                e.CoordinateX,
                e.CoordinateY,
                e.VideoUrl
            )).ToList() ?? [],
            PlayerStats: BuildPlayerStats(detail),
            DataAsOf: game.LastUpdated
        );
    }

    private static GameHubPlayerStatsDto BuildPlayerStats(NhlGameDetailData? detail)
    {
        if (detail is null)
            return new GameHubPlayerStatsDto(
                new GameHubTeamPlayersDto([], []),
                new GameHubTeamPlayersDto([], []));

        var homeSkaters = detail.PlayerStats
            .Where(p => p.IsHome && p.ShotsAgainst is null)
            .Select(MapSkater).ToList();
        var homeGoalies = detail.PlayerStats
            .Where(p => p.IsHome && p.ShotsAgainst is not null)
            .Select(MapGoalie).ToList();
        var awaySkaters = detail.PlayerStats
            .Where(p => !p.IsHome && p.ShotsAgainst is null)
            .Select(MapSkater).ToList();
        var awayGoalies = detail.PlayerStats
            .Where(p => !p.IsHome && p.ShotsAgainst is not null)
            .Select(MapGoalie).ToList();

        return new GameHubPlayerStatsDto(
            new GameHubTeamPlayersDto(homeSkaters, homeGoalies),
            new GameHubTeamPlayersDto(awaySkaters, awayGoalies));
    }

    private static GameHubSkaterDto MapSkater(NhlGamePlayerStat p) => new(
        p.PlayerId, p.JerseyNumber, p.Position,
        p.Goals, p.Assists, p.Points, p.PlusMinus,
        p.Hits, p.PenaltyMinutes,
        FormatTOI(p.TimeOnIce), p.Shots);

    private static GameHubGoalieDto MapGoalie(NhlGamePlayerStat p) => new(
        p.PlayerId, p.JerseyNumber,
        p.ShotsAgainst ?? 0, p.Saves ?? 0, p.SavePct ?? 0,
        FormatTOI(p.TimeOnIce));

    private static string FormatPP(int? goals, int? opps) => $"{goals ?? 0}/{opps ?? 0}";
    private static string FormatTOI(TimeSpan ts) => $"{(int)ts.TotalMinutes}:{ts.Seconds:D2}";
}

// ── Response DTOs ──────────────────────────────────────────────────────────────

public record GameHubResponse(
    int GameId,
    int ExternalId,
    string Status,
    GameHubTeamDto HomeTeam,
    GameHubTeamDto AwayTeam,
    int HomeScore,
    int AwayScore,
    GameHubArenaDto? Arena,
    int? CurrentPeriod,
    string? PeriodTimeRemaining,
    bool IsOvertime,
    bool IsShootout,
    IReadOnlyList<GameHubPeriodScoreDto> PeriodScores,
    GameHubTeamStatsDto TeamStats,
    IReadOnlyList<GameHubEventDto> Events,
    GameHubPlayerStatsDto PlayerStats,
    DateTimeOffset DataAsOf
);

public record GameHubTeamDto(int Id, string Abbreviation, string Name, string? LogoUrl);
public record GameHubArenaDto(string Name, string? City);

public record GameHubPeriodScoreDto(
    string Period, int HomeGoals, int AwayGoals, int HomeShots, int AwayShots);

public record GameHubTeamStatsDto(
    StatPairDto ShotsOnGoal,
    StatPairDto Hits,
    StatPairStrDto PowerPlay,
    StatPairDecDto FaceoffPct,
    StatPairDto Giveaways,
    StatPairDto Takeaways
);

public record StatPairDto(int Home, int Away);
public record StatPairStrDto(string Home, string Away);
public record StatPairDecDto(decimal Home, decimal Away);

public record GameHubEventDto(
    string EventType, int Period, string GameClockTime,
    string TeamAbbreviation, string? Description,
    bool IsPowerPlay, bool IsShortHanded, bool IsEmptyNet,
    string? PenaltyType, int? PenaltyMinutes,
    decimal? CoordinateX, decimal? CoordinateY,
    string? VideoUrl
);

public record GameHubPlayerStatsDto(
    GameHubTeamPlayersDto Home, GameHubTeamPlayersDto Away);

public record GameHubTeamPlayersDto(
    IReadOnlyList<GameHubSkaterDto> Skaters,
    IReadOnlyList<GameHubGoalieDto> Goalies);

public record GameHubSkaterDto(
    int PlayerId, int JerseyNumber, string Position,
    int Goals, int Assists, int Points, int PlusMinus,
    int Hits, int PenaltyMinutes,
    string TimeOnIce, int Shots);

public record GameHubGoalieDto(
    int PlayerId, int JerseyNumber,
    int ShotsAgainst, int Saves, decimal SavePct,
    string TimeOnIce);
