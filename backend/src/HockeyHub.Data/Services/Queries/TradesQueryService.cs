using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Data.Services.Queries;

public class TradesQueryService(HockeyHubDbContext db, RedisCacheService cache)
{
    public async Task<TradesListResponse?> GetTradesAsync(
        int leagueId, int? teamId, CancellationToken ct = default)
    {
        var season = await db.Seasons
            .Where(s => s.LeagueId == leagueId && s.IsCurrent)
            .FirstOrDefaultAsync(ct);
        if (season is null) return null;

        var cacheKey = $"trades:{leagueId}:{teamId?.ToString() ?? "all"}";

        var trades = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            var query = db.Trades
                .Where(t => t.SeasonId == season.Id)
                .Include(t => t.Assets).ThenInclude(a => a.Team)
                .OrderByDescending(t => t.TradeDate)
                .AsQueryable();

            if (teamId.HasValue)
                query = query.Where(t => t.Assets.Any(a => a.TeamId == teamId.Value));

            var tradeEntities = await query.ToListAsync(ct);

            return tradeEntities.Select(t =>
            {
                var sides = t.Assets
                    .GroupBy(a => a.TeamId)
                    .Select(g =>
                    {
                        var team = g.First().Team;
                        return new TradeSideDto(
                            TeamId: team.Id,
                            TeamAbbreviation: team.Abbreviation,
                            TeamName: $"{team.LocationName} {team.Name}",
                            TeamLogoUrl: team.LogoUrl,
                            Acquired: g.Where(a => a.Direction == "Acquired")
                                .Select(a => new TradeAssetDto(a.AssetType, a.PlayerId, a.PlayerName, a.Description))
                                .ToList(),
                            Traded: g.Where(a => a.Direction == "Traded")
                                .Select(a => new TradeAssetDto(a.AssetType, a.PlayerId, a.PlayerName, a.Description))
                                .ToList()
                        );
                    }).ToList();

                return new TradeDto(
                    t.Id,
                    t.TradeDate.ToString("yyyy-MM-dd"),
                    t.TradeDate.ToString("MM/dd/yyyy"),
                    t.Description,
                    sides
                );
            }).ToList();
        }, TimeSpan.FromHours(3), ct);

        var lastUpdated = await db.Trades
            .Where(t => t.SeasonId == season.Id)
            .MaxAsync(t => (DateTimeOffset?)t.LastUpdated, ct) ?? DateTimeOffset.UtcNow;

        return new TradesListResponse(
            Season: season.Label,
            DataAsOf: lastUpdated,
            Trades: trades ?? []
        );
    }
}

public record TradesListResponse(
    string Season,
    DateTimeOffset DataAsOf,
    IReadOnlyList<TradeDto> Trades
);

public record TradeDto(
    int Id,
    string TradeDate,
    string TradeDateDisplay,
    string? Description,
    IReadOnlyList<TradeSideDto> Sides
);

public record TradeSideDto(
    int TeamId,
    string TeamAbbreviation,
    string TeamName,
    string? TeamLogoUrl,
    IReadOnlyList<TradeAssetDto> Acquired,
    IReadOnlyList<TradeAssetDto> Traded
);

public record TradeAssetDto(
    string AssetType,
    int? PlayerId,
    string? PlayerName,
    string? Description
);
