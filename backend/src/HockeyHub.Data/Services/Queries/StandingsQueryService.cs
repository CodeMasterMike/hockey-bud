using HockeyHub.Core.Models.Entities;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Data.Services.Queries;

public class StandingsQueryService(HockeyHubDbContext db, RedisCacheService cache)
{
    // NHL division ordering used by the wildcard and division views — listed in the
    // order the mockups display them (Eastern conference first, then Western).
    private static readonly string[] DivisionOrder = ["Atlantic", "Metropolitan", "Central", "Pacific"];
    private static readonly string[] ConferenceOrder = ["Eastern", "Western"];

    public async Task<StandingsResponse?> GetStandingsAsync(
        int leagueId, string view, CancellationToken ct = default)
    {
        var season = await db.Seasons
            .Where(s => s.LeagueId == leagueId && s.IsCurrent)
            .FirstOrDefaultAsync(ct);
        if (season is null) return null;

        var cacheKey = $"standings:{leagueId}:{view}:{season.Id}";

        var groups = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            var snapshots = await db.StandingsSnapshots
                .Where(s => s.SeasonId == season.Id)
                .Include(s => s.Team)
                .ToListAsync(ct);

            return view switch
            {
                "wildcard" => BuildWildcardGroups(snapshots),
                "division" => BuildDivisionGroups(snapshots),
                "conference" => BuildConferenceGroups(snapshots),
                "league" => BuildLeagueGroup(snapshots),
                _ => throw new ArgumentException($"Unknown view: {view}", nameof(view))
            };
        }, RedisCacheService.StandingsTtl, ct);

        var lastUpdated = await db.StandingsSnapshots
            .Where(s => s.SeasonId == season.Id)
            .MaxAsync(s => (DateTimeOffset?)s.LastUpdated, ct) ?? DateTimeOffset.UtcNow;

        return new StandingsResponse(
            Season: season.Label,
            View: view,
            DataAsOf: lastUpdated,
            Groups: groups ?? []
        );
    }

    private static List<StandingsGroupDto> BuildWildcardGroups(List<StandingsSnapshot> snapshots)
    {
        var groups = new List<StandingsGroupDto>();

        // Top 3 of each division as separate groups (ordered Atlantic, Metro, Central, Pacific)
        foreach (var divisionName in DivisionOrder)
        {
            var teams = snapshots
                .Where(s => s.Division == divisionName && s.DivisionRank <= 3)
                .OrderBy(s => s.DivisionRank)
                .Select(MapToTeamDto)
                .ToList();

            if (teams.Count == 0) continue;

            groups.Add(new StandingsGroupDto(
                Label: divisionName,
                Conference: snapshots.First(s => s.Division == divisionName).Conference,
                Teams: teams
            ));
        }

        // Wild card groups: one per conference, containing every team that isn't a
        // division leader. Order by conference rank — top 2 are WC1/WC2, the rest are
        // out of playoff position (frontend renders them muted with a dashed divider).
        foreach (var conferenceName in ConferenceOrder)
        {
            var teams = snapshots
                .Where(s => s.Conference == conferenceName && s.DivisionRank > 3)
                .OrderBy(s => s.ConferenceRank)
                .Select(MapToTeamDto)
                .ToList();

            if (teams.Count == 0) continue;

            groups.Add(new StandingsGroupDto(
                Label: $"{conferenceName} Wild Card",
                Conference: conferenceName,
                Teams: teams
            ));
        }

        return groups;
    }

    private static List<StandingsGroupDto> BuildDivisionGroups(List<StandingsSnapshot> snapshots) =>
        DivisionOrder
            .Select(name => snapshots.Where(s => s.Division == name).ToList())
            .Where(g => g.Count > 0)
            .Select(g => new StandingsGroupDto(
                Label: $"{g[0].Division} Division",
                Conference: g[0].Conference,
                Teams: g.OrderBy(s => s.DivisionRank).Select(MapToTeamDto).ToList()
            ))
            .ToList();

    private static List<StandingsGroupDto> BuildConferenceGroups(List<StandingsSnapshot> snapshots) =>
        ConferenceOrder
            .Select(name => snapshots.Where(s => s.Conference == name).ToList())
            .Where(g => g.Count > 0)
            .Select(g => new StandingsGroupDto(
                Label: $"{g[0].Conference} Conference",
                Conference: g[0].Conference,
                Teams: g.OrderBy(s => s.ConferenceRank).Select(MapToTeamDto).ToList()
            ))
            .ToList();

    private static List<StandingsGroupDto> BuildLeagueGroup(List<StandingsSnapshot> snapshots) =>
    [
        new StandingsGroupDto(
            Label: "League",
            Conference: null,
            Teams: snapshots.OrderBy(s => s.LeagueRank).Select(MapToTeamDto).ToList()
        )
    ];

    private static StandingsTeamDto MapToTeamDto(StandingsSnapshot s) => new(
        TeamId: s.TeamId,
        Abbreviation: s.Team.Abbreviation,
        LogoUrl: s.Team.LogoUrl,
        Name: $"{s.Team.LocationName} {s.Team.Name}",
        GamesPlayed: s.GamesPlayed,
        Wins: s.Wins,
        Losses: s.Losses,
        OvertimeLosses: s.OvertimeLosses,
        Points: s.Points,
        PointsPct: s.PointsPct,
        RegulationWins: s.RegulationWins,
        RegulationPlusOTWins: s.RegulationPlusOTWins,
        GoalsFor: s.GoalsFor,
        GoalsAgainst: s.GoalsAgainst,
        GoalDifferential: s.GoalDifferential,
        PowerPlayPct: s.PowerPlayPct,
        PenaltyKillPct: s.PenaltyKillPct,
        FaceoffPct: s.FaceoffPct,
        DivisionRank: s.DivisionRank,
        ConferenceRank: s.ConferenceRank,
        LeagueRank: s.LeagueRank,
        WildCardRank: s.WildCardRank
    );
}

public record StandingsResponse(
    string Season,
    string View,
    DateTimeOffset DataAsOf,
    IReadOnlyList<StandingsGroupDto> Groups
);

public record StandingsGroupDto(
    string Label,
    string? Conference,
    IReadOnlyList<StandingsTeamDto> Teams
);

public record StandingsTeamDto(
    int TeamId,
    string Abbreviation,
    string? LogoUrl,
    string Name,
    int GamesPlayed,
    int Wins,
    int Losses,
    int OvertimeLosses,
    int Points,
    decimal PointsPct,
    int RegulationWins,
    int RegulationPlusOTWins,
    int GoalsFor,
    int GoalsAgainst,
    int GoalDifferential,
    decimal PowerPlayPct,
    decimal PenaltyKillPct,
    decimal? FaceoffPct,
    int DivisionRank,
    int ConferenceRank,
    int LeagueRank,
    int? WildCardRank
);
