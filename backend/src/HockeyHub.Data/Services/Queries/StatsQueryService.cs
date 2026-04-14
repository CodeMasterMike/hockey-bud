using HockeyHub.Core.Models.Entities;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Data.Services.Queries;

public class StatsQueryService(HockeyHubDbContext db, RedisCacheService cache)
{
    private static readonly HashSet<string> GoalieSections = new(StringComparer.OrdinalIgnoreCase)
    {
        "all-goalies", "rookie-goalies"
    };

    private static readonly HashSet<string> AllSections = new(StringComparer.OrdinalIgnoreCase)
    {
        "all-players", "all-goalies", "all-forwards", "all-defensemen", "rookie-players", "rookie-goalies"
    };

    private const string DefaultSkaterSort = "points";
    private const string DefaultGoalieSort = "wins";

    public async Task<StatsResponse?> GetStatsAsync(
        int leagueId, string section, string? sort, string sortDir,
        int page, int pageSize, CancellationToken ct = default)
    {
        var season = await db.Seasons
            .Where(s => s.LeagueId == leagueId && s.IsCurrent)
            .FirstOrDefaultAsync(ct);
        if (season is null) return null;

        var isGoalie = GoalieSections.Contains(section);
        var effectiveSort = sort ?? (isGoalie ? DefaultGoalieSort : DefaultSkaterSort);

        // Cache the full DTO list per section (simple key, easy to invalidate).
        // Sort and pagination are applied in-memory after cache retrieval.
        var cacheKey = $"stats:{leagueId}:{section}:{season.Id}";

        if (isGoalie)
        {
            var all = await cache.GetOrSetAsync(cacheKey, async _ =>
            {
                var items = await BuildQuery(season.Id, section).ToListAsync(ct);
                return items.Select(MapToGoalieDto).ToList();
            }, RedisCacheService.StatsTtl, ct) ?? [];

            var sorted = ApplyGoalieSort(all, effectiveSort, sortDir.Equals("desc", StringComparison.OrdinalIgnoreCase));
            var paged = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            var lastUpdated = await GetLastUpdated(season.Id, ct);

            return new StatsResponse(
                Section: section,
                Season: season.Label,
                SortedBy: effectiveSort,
                Pagination: new PaginationDto(page, pageSize, all.Count, (int)Math.Ceiling((double)all.Count / pageSize)),
                DataAsOf: lastUpdated,
                Players: null,
                Goalies: paged
            );
        }
        else
        {
            var all = await cache.GetOrSetAsync(cacheKey, async _ =>
            {
                var items = await BuildQuery(season.Id, section).ToListAsync(ct);
                return items.Select(MapToSkaterDto).ToList();
            }, RedisCacheService.StatsTtl, ct) ?? [];

            var sorted = ApplySkaterSort(all, effectiveSort, sortDir.Equals("desc", StringComparison.OrdinalIgnoreCase));
            var paged = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            var lastUpdated = await GetLastUpdated(season.Id, ct);

            return new StatsResponse(
                Section: section,
                Season: season.Label,
                SortedBy: effectiveSort,
                Pagination: new PaginationDto(page, pageSize, all.Count, (int)Math.Ceiling((double)all.Count / pageSize)),
                DataAsOf: lastUpdated,
                Players: paged,
                Goalies: null
            );
        }
    }

    public bool IsValidSection(string section) => AllSections.Contains(section);

    private IQueryable<PlayerSeason> BuildQuery(int seasonId, string section)
    {
        var query = db.PlayerSeasons
            .Where(ps => ps.SeasonId == seasonId && ps.LeagueAbbreviation == "NHL")
            .Include(ps => ps.Player)
            .Include(ps => ps.Team);

        return section.ToLowerInvariant() switch
        {
            "all-players" => query.Where(ps => ps.Player.Position != "G"),
            "all-goalies" => query.Where(ps => ps.Player.Position == "G"),
            "all-forwards" => query.Where(ps =>
                ps.Player.Position == "C" || ps.Player.Position == "L" ||
                ps.Player.Position == "R" || ps.Player.Position == "LW" ||
                ps.Player.Position == "RW"),
            "all-defensemen" => query.Where(ps =>
                ps.Player.Position == "D" || ps.Player.Position == "LD" ||
                ps.Player.Position == "RD"),
            "rookie-players" => query.Where(ps =>
                ps.Player.Position != "G" && ps.GamesPlayed <= 25),
            "rookie-goalies" => query.Where(ps =>
                ps.Player.Position == "G" && ps.GamesPlayed <= 25),
            _ => query
        };
    }

