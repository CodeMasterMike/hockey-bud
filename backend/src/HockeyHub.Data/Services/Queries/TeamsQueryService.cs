using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Data.Services.Queries;

public class TeamsQueryService(HockeyHubDbContext db, RedisCacheService cache)
{
    public async Task<TeamsListResponse?> GetTeamsAsync(int leagueId, CancellationToken ct = default)
    {
        var cacheKey = $"teams:list:{leagueId}";

        var teams = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            var season = await db.Seasons
                .Where(s => s.LeagueId == leagueId && s.IsCurrent)
                .FirstOrDefaultAsync(ct);

            var teamEntities = await db.Teams
                .Where(t => t.LeagueId == leagueId && t.IsActive)
                .OrderBy(t => t.LocationName)
                .ToListAsync(ct);

            var standings = season is not null
                ? await db.StandingsSnapshots
                    .Where(s => s.SeasonId == season.Id)
                    .ToDictionaryAsync(s => s.TeamId, ct)
                : new();

            return teamEntities.Select(t =>
            {
                standings.TryGetValue(t.Id, out var s);
                return new TeamsListItemDto(
                    Id: t.Id,
                    LocationName: t.LocationName,
                    Name: t.Name,
                    Abbreviation: t.Abbreviation,
                    LogoUrl: t.LogoUrl,
                    PrimaryColor: t.PrimaryColor,
                    Division: s?.Division,
                    Conference: s?.Conference,
                    Record: s is not null ? $"{s.Wins}-{s.Losses}-{s.OvertimeLosses}" : null,
                    Points: s?.Points,
                    PointsPct: s?.PointsPct
                );
            }).ToList();
        }, RedisCacheService.TeamsTtl, ct);

        return new TeamsListResponse(teams ?? []);
    }

    public async Task<TeamProfileResponse?> GetTeamProfileAsync(int teamId, CancellationToken ct = default)
    {
        var cacheKey = $"teams:profile:{teamId}";

        return await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            var team = await db.Teams
                .Include(t => t.FranchiseHistories.OrderBy(f => f.YearStart))
                .FirstOrDefaultAsync(t => t.Id == teamId, ct);

            if (team is null) return null;

            var season = await db.Seasons
                .Where(s => s.LeagueId == team.LeagueId && s.IsCurrent)
                .FirstOrDefaultAsync(ct);

            var standings = season is not null
                ? await db.StandingsSnapshots
                    .FirstOrDefaultAsync(s => s.SeasonId == season.Id && s.TeamId == teamId, ct)
                : null;

            var roster = await db.Players
                .Where(p => p.CurrentTeamId == teamId && p.IsActive)
                .OrderBy(p => p.LastName).ThenBy(p => p.FirstName)
                .Select(p => new RosterPlayerDto(
                    PlayerId: p.Id,
                    FirstName: p.FirstName,
                    LastName: p.LastName,
                    JerseyNumber: p.JerseyNumber,
                    ShootsCatches: p.ShootsCatches,
                    BirthCity: p.BirthCity,
                    BirthCountry: p.BirthCountry,
                    DateOfBirth: p.DateOfBirth,
                    DraftYear: p.DraftYear,
                    IsEbug: p.IsEbug
                ))
                .ToListAsync(ct);

            return new TeamProfileResponse(
                Id: team.Id,
                LocationName: team.LocationName,
                Name: team.Name,
                Abbreviation: team.Abbreviation,
                LogoUrl: team.LogoUrl,
                PrimaryColor: team.PrimaryColor,
                Division: standings?.Division,
                Conference: standings?.Conference,
                CurrentSeasonRecord: standings is not null
                    ? new TeamRecordDto(standings.Wins, standings.Losses, standings.OvertimeLosses)
                    : null,
                Points: standings?.Points,
                PointsPct: standings?.PointsPct,
                LeagueRank: standings?.LeagueRank,
                DivisionRank: standings?.DivisionRank,
                JoinedSeasonYear: team.JoinedSeasonYear,
                OriginalJoinYear: team.OriginalJoinYear,
                StanleyCups: new StanleyCupsDto(team.StanleyCupsTotal, team.StanleyCupsSince1973, team.StanleyCupsSince2006),
                FranchiseHistory: team.FranchiseHistories.Select(f => new FranchiseHistoryDto(
                    f.PreviousLocationName, f.PreviousName, f.YearStart, f.YearEnd
                )).ToList(),
                Season: season?.Label,
                Roster: roster,
                DataAsOf: DateTimeOffset.UtcNow
            );
        }, RedisCacheService.RosterTtl, ct);
    }
}

// ── List DTOs ──────────────────────────────────────────────────────────────────

public record TeamsListResponse(IReadOnlyList<TeamsListItemDto> Teams);

public record TeamsListItemDto(
    int Id,
    string LocationName,
    string Name,
    string Abbreviation,
    string? LogoUrl,
    string PrimaryColor,
    string? Division,
    string? Conference,
    string? Record,
    int? Points,
    decimal? PointsPct
);

// ── Profile DTOs ───────────────────────────────────────────────────────────────

public record TeamProfileResponse(
    int Id,
    string LocationName,
    string Name,
    string Abbreviation,
    string? LogoUrl,
    string PrimaryColor,
    string? Division,
    string? Conference,
    TeamRecordDto? CurrentSeasonRecord,
    int? Points,
    decimal? PointsPct,
    int? LeagueRank,
    int? DivisionRank,
    int JoinedSeasonYear,
    int OriginalJoinYear,
    StanleyCupsDto StanleyCups,
    IReadOnlyList<FranchiseHistoryDto> FranchiseHistory,
    string? Season,
    IReadOnlyList<RosterPlayerDto> Roster,
    DateTimeOffset DataAsOf
);

public record TeamRecordDto(int Wins, int Losses, int OvertimeLosses);
public record StanleyCupsDto(int Total, int Since1973, int Since2006);
public record FranchiseHistoryDto(string City, string Name, int YearStart, int YearEnd);

public record RosterPlayerDto(
    int PlayerId,
    string FirstName,
    string LastName,
    int? JerseyNumber,
    string ShootsCatches,
    string BirthCity,
    string BirthCountry,
    DateOnly DateOfBirth,
    int? DraftYear,
    bool IsEbug
);
