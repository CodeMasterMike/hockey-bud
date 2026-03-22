using HockeyHub.Core.Models.Entities;
using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HockeyHub.Data.Services.Sync;

public class StandingsSyncJob(
    HockeyHubDbContext db,
    INhlDataProvider nhlProvider,
    RedisCacheService cache,
    ILogger<StandingsSyncJob> logger)
{
    public async Task SyncAsync(CancellationToken ct = default)
    {
        logger.LogInformation("Syncing standings");

        var league = await db.Leagues.FirstOrDefaultAsync(l => l.Abbreviation == "NHL", ct);
        if (league is null) return;

        var season = await db.Seasons
            .FirstOrDefaultAsync(s => s.LeagueId == league.Id && s.IsCurrent, ct);
        if (season is null) return;

        var entries = await nhlProvider.GetStandingsAsync("now", ct);
        if (entries.Count == 0) return;

        var teams = await db.Teams
            .Where(t => t.LeagueId == league.Id)
            .ToDictionaryAsync(t => t.Abbreviation, ct);

        var existing = await db.StandingsSnapshots
            .Where(s => s.SeasonId == season.Id)
            .ToDictionaryAsync(s => s.TeamId, ct);

        // Calculate league ranks by points (descending), then points pct
        var ranked = entries
            .OrderByDescending(e => e.Points)
            .ThenByDescending(e => e.PointsPct)
            .ThenByDescending(e => e.RegulationWins)
            .Select((e, i) => (Entry: e, Rank: i + 1))
            .ToList();

        foreach (var (entry, rank) in ranked)
        {
            if (!teams.TryGetValue(entry.TeamAbbreviation, out var team))
            {
                logger.LogWarning("Unknown team in standings: {Abbrev}", entry.TeamAbbreviation);
                continue;
            }

            if (existing.TryGetValue(team.Id, out var snapshot))
            {
                snapshot.Division = entry.Division;
                snapshot.Conference = entry.Conference;
                snapshot.GamesPlayed = entry.GamesPlayed;
                snapshot.Wins = entry.Wins;
                snapshot.Losses = entry.Losses;
                snapshot.OvertimeLosses = entry.OvertimeLosses;
                snapshot.Points = entry.Points;
                snapshot.PointsPct = entry.PointsPct;
                snapshot.RegulationWins = entry.RegulationWins;
                snapshot.RegulationPlusOTWins = entry.RegulationPlusOTWins;
                snapshot.GoalsFor = entry.GoalsFor;
                snapshot.GoalsAgainst = entry.GoalsAgainst;
                snapshot.PowerPlayPct = entry.PowerPlayPct;
                snapshot.PenaltyKillPct = entry.PenaltyKillPct;
                snapshot.FaceoffPct = entry.FaceoffPct;
                snapshot.LeagueRank = rank;
                snapshot.LastUpdated = DateTimeOffset.UtcNow;
            }
            else
            {
                db.StandingsSnapshots.Add(new StandingsSnapshot
                {
                    TeamId = team.Id,
                    SeasonId = season.Id,
                    Division = entry.Division,
                    Conference = entry.Conference,
                    GamesPlayed = entry.GamesPlayed,
                    Wins = entry.Wins,
                    Losses = entry.Losses,
                    OvertimeLosses = entry.OvertimeLosses,
                    Points = entry.Points,
                    PointsPct = entry.PointsPct,
                    RegulationWins = entry.RegulationWins,
                    RegulationPlusOTWins = entry.RegulationPlusOTWins,
                    GoalsFor = entry.GoalsFor,
                    GoalsAgainst = entry.GoalsAgainst,
                    PowerPlayPct = entry.PowerPlayPct,
                    PenaltyKillPct = entry.PenaltyKillPct,
                    FaceoffPct = entry.FaceoffPct,
                    LeagueRank = rank,
                    LastUpdated = DateTimeOffset.UtcNow
                });
            }
        }

        await db.SaveChangesAsync(ct);

        // Invalidate scores caches that embed standings data (record, rank, pointsPct)
        var today = HockeyHub.Core.NhlDateHelper.GetCurrentGameDay();
        await cache.RemoveAsync($"scores:{league.Id}:{today:yyyy-MM-dd}", ct);
        await cache.RemoveAsync($"scores:ticker:{league.Id}", ct);

        logger.LogInformation("Synced standings for {Count} teams", ranked.Count);
    }
}