    private async Task<DateTimeOffset> GetLastUpdated(int seasonId, CancellationToken ct)
    {
        return await db.PlayerSeasons
            .Where(ps => ps.SeasonId == seasonId && ps.LeagueAbbreviation == "NHL")
            .MaxAsync(ps => (DateTimeOffset?)ps.LastUpdated, ct) ?? DateTimeOffset.UtcNow;
    }

    // ── In-memory sorting ────────────────────────────────────────────

    private static List<SkaterStatsDto> ApplySkaterSort(List<SkaterStatsDto> list, string sort, bool desc)
    {
        Func<SkaterStatsDto, object?> selector = sort.ToLowerInvariant() switch
        {
            "name" => s => s.Name,
            "team" => s => s.TeamAbbreviation,
            "gamesplayed" or "gp" => s => s.GamesPlayed,
            "goals" => s => s.Goals,
            "assists" => s => s.Assists,
            "points" => s => s.Points,
            "plusminus" => s => s.PlusMinus,
            "hits" => s => s.Hits,
            "penaltyminutes" or "pim" => s => s.PenaltyMinutes,
            "timeonice" or "toi" => s => s.TimeOnIcePerGame,
            "shots" => s => s.Shots,
            "shootingpct" => s => s.ShootingPct,
            "blockedshots" => s => s.BlockedShots,
            "evenstrengthpoints" or "evp" => s => s.EvenStrengthPoints,
            "powerplaypoints" or "ppp" => s => s.PowerPlayPoints,
            "shorthandedpoints" or "shp" => s => s.ShortHandedPoints,
            "giveaways" => s => s.Giveaways,
            "takeaways" => s => s.Takeaways,
            "faceoffpct" => s => s.FaceoffPct,
            _ => s => s.Points
        };

        return desc
            ? [.. list.OrderByDescending(selector)]
            : [.. list.OrderBy(selector)];
    }

    private static List<GoalieStatsDto> ApplyGoalieSort(List<GoalieStatsDto> list, string sort, bool desc)
    {
        Func<GoalieStatsDto, object?> selector = sort.ToLowerInvariant() switch
        {
            "name" => g => g.Name,
            "team" => g => g.TeamAbbreviation,
            "gamesplayed" or "gp" => g => g.GamesPlayed,
            "gamesstarted" or "gs" => g => g.GamesStarted,
            "wins" => g => g.Wins,
            "losses" => g => g.Losses,
            "overtimelosses" or "otl" => g => g.OvertimeLosses,
            "savepct" or "sv%" => g => g.SavePct,
            // GAA: "desc" (best first) means lowest value first
            "goalsagainstavg" or "gaa" => g => g.GoalsAgainstAvg,
            "shotsagainst" => g => g.ShotsAgainst,
            "saves" => g => g.Saves,
            "goalsagainst" or "ga" => g => g.GoalsAgainst,
            "goals" => g => g.Goals,
            "assists" => g => g.Assists,
            _ => g => g.Wins
        };

        // GAA is inverted: "desc" (best first) = lowest GAA
        var invertGaa = sort.Equals("goalsagainstavg", StringComparison.OrdinalIgnoreCase)
            || sort.Equals("gaa", StringComparison.OrdinalIgnoreCase);

        var effectiveDesc = invertGaa ? !desc : desc;

        return effectiveDesc
            ? [.. list.OrderByDescending(selector)]
            : [.. list.OrderBy(selector)];
    }

