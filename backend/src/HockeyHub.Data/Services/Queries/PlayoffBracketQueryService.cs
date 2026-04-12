using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Data.Services.Queries;

public class PlayoffBracketQueryService(
    HockeyHubDbContext db,
    INhlDataProvider nhlProvider,
    RedisCacheService cache)
{
    public async Task<PlayoffBracketResponse?> GetBracketAsync(
        int leagueId, string? conference, CancellationToken ct = default)
    {
        var season = await db.Seasons
            .Where(s => s.LeagueId == leagueId && s.IsCurrent)
            .FirstOrDefaultAsync(ct);

        if (season is null) return null;

        var seasonLabel = $"{season.YearStart}{season.YearEnd}";
        var cacheKey = $"playoffs:bracket:{seasonLabel}";

        var bracket = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            return await nhlProvider.GetPlayoffBracketAsync(seasonLabel, ct);
        }, DetermineTtl, ct);

        if (bracket is null) return null;

        var rounds = bracket.Rounds.Select(r =>
        {
            var series = r.Series.AsEnumerable();

            // Filter by conference if requested
            if (!string.IsNullOrEmpty(conference) && !conference.Equals("full", StringComparison.OrdinalIgnoreCase))
            {
                series = series.Where(s =>
                    s.Conference.Contains(conference, StringComparison.OrdinalIgnoreCase));
            }

            return new PlayoffRoundDto(
                r.RoundNumber,
                r.RoundLabel,
                series.Select(s => new PlayoffSeriesDto(
                    s.SeriesLetter,
                    new PlayoffSeriesTeamDto(
                        s.TopSeedAbbreviation, s.TopSeedLogoUrl,
                        s.TopSeedConferenceSeed, s.TopSeedWins,
                        s.TopSeedRegularRecord),
                    new PlayoffSeriesTeamDto(
                        s.BottomSeedAbbreviation, s.BottomSeedLogoUrl,
                        s.BottomSeedConferenceSeed, s.BottomSeedWins,
                        s.BottomSeedRegularRecord),
                    s.Conference,
                    s.SeriesStatus,
                    FormatSeriesScore(s)
                )).ToList()
            );
        }).ToList();

        return new PlayoffBracketResponse(seasonLabel, conference, DateTimeOffset.UtcNow, rounds);
    }

    public async Task<PlayoffMatchupDetailResponse?> GetMatchupAsync(
        int leagueId, string seriesLetter, CancellationToken ct = default)
    {
        var season = await db.Seasons
            .Where(s => s.LeagueId == leagueId && s.IsCurrent)
            .FirstOrDefaultAsync(ct);

        if (season is null) return null;

        var seasonLabel = $"{season.YearStart}{season.YearEnd}";
        var cacheKey = $"playoffs:bracket:{seasonLabel}";

        var bracket = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            return await nhlProvider.GetPlayoffBracketAsync(seasonLabel, ct);
        }, DetermineTtl, ct);

        if (bracket is null) return null;

        var series = bracket.Rounds
            .SelectMany(r => r.Series)
            .FirstOrDefault(s => s.SeriesLetter.Equals(seriesLetter, StringComparison.OrdinalIgnoreCase));

        if (series is null) return null;

        return new PlayoffMatchupDetailResponse(
            series.SeriesLetter,
            new PlayoffSeriesTeamDto(
                series.TopSeedAbbreviation, series.TopSeedLogoUrl,
                series.TopSeedConferenceSeed, series.TopSeedWins,
                series.TopSeedRegularRecord),
            new PlayoffSeriesTeamDto(
                series.BottomSeedAbbreviation, series.BottomSeedLogoUrl,
                series.BottomSeedConferenceSeed, series.BottomSeedWins,
                series.BottomSeedRegularRecord),
            series.Conference,
            series.SeriesStatus,
            FormatSeriesScore(series),
            series.Games.Select(g => new PlayoffGameSummaryDto(
                g.GameId, g.GameNumber, g.Status,
                g.HomeScore, g.AwayScore,
                g.HomeTeamAbbreviation, g.AwayTeamAbbreviation
            )).ToList(),
            DateTimeOffset.UtcNow
        );
    }

    private static TimeSpan DetermineTtl => TimeSpan.FromMinutes(5);

    private static string FormatSeriesScore(NhlPlayoffSeries s)
    {
        if (s.TopSeedWins == 0 && s.BottomSeedWins == 0) return "Not started";
        if (s.TopSeedWins == 4) return $"{s.TopSeedAbbreviation} wins {s.TopSeedWins}-{s.BottomSeedWins}";
        if (s.BottomSeedWins == 4) return $"{s.BottomSeedAbbreviation} wins {s.BottomSeedWins}-{s.TopSeedWins}";
        if (s.TopSeedWins == s.BottomSeedWins) return $"Tied {s.TopSeedWins}-{s.BottomSeedWins}";
        if (s.TopSeedWins > s.BottomSeedWins) return $"{s.TopSeedAbbreviation} leads {s.TopSeedWins}-{s.BottomSeedWins}";
        return $"{s.BottomSeedAbbreviation} leads {s.BottomSeedWins}-{s.TopSeedWins}";
    }
}

// ── Response DTOs ──────────────────────────────────────────────────

public record PlayoffBracketResponse(
    string Season,
    string? Conference,
    DateTimeOffset DataAsOf,
    IReadOnlyList<PlayoffRoundDto> Rounds
);

public record PlayoffRoundDto(
    int RoundNumber,
    string Label,
    IReadOnlyList<PlayoffSeriesDto> Series
);

public record PlayoffSeriesDto(
    string SeriesLetter,
    PlayoffSeriesTeamDto TopSeed,
    PlayoffSeriesTeamDto BottomSeed,
    string Conference,
    string Status,
    string SeriesScore
);

public record PlayoffSeriesTeamDto(
    string Abbreviation,
    string? LogoUrl,
    int ConferenceSeed,
    int SeriesWins,
    string RegularSeasonRecord
);

public record PlayoffMatchupDetailResponse(
    string SeriesLetter,
    PlayoffSeriesTeamDto TopSeed,
    PlayoffSeriesTeamDto BottomSeed,
    string Conference,
    string Status,
    string SeriesScore,
    IReadOnlyList<PlayoffGameSummaryDto> Games,
    DateTimeOffset DataAsOf
);

public record PlayoffGameSummaryDto(
    int GameId,
    int GameNumber,
    string Status,
    int? HomeScore,
    int? AwayScore,
    string HomeTeamAbbreviation,
    string AwayTeamAbbreviation
);
