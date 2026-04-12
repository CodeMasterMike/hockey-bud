using HockeyHub.Core.Models.Entities;
using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HockeyHub.Data.Services.Sync;

public class TradeSyncJob(
    HockeyHubDbContext db,
    INhlDataProvider nhlProvider,
    RedisCacheService cache,
    ILogger<TradeSyncJob> logger)
{
    public async Task SyncAsync(CancellationToken ct = default)
    {
        logger.LogInformation("Syncing trades");

        var league = await db.Leagues.FirstOrDefaultAsync(l => l.Abbreviation == "NHL", ct);
        if (league is null) { logger.LogError("NHL league not found — has DataSeed been run?"); return; }

        var season = await db.Seasons
            .FirstOrDefaultAsync(s => s.LeagueId == league.Id && s.IsCurrent, ct);
        if (season is null) { logger.LogError("No current season found for NHL"); return; }

        var tradeData = await nhlProvider.GetTradesAsync("now", ct);
        if (tradeData.Count == 0)
        {
            logger.LogInformation("NHL API returned no trades");
            return;
        }

        var teams = await db.Teams
            .Where(t => t.LeagueId == league.Id)
            .ToDictionaryAsync(t => t.Abbreviation, ct);

        // Simple approach: remove existing trades for season and re-insert.
        // Trade data is small (~50-100 per season) and rarely changes retroactively.
        var existingTrades = await db.Trades
            .Where(t => t.SeasonId == season.Id)
            .Include(t => t.Assets)
            .ToListAsync(ct);

        if (existingTrades.Count > 0)
        {
            db.TradeAssets.RemoveRange(existingTrades.SelectMany(t => t.Assets));
            db.Trades.RemoveRange(existingTrades);
            await db.SaveChangesAsync(ct);
        }

        var inserted = 0;
        foreach (var td in tradeData)
        {
            var trade = new Trade
            {
                SeasonId = season.Id,
                TradeDate = td.TradeDate,
                Description = td.Description,
                LastUpdated = DateTimeOffset.UtcNow
            };

            foreach (var side in td.Sides)
            {
                if (!teams.TryGetValue(side.TeamAbbreviation, out var team))
                {
                    logger.LogWarning("Unknown team in trade: {Abbrev}", side.TeamAbbreviation);
                    continue;
                }

                foreach (var asset in side.Assets)
                {
                    trade.Assets.Add(new TradeAsset
                    {
                        TeamId = team.Id,
                        Direction = side.Direction,
                        AssetType = asset.AssetType,
                        PlayerId = asset.PlayerId,
                        PlayerName = asset.PlayerName,
                        DraftPickYear = asset.DraftPickYear,
                        DraftPickRound = asset.DraftPickRound,
                        Description = asset.Description
                    });
                }
            }

            db.Trades.Add(trade);
            inserted++;
        }

        await db.SaveChangesAsync(ct);
        await cache.RemoveAsync($"trades:{league.Id}", ct);

        logger.LogInformation("Synced {Count} trades for season {Season}", inserted, season.Label);
    }
}
