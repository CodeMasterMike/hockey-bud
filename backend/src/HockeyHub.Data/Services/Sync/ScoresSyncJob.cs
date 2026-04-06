using HockeyHub.Core.Models.Entities;
using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HockeyHub.Data.Services.Sync;

public class ScoresSyncJob(
    HockeyHubDbContext db,
    INhlDataProvider nhlProvider,
    RedisCacheService cache,
    IScoreBroadcaster broadcaster,
    ILogger<ScoresSyncJob> logger)
{
    public async Task SyncAsync(CancellationToken ct = default)
    {
        var today = HockeyHub.Core.NhlDateHelper.GetCurrentGameDay();
        logger.LogInformation("Syncing scores for {Date}", today);

        var nhlGames = await nhlProvider.GetScoresAsync(today, ct);
        if (nhlGames.Count == 0)
        {
            logger.LogInformation("No games found for {Date}, skipping sync", today);
            return;
        }

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

        var teams = await db.Teams
            .Where(t => t.LeagueId == league.Id)
            .ToDictionaryAsync(t => t.Abbreviation, ct);

        var existingGames = await db.Games
            .Where(g => g.GameDateLocal == today && g.Season.LeagueId == league.Id)
            .ToDictionaryAsync(g => g.ExternalId, ct);

        foreach (var nhlGame in nhlGames)
        {
            if (!teams.TryGetValue(nhlGame.HomeTeamAbbreviation, out var homeTeam) ||
                !teams.TryGetValue(nhlGame.AwayTeamAbbreviation, out var awayTeam))
            {
                logger.LogWarning("Unknown team in game {GameId}: {Home} vs {Away}",
                    nhlGame.Id, nhlGame.HomeTeamAbbreviation, nhlGame.AwayTeamAbbreviation);
                continue;
            }

            if (existingGames.TryGetValue(nhlGame.Id, out var existing))
            {
                UpdateGame(existing, nhlGame);
            }
            else
            {
                var game = new Game
                {
                    ExternalId = nhlGame.Id,
                    SeasonId = season.Id,
                    HomeTeamId = homeTeam.Id,
                    AwayTeamId = awayTeam.Id,
                    ScheduledStart = nhlGame.ScheduledStart,
                    GameDateLocal = today,
                    Status = nhlGame.Status,
                    HomeScore = nhlGame.HomeScore,
                    AwayScore = nhlGame.AwayScore,
                    HomeShotsOnGoal = nhlGame.HomeShotsOnGoal,
                    AwayShotsOnGoal = nhlGame.AwayShotsOnGoal,
                    CurrentPeriod = nhlGame.CurrentPeriod,
                    CurrentPeriodLabel = nhlGame.CurrentPeriodLabel,
                    PeriodTimeRemaining = nhlGame.PeriodTimeRemaining,
                    PeriodTimeRemainingSeconds = nhlGame.PeriodTimeRemainingSeconds,
                    ClockRunning = nhlGame.ClockRunning,
                    ClockLastSyncedAt = DateTimeOffset.UtcNow,
                    IsOvertime = nhlGame.IsOvertime,
                    IsShootout = nhlGame.IsShootout,
                    LastUpdated = DateTimeOffset.UtcNow
                };
                db.Games.Add(game);
            }
        }

        await db.SaveChangesAsync(ct);

        // Sync detail data for live games
        var liveGames = nhlGames.Where(g => g.Status == "Live").ToList();
        foreach (var liveGame in liveGames)
        {
            await SyncGameDetailAsync(liveGame.Id, ct);
        }

        // Broadcast live updates via SignalR
        foreach (var game in nhlGames.Where(g => g.Status == "Live"))
        {
            await broadcaster.BroadcastScoreUpdateAsync(
                game.Id, game.HomeScore ?? 0, game.AwayScore ?? 0, game.Status, ct);

            await broadcaster.BroadcastClockSyncAsync(
                game.Id, game.CurrentPeriod ?? 0,
                (game.PeriodTimeRemainingSeconds ?? 0) * 1000,
                game.ClockRunning, ct);
        }

        // Invalidate cache
        await cache.RemoveAsync($"scores:{league.Id}:{today:yyyy-MM-dd}", ct);
        await cache.RemoveAsync($"scores:ticker:{league.Id}", ct);
        await cache.RemoveAsync("scores:live", ct);

        logger.LogInformation("Synced {Count} games, {LiveCount} live", nhlGames.Count, liveGames.Count);
    }

    private async Task SyncGameDetailAsync(int externalGameId, CancellationToken ct)
    {
        var detail = await nhlProvider.GetGameDetailAsync(externalGameId, ct);
        if (detail is null) return;

        var game = await db.Games
            .Include(g => g.PeriodScores)
            .FirstOrDefaultAsync(g => g.ExternalId == externalGameId, ct);
        if (game is null) return;

        // Update period scores
        foreach (var ps in detail.PeriodScores)
        {
            var existingPeriod = game.PeriodScores.FirstOrDefault(p => p.Period == ps.Period);
            if (existingPeriod is not null)
            {
                existingPeriod.HomeGoals = ps.HomeGoals;
                existingPeriod.AwayGoals = ps.AwayGoals;
                existingPeriod.HomeShots = ps.HomeShots;
                existingPeriod.AwayShots = ps.AwayShots;
            }
            else
            {
                game.PeriodScores.Add(new GamePeriodScore
                {
                    GameId = game.Id,
                    Period = ps.Period,
                    PeriodLabel = ps.PeriodLabel switch
                    {
                        "REG" => ps.Period switch { 1 => "1st", 2 => "2nd", 3 => "3rd", _ => $"{ps.Period}th" },
                        "OT" => ps.Period == 4 ? "OT" : $"{ps.Period - 3}OT",
                        "SO" => "SO",
                        _ => ps.PeriodLabel
                    },
                    HomeGoals = ps.HomeGoals,
                    AwayGoals = ps.AwayGoals,
                    HomeShots = ps.HomeShots,
                    AwayShots = ps.AwayShots
                });
            }
        }

        // Update team stats from detail
        game.HomePowerPlayGoals = detail.HomeStats.PowerPlayGoals;
        game.HomePowerPlayOpps = detail.HomeStats.PowerPlayOpps;
        game.AwayPowerPlayGoals = detail.AwayStats.PowerPlayGoals;
        game.AwayPowerPlayOpps = detail.AwayStats.PowerPlayOpps;
        game.HomeHits = detail.HomeStats.Hits;
        game.AwayHits = detail.AwayStats.Hits;
        game.HomeFaceoffPct = detail.HomeStats.FaceoffPct;
        game.AwayFaceoffPct = detail.AwayStats.FaceoffPct;
        game.HomeTakeaways = detail.HomeStats.Takeaways;
        game.AwayTakeaways = detail.AwayStats.Takeaways;
        game.HomeGiveaways = detail.HomeStats.Giveaways;
        game.AwayGiveaways = detail.AwayStats.Giveaways;
        game.HomeTimeOnAttack = detail.HomeStats.TimeOnAttack;
        game.AwayTimeOnAttack = detail.AwayStats.TimeOnAttack;

        await db.SaveChangesAsync(ct);

        // Invalidate expanded cache
        await cache.RemoveAsync($"scores:expanded:{game.Id}", ct);
    }

    private static void UpdateGame(Game game, NhlGameData data)
    {
        game.Status = data.Status;
        game.HomeScore = data.HomeScore;
        game.AwayScore = data.AwayScore;
        game.HomeShotsOnGoal = data.HomeShotsOnGoal;
        game.AwayShotsOnGoal = data.AwayShotsOnGoal;
        game.CurrentPeriod = data.CurrentPeriod;
        game.CurrentPeriodLabel = data.CurrentPeriodLabel;
        game.PeriodTimeRemaining = data.PeriodTimeRemaining;
        game.PeriodTimeRemainingSeconds = data.PeriodTimeRemainingSeconds;
        game.ClockRunning = data.ClockRunning;
        game.ClockLastSyncedAt = DateTimeOffset.UtcNow;
        game.IsOvertime = data.IsOvertime;
        game.IsShootout = data.IsShootout;
        game.LastUpdated = DateTimeOffset.UtcNow;
    }
}
