using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Data.Services.Queries;

public class SeasonModeService(HockeyHubDbContext db, RedisCacheService cache)
{
    public async Task<SeasonModeResponse> GetCurrentModeAsync(int leagueId, CancellationToken ct = default)
    {
        var cacheKey = $"seasonmode:{leagueId}";
        return await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            return await ComputeModeAsync(leagueId, ct);
        }, TimeSpan.FromHours(1), ct);
    }

    private async Task<SeasonModeResponse> ComputeModeAsync(int leagueId, CancellationToken ct)
    {
        var season = await db.Seasons
            .Where(s => s.LeagueId == leagueId && s.IsCurrent)
            .FirstOrDefaultAsync(ct);

        if (season is null)
            return new SeasonModeResponse("off-season", "", null, false, false);

        var seasonLabel = $"{season.YearStart}{season.YearEnd}";

        // Find the last regular-season game date (non-playoff games have external IDs starting with YYYY02)
        var lastRegularSeasonGame = await db.Games
            .Where(g => g.Season.LeagueId == leagueId && g.SeasonId == season.Id)
            .Where(g => g.Status == "Final" || g.Status == "Final/OT" || g.Status == "Final/SO")
            .OrderByDescending(g => g.ScheduledStart)
            .Select(g => g.ScheduledStart)
            .FirstOrDefaultAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var regularSeasonEnd = lastRegularSeasonGame != default
            ? DateOnly.FromDateTime(lastRegularSeasonGame.DateTime)
            : (DateOnly?)null;

        // Count total games played to estimate if regular season is complete
        // NHL regular season: 82 games per team * 32 teams / 2 = 1312 total games
        var totalFinalGames = await db.Games
            .Where(g => g.SeasonId == season.Id)
            .Where(g => g.Status == "Final" || g.Status == "Final/OT" || g.Status == "Final/SO")
            .CountAsync(ct);

        var hasLiveOrScheduledGames = await db.Games
            .Where(g => g.SeasonId == season.Id)
            .Where(g => g.Status == "Live" || g.Status == "Scheduled" || g.Status == "Pre-Game")
            .AnyAsync(ct);

        // Regular season is ~1312 games; if we have >1200 final games and no upcoming ones, it's likely over
        var regularSeasonLikelyOver = totalFinalGames > 1200 && !hasLiveOrScheduledGames;

        // Also check if we're past the regularSeasonEnd date
        var pastRegularSeasonEnd = regularSeasonEnd is not null && today > regularSeasonEnd.Value;

        if (!regularSeasonLikelyOver && !pastRegularSeasonEnd && hasLiveOrScheduledGames)
        {
            return new SeasonModeResponse("regular-season", seasonLabel, regularSeasonEnd, false, false);
        }

        // Regular season is over — determine if we're in playoffs or off-season
        if (regularSeasonEnd is not null)
        {
            // Simple heuristic: if the season ended months ago, it's off-season
            if (regularSeasonEnd.Value.AddMonths(3) < today)
            {
                return new SeasonModeResponse("off-season", seasonLabel, regularSeasonEnd, false, true);
            }

            // Check if there are any playoff games (they'd be scheduled or live after regular season ends)
            var hasPlayoffActivity = await db.Games
                .Where(g => g.SeasonId == season.Id)
                .Where(g => g.ScheduledStart > lastRegularSeasonGame)
                .AnyAsync(ct);

            // Between regular season end and playoffs: report playoffs mode
            // so the nav can show the Playoffs link when the bracket becomes available
            return new SeasonModeResponse("playoffs", seasonLabel, regularSeasonEnd,
                hasPlayoffActivity, false);
        }

        // Default to regular season (no final games yet)
        return new SeasonModeResponse("regular-season", seasonLabel, regularSeasonEnd, false, false);
    }
}

public record SeasonModeResponse(
    string Mode,
    string Season,
    DateOnly? RegularSeasonEnd,
    bool PlayoffBracketAvailable,
    bool DraftAvailable
);
