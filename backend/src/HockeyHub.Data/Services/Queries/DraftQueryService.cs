using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Data.Services.Queries;

public class DraftQueryService(
    HockeyHubDbContext db,
    INhlDataProvider nhlProvider,
    RedisCacheService cache)
{
    public async Task<DraftResponse?> GetDraftAsync(
        int leagueId, int? year, CancellationToken ct = default)
    {
        var draftYear = year ?? DetermineCurrentDraftYear();

        var cacheKey = $"draft:{draftYear}";
        var isLikelyLive = IsLikelyDraftDay(draftYear);
        var ttl = isLikelyLive ? RedisCacheService.LiveScoresTtl : RedisCacheService.TeamsTtl;

        var draft = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            return await nhlProvider.GetDraftAsync(draftYear, ct);
        }, ttl, ct);

        if (draft is null) return null;

        // Resolve player IDs from our database where possible
        var allPlayerNames = draft.Rounds
            .SelectMany(r => r.Picks)
            .Where(p => p.PlayerId is null)
            .Select(p => $"{p.FirstName} {p.LastName}")
            .ToHashSet();

        var knownPlayers = allPlayerNames.Count > 0
            ? await db.Players
                .Where(p => allPlayerNames.Contains(p.FirstName + " " + p.LastName))
                .Select(p => new { p.FirstName, p.LastName, p.Id })
                .ToDictionaryAsync(p => $"{p.FirstName} {p.LastName}", p => p.Id, ct)
            : new Dictionary<string, int>();

        var rounds = draft.Rounds.Select(r => new DraftRoundDto(
            r.RoundNumber,
            r.Picks.Select(p =>
            {
                var fullName = $"{p.FirstName} {p.LastName}";
                var playerId = p.PlayerId ?? knownPlayers.GetValueOrDefault(fullName);
                var prevClub = p.PreviousLeague is not null
                    ? $"{p.PreviousClub} ({p.PreviousLeague})"
                    : p.PreviousClub;

                return new DraftPickDto(
                    p.OverallPick,
                    p.PickInRound,
                    p.TeamAbbreviation,
                    p.TeamLogoUrl,
                    fullName,
                    p.Position,
                    p.BirthCountry,
                    prevClub,
                    playerId
                );
            }).ToList()
        )).ToList();

        return new DraftResponse(draftYear, DateTimeOffset.UtcNow, rounds, isLikelyLive);
    }

    private static int DetermineCurrentDraftYear()
    {
        var now = DateTime.UtcNow;
        // Draft typically happens in late June; if it's past July, show this year's draft
        // If it's before June, show the upcoming draft year
        return now.Month >= 6 ? now.Year : now.Year;
    }

    private static bool IsLikelyDraftDay(int draftYear)
    {
        var now = DateTime.UtcNow;
        // Draft is typically the last week of June
        return now.Year == draftYear && now.Month == 6 && now.Day >= 20;
    }
}

// ── Response DTOs ──────────────────────────────────────────────────

public record DraftResponse(
    int Year,
    DateTimeOffset DataAsOf,
    IReadOnlyList<DraftRoundDto> Rounds,
    bool IsLive
);

public record DraftRoundDto(
    int RoundNumber,
    IReadOnlyList<DraftPickDto> Picks
);

public record DraftPickDto(
    int OverallPick,
    int PickInRound,
    string TeamAbbreviation,
    string? TeamLogoUrl,
    string PlayerName,
    string? Position,
    string? BirthCountry,
    string? PreviousClub,
    int? PlayerId
);
