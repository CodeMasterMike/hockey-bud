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
            Events: await BuildEvents(detail, db, ct),
            PlayerStats: BuildPlayerStats(detail),
            DataAsOf: game.LastUpdated
        );
    }

    private static async Task<IReadOnlyList<GameHubEventDto>> BuildEvents(
        NhlGameDetailData? detail, HockeyHubDbContext db, CancellationToken ct)
    {
        if (detail is null || detail.Events.Count == 0) return [];

        // Collect all referenced player external IDs
        var playerIds = detail.Events
            .SelectMany(e => new[] { e.PrimaryPlayerId, e.SecondaryPlayerId, e.TertiaryPlayerId })
            .Where(id => id.HasValue)
            .Select(id => id!.Value.ToString())
            .Distinct()
            .ToList();

        // Look up player names from DB by external ID
        var players = playerIds.Count > 0
            ? await db.Players
                .Where(p => playerIds.Contains(p.ExternalId))
                .Select(p => new { p.ExternalId, p.FirstName, p.LastName, p.JerseyNumber })
                .ToDictionaryAsync(p => p.ExternalId, ct)
            : [];

        string PlayerName(int? id)
        {
            if (id is null) return "";
            return players.TryGetValue(id.Value.ToString(), out var p)
                ? $"{p.FirstName[0]}. {p.LastName}"
                : "";
        }

        string PlayerNameWithNumber(int? id)
        {
            if (id is null) return "";
            if (!players.TryGetValue(id.Value.ToString(), out var p)) return "";
            var num = p.JerseyNumber.HasValue ? $"#{p.JerseyNumber} " : "";
            return $"{num}{p.FirstName[0]}. {p.LastName}";
        }

        return detail.Events.Select(e =>
        {
            string? description;
            string? penaltyType = null;

            if (e.EventType == "Goal")
            {
                var scorer = PlayerName(e.PrimaryPlayerId);
                var assists = new[] { PlayerName(e.SecondaryPlayerId), PlayerName(e.TertiaryPlayerId) }
                    .Where(n => n.Length > 0).ToList();
                description = scorer.Length > 0 ? scorer : e.Description;
                if (assists.Count > 0)
                    description += $" ({string.Join(", ", assists)})";
                else if (scorer.Length > 0)
                    description += " (unassisted)";
            }
            else if (e.EventType == "Penalty")
            {
                var player = PlayerNameWithNumber(e.PrimaryPlayerId);
                penaltyType = FormatPenaltyDesc(e.Description);
                description = player.Length > 0 ? player : null;
            }
            else
            {
                description = e.Description;
            }

            return new GameHubEventDto(
                e.EventType, e.Period, e.GameClockTime,
                e.TeamAbbreviation, description,
                e.IsPowerPlay, e.IsShortHanded, e.IsEmptyNet,
                penaltyType, e.PenaltyMinutes,
                e.CoordinateX, e.CoordinateY, e.VideoUrl);
        }).ToList();
    }

    /// <summary>Converts descKey like "high-sticking" to "High sticking".</summary>
    private static string? FormatPenaltyDesc(string? descKey)
    {
        if (string.IsNullOrEmpty(descKey)) return null;
        var formatted = descKey.Replace('-', ' ');
        return char.ToUpper(formatted[0]) + formatted[1..];
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
