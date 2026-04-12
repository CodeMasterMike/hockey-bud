using HockeyHub.Core.Models.Entities;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Data.Services.Queries;

public class ScheduleQueryService(HockeyHubDbContext db, RedisCacheService cache)
{
    public async Task<ScheduleResponse?> GetScheduleAsync(
        int leagueId, int? month, int? teamId, CancellationToken ct = default)
    {
        var season = await db.Seasons
            .Where(s => s.LeagueId == leagueId && s.IsCurrent)
            .FirstOrDefaultAsync(ct);
        if (season is null) return null;

        var cacheKey = $"schedule:{leagueId}:{month?.ToString() ?? "all"}:{teamId?.ToString() ?? "all"}";

        var months = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            var query = db.Games
                .Where(g => g.SeasonId == season.Id)
                .Include(g => g.HomeTeam)
                .Include(g => g.AwayTeam)
                .AsQueryable();

            if (teamId.HasValue)
                query = query.Where(g => g.HomeTeamId == teamId.Value || g.AwayTeamId == teamId.Value);

            if (month.HasValue)
            {
                query = query.Where(g => g.GameDateLocal.Month == month.Value);
            }

            var games = await query
                .OrderBy(g => g.GameDateLocal)
                .ThenBy(g => g.ScheduledStart)
                .ToListAsync(ct);

            return games
                .GroupBy(g => new { g.GameDateLocal.Year, g.GameDateLocal.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(monthGroup => new ScheduleMonthDto(
                    Month: monthGroup.Key.Month,
                    Year: monthGroup.Key.Year,
                    Label: new DateOnly(monthGroup.Key.Year, monthGroup.Key.Month, 1)
                        .ToString("MMMM yyyy"),
                    Days: monthGroup
                        .GroupBy(g => g.GameDateLocal)
                        .OrderBy(d => d.Key)
                        .Select(dayGroup => new ScheduleDayDto(
                            Date: dayGroup.Key.ToString("yyyy-MM-dd"),
                            Games: dayGroup.Select(g => new ScheduleGameDto(
                                GameId: g.Id,
                                ExternalId: g.ExternalId,
                                HomeTeam: new ScheduleTeamDto(g.HomeTeam.Id, g.HomeTeam.Abbreviation, g.HomeTeam.LogoUrl),
                                AwayTeam: new ScheduleTeamDto(g.AwayTeam.Id, g.AwayTeam.Abbreviation, g.AwayTeam.LogoUrl),
                                ScheduledStart: g.ScheduledStart,
                                ScheduledStartLocal: HockeyHub.Core.NhlDateHelper.FormatStartTimeEastern(g.ScheduledStart),
                                Status: g.Status,
                                HomeScore: g.HomeScore,
                                AwayScore: g.AwayScore
                            )).ToList()
                        )).ToList()
                )).ToList();
        }, RedisCacheService.ScheduleTtl, ct);

        var lastUpdated = await db.Games
            .Where(g => g.SeasonId == season.Id)
            .MaxAsync(g => (DateTimeOffset?)g.LastUpdated, ct) ?? DateTimeOffset.UtcNow;

        return new ScheduleResponse(
            Season: season.Label,
            DataAsOf: lastUpdated,
            Months: months ?? []
        );
    }
}

public record ScheduleResponse(
    string Season,
    DateTimeOffset DataAsOf,
    IReadOnlyList<ScheduleMonthDto> Months
);

public record ScheduleMonthDto(
    int Month,
    int Year,
    string Label,
    IReadOnlyList<ScheduleDayDto> Days
);

public record ScheduleDayDto(
    string Date,
    IReadOnlyList<ScheduleGameDto> Games
);

public record ScheduleGameDto(
    int GameId,
    int ExternalId,
    ScheduleTeamDto HomeTeam,
    ScheduleTeamDto AwayTeam,
    DateTimeOffset ScheduledStart,
    string ScheduledStartLocal,
    string Status,
    int? HomeScore,
    int? AwayScore
);

public record ScheduleTeamDto(
    int Id,
    string Abbreviation,
    string? LogoUrl
);
