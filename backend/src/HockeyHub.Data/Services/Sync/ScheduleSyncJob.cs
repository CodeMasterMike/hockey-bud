using HockeyHub.Core.Models.Entities;
using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HockeyHub.Data.Services.Sync;

public class ScheduleSyncJob(
    HockeyHubDbContext db,
    INhlDataProvider nhlProvider,
    RedisCacheService cache,
    ILogger<ScheduleSyncJob> logger)
{
    public async Task SyncAsync(CancellationToken ct = default)
    {
        logger.LogInformation("Syncing full season schedule");

        var league = await db.Leagues.FirstOrDefaultAsync(l => l.Abbreviation == "NHL", ct);
        if (league is null)
        {
            logger.LogError("NHL league not found in database — has DataSeed been run?");
            return;
        }

        var season = await db.Seasons
            .FirstOrDefaultAsync(s => s.LeagueId == league.Id && s.IsCurrent, ct);
        if (season is null)
        {
            logger.LogError("No current season found for NHL — has DataSeed been run?");
            return;
        }

        var scheduleGames = await nhlProvider.GetScheduleAsync("now", ct);
        if (scheduleGames.Count == 0)
        {
            logger.LogWarning("NHL API returned no schedule games");
            return;
        }

        var teams = await db.Teams
            .Where(t => t.LeagueId == league.Id)
            .ToDictionaryAsync(t => t.Abbreviation, ct);

        var existingGames = await db.Games
            .Where(g => g.SeasonId == season.Id)
            .ToDictionaryAsync(g => g.ExternalId, ct);

        var inserted = 0;
        var updated = 0;
        foreach (var sg in scheduleGames)
        {
            if (!teams.TryGetValue(sg.HomeTeamAbbreviation, out var homeTeam) ||
                !teams.TryGetValue(sg.AwayTeamAbbreviation, out var awayTeam))
            {
                logger.LogWarning("Unknown team in schedule game {GameId}: {Home} vs {Away}",
                    sg.GameId, sg.HomeTeamAbbreviation, sg.AwayTeamAbbreviation);
                continue;
            }

            if (existingGames.TryGetValue(sg.GameId, out var existing))
            {
                // Update status for games that have progressed since they were inserted
                if (existing.Status != sg.Status)
                {
                    existing.Status = sg.Status;
                    existing.ScheduledStart = sg.ScheduledStart;
                    existing.LastUpdated = DateTimeOffset.UtcNow;
                    updated++;
                }
            }
            else
            {
                db.Games.Add(new Game
                {
                    ExternalId = sg.GameId,
                    SeasonId = season.Id,
                    HomeTeamId = homeTeam.Id,
                    AwayTeamId = awayTeam.Id,
                    ScheduledStart = sg.ScheduledStart,
                    GameDateLocal = sg.GameDate,
                    Status = sg.Status,
                    LastUpdated = DateTimeOffset.UtcNow
                });
                inserted++;
            }
        }

        if (inserted > 0 || updated > 0)
        {
            await db.SaveChangesAsync(ct);

            // Bust schedule caches
            await cache.RemoveAsync($"schedule:{league.Id}", ct);
        }

        logger.LogInformation("Schedule sync complete: {Inserted} new, {Updated} updated ({Total} total in API response)",
            inserted, updated, scheduleGames.Count);
    }
}