    // ── Mapping ──────────────────────────────────────────────────────

    private static SkaterStatsDto MapToSkaterDto(PlayerSeason ps) => new(
        PlayerId: int.Parse(ps.Player.ExternalId),
        Name: $"{ps.Player.FirstName} {ps.Player.LastName}",
        TeamId: ps.TeamId,
        TeamAbbreviation: ps.Team.Abbreviation,
        TeamLogoUrl: ps.Team.LogoUrl,
        Position: ps.Player.Position,
        GamesPlayed: ps.GamesPlayed,
        Goals: ps.Goals,
        Assists: ps.Assists,
        Points: ps.Points,
        PlusMinus: ps.PlusMinus,
        Hits: ps.Hits,
        PenaltyMinutes: ps.PenaltyMinutes,
        TimeOnIcePerGame: ps.TimeOnIcePerGame,
        Shots: ps.Shots,
        ShootingPct: ps.ShootingPct,
        BlockedShots: ps.BlockedShots,
        EvenStrengthPoints: ps.EvenStrengthPoints,
        PowerPlayPoints: ps.PowerPlayPoints,
        ShortHandedPoints: ps.ShortHandedPoints,
        Giveaways: ps.Giveaways,
        Takeaways: ps.Takeaways,
        FaceoffPct: ps.FaceoffPct
    );

    private static GoalieStatsDto MapToGoalieDto(PlayerSeason ps) => new(
        PlayerId: int.Parse(ps.Player.ExternalId),
        Name: $"{ps.Player.FirstName} {ps.Player.LastName}",
        TeamId: ps.TeamId,
        TeamAbbreviation: ps.Team.Abbreviation,
        TeamLogoUrl: ps.Team.LogoUrl,
        GamesPlayed: ps.GamesPlayed,
        GamesStarted: ps.GamesStarted,
        Wins: ps.Wins ?? 0,
        Losses: ps.Losses ?? 0,
        OvertimeLosses: ps.OvertimeLosses ?? 0,
        SavePct: ps.SavePct ?? 0,
        GoalsAgainstAvg: ps.GoalsAgainstAvg ?? 0,
        ShotsAgainst: ps.ShotsAgainst ?? 0,
        Saves: ps.Saves ?? 0,
        GoalsAgainst: ps.GoalsAgainst ?? 0,
        Goals: ps.GoalieGoals ?? 0,
        Assists: ps.GoalieAssists ?? 0
    );
}

// ── Response DTOs ────────────────────────────────────────────────

public record StatsResponse(
    string Section,
    string Season,
    string SortedBy,
    PaginationDto Pagination,
    DateTimeOffset DataAsOf,
    IReadOnlyList<SkaterStatsDto>? Players,
    IReadOnlyList<GoalieStatsDto>? Goalies
);

public record PaginationDto(
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages
);

public record SkaterStatsDto(
    int PlayerId,
    string Name,
    int TeamId,
    string TeamAbbreviation,
    string? TeamLogoUrl,
    string Position,
    int GamesPlayed,
    int Goals,
    int Assists,
    int Points,
    int PlusMinus,
    int? Hits,
    int PenaltyMinutes,
    decimal? TimeOnIcePerGame,
    int? Shots,
    decimal? ShootingPct,
    int? BlockedShots,
    int? EvenStrengthPoints,
    int? PowerPlayPoints,
    int? ShortHandedPoints,
    int? Giveaways,
    int? Takeaways,
    decimal? FaceoffPct
);

public record GoalieStatsDto(
    int PlayerId,
    string Name,
    int TeamId,
    string TeamAbbreviation,
    string? TeamLogoUrl,
    int GamesPlayed,
    int? GamesStarted,
    int Wins,
    int Losses,
    int OvertimeLosses,
    decimal SavePct,
    decimal GoalsAgainstAvg,
    int ShotsAgainst,
    int Saves,
    int GoalsAgainst,
    int Goals,
    int Assists
);
