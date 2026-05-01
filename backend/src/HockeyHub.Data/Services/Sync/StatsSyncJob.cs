using HockeyHub.Core.Models.Entities;
using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HockeyHub.Data.Services.Sync;

public class StatsSyncJob(
    HockeyHubDbContext db,
    INhlDataProvider nhlProvider,
    RedisCacheService cache,
    ILogger<StatsSyncJob> logger)
{
    private static readonly string[] Sections =
        ["all-players", "all-goalies", "all-forwards", "all-defensemen", "rookie-players", "rookie-goalies"];

    public async Task SyncAsync(CancellationToken ct = default)
    {
        logger.LogInformation("Syncing player season stats");

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

        var seasonLabel = $"{season.YearStart}{season.YearEnd}";

        // Fetch skater and goalie stats in sequence (rate limiting handles pacing)
        var skaterStats = await nhlProvider.GetSkaterStatsAsync(seasonLabel, ct);
        var goalieStats = await nhlProvider.GetGoalieStatsAsync(seasonLabel, ct);

        if (skaterStats.Count == 0 && goalieStats.Count == 0)
        {
            logger.LogWarning("NHL API returned no player stats");
            return;
        }

        // Build lookups
        var teams = await db.Teams
            .Where(t => t.LeagueId == league.Id)
            .ToDictionaryAsync(t => t.Abbreviation, ct);

        var players = await db.Players
            .Where(p => p.IsActive)
            .ToDictionaryAsync(p => p.ExternalId, ct);

        // Composite key: a player traded mid-season has separate entries per team
        var existing = await db.PlayerSeasons
            .Where(ps => ps.SeasonId == season.Id && ps.LeagueAbbreviation == "NHL")
            .ToDictionaryAsync(ps => (ps.PlayerId, ps.TeamId), ct);

        var synced = 0;

        // ── Sync skater stats ────────────────────────────────────────
        foreach (var stat in skaterStats)
        {
            var externalId = stat.PlayerId.ToString();
            if (!players.TryGetValue(externalId, out var player)) continue;
            if (!teams.TryGetValue(stat.TeamAbbreviation, out var team)) continue;

            // Update player position if it has changed
            if (player.Position != stat.PositionCode)
                player.Position = stat.PositionCode;

            var key = (player.Id, team.Id);
            if (existing.TryGetValue(key, out var ps))
            {
                ps.GamesPlayed = stat.GamesPlayed;
                ps.Goals = stat.Goals;
                ps.Assists = stat.Assists;
                ps.Points = stat.Points;
                ps.PlusMinus = stat.PlusMinus;
                ps.PenaltyMinutes = stat.PenaltyMinutes;
                ps.Hits = stat.Hits;
                ps.TimeOnIcePerGame = stat.TimeOnIcePerGame;
                ps.Shots = stat.Shots;
                ps.ShootingPct = stat.ShootingPct;
                ps.BlockedShots = stat.BlockedShots;
                ps.EvenStrengthPoints = stat.EvenStrengthPoints;
                ps.PowerPlayPoints = stat.PowerPlayPoints;
                ps.ShortHandedPoints = stat.ShortHandedPoints;
                ps.Giveaways = stat.Giveaways;
                ps.Takeaways = stat.Takeaways;
                ps.FaceoffPct = stat.FaceoffPct;
                ps.IsRookie = stat.IsRookie;
                ps.LastUpdated = DateTimeOffset.UtcNow;
            }
            else
            {
                var newPs = new PlayerSeason
                {
                    PlayerId = player.Id,
                    TeamId = team.Id,
                    SeasonId = season.Id,
                    LeagueAbbreviation = "NHL",
                    Era = season.Era,
                    GamesPlayed = stat.GamesPlayed,
                    Goals = stat.Goals,
                    Assists = stat.Assists,
                    Points = stat.Points,
                    PlusMinus = stat.PlusMinus,
                    PenaltyMinutes = stat.PenaltyMinutes,
                    Hits = stat.Hits,
                    TimeOnIcePerGame = stat.TimeOnIcePerGame,
                    Shots = stat.Shots,
                    ShootingPct = stat.ShootingPct,
                    BlockedShots = stat.BlockedShots,
                    EvenStrengthPoints = stat.EvenStrengthPoints,
                    PowerPlayPoints = stat.PowerPlayPoints,
                    ShortHandedPoints = stat.ShortHandedPoints,
                    Giveaways = stat.Giveaways,
                    Takeaways = stat.Takeaways,
                    FaceoffPct = stat.FaceoffPct,
                    IsRookie = stat.IsRookie,
                    LastUpdated = DateTimeOffset.UtcNow
                };
                db.PlayerSeasons.Add(newPs);
                existing[key] = newPs;
            }
            synced++;
        }

        // ── Sync goalie stats ────────────────────────────────────────
        foreach (var stat in goalieStats)
        {
            var externalId = stat.PlayerId.ToString();
            if (!players.TryGetValue(externalId, out var player)) continue;
            if (!teams.TryGetValue(stat.TeamAbbreviation, out var team)) continue;

            if (player.Position != "G")
                player.Position = "G";

            var key = (player.Id, team.Id);
            if (existing.TryGetValue(key, out var ps))
            {
                ps.GamesPlayed = stat.GamesPlayed;
                ps.GamesStarted = stat.GamesStarted;
                ps.Wins = stat.Wins;
                ps.Losses = stat.Losses;
                ps.OvertimeLosses = stat.OvertimeLosses;
                ps.SavePct = stat.SavePct;
                ps.GoalsAgainstAvg = stat.GoalsAgainstAvg;
                ps.ShotsAgainst = stat.ShotsAgainst;
                ps.Saves = stat.Saves;
                ps.GoalsAgainst = stat.GoalsAgainst;
                ps.GoalieGoals = stat.Goals;
                ps.GoalieAssists = stat.Assists;
                ps.Goals = stat.Goals;
                ps.Assists = stat.Assists;
                ps.Points = stat.Goals + stat.Assists;
                ps.IsRookie = stat.IsRookie;
                ps.LastUpdated = DateTimeOffset.UtcNow;
            }
            else
            {
                var newPs = new PlayerSeason
                {
                    PlayerId = player.Id,
                    TeamId = team.Id,
                    SeasonId = season.Id,
                    LeagueAbbreviation = "NHL",
                    Era = season.Era,
                    GamesPlayed = stat.GamesPlayed,
                    GamesStarted = stat.GamesStarted,
                    Wins = stat.Wins,
                    Losses = stat.Losses,
                    OvertimeLosses = stat.OvertimeLosses,
                    SavePct = stat.SavePct,
                    GoalsAgainstAvg = stat.GoalsAgainstAvg,
                    ShotsAgainst = stat.ShotsAgainst,
                    Saves = stat.Saves,
                    GoalsAgainst = stat.GoalsAgainst,
                    GoalieGoals = stat.Goals,
                    GoalieAssists = stat.Assists,
                    Goals = stat.Goals,
                    Assists = stat.Assists,
                    Points = stat.Goals + stat.Assists,
                    IsRookie = stat.IsRookie,
                    LastUpdated = DateTimeOffset.UtcNow
                };
                db.PlayerSeasons.Add(newPs);
                existing[key] = newPs;
            }
            synced++;
        }

        await db.SaveChangesAsync(ct);

        // Invalidate all section caches (one key per section)
        foreach (var section in Sections)
            await cache.RemoveAsync($"stats:{league.Id}:{section}:{season.Id}", ct);

        logger.LogInformation("Synced stats for {Count} players", synced);
    }
}
