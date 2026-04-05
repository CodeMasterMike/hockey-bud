using HockeyHub.Core.Models.Entities;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HockeyHub.Data.Services.Queries;

public class ScoresQueryService(
    HockeyHubDbContext db,
    RedisCacheService cache,
    ILogger<ScoresQueryService> logger)
{
    private static DateOnly GetNhlGameDay() => HockeyHub.Core.NhlDateHelper.GetCurrentGameDay();

    public async Task<ScoresResponse> GetScoresByDateAsync(
        int leagueId, DateOnly date, CancellationToken ct = default)
    {
        var cacheKey = $"scores:{leagueId}:{date:yyyy-MM-dd}";

        var games = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            var season = await db.Seasons
                .Where(s => s.LeagueId == leagueId && s.IsCurrent)
                .FirstOrDefaultAsync(ct);

            if (season is null) return new List<ScoreGameDto>();

            var gameEntities = await db.Games
                .Where(g => g.Season.LeagueId == leagueId && g.GameDateLocal == date)
                .Include(g => g.HomeTeam)
                .Include(g => g.AwayTeam)
                .OrderBy(g => g.ScheduledStart)
                .ThenBy(g => g.HomeTeam.LocationName)
                .ToListAsync(ct);

            var teamIds = gameEntities
                .SelectMany(g => new[] { g.HomeTeamId, g.AwayTeamId })
                .Distinct()
                .ToList();

            var standings = await db.StandingsSnapshots
                .Where(s => s.SeasonId == season.Id && teamIds.Contains(s.TeamId))
                .ToDictionaryAsync(s => s.TeamId, ct);

            return gameEntities.Select(g => MapToDto(g, standings)).ToList();
        }, await HasLiveGamesAsync(date) ? RedisCacheService.LiveScoresTtl : TimeSpan.FromMinutes(5), ct);

        // Check if we should show previous day link
        var showPreviousDay = false;
        if (date == GetNhlGameDay())
        {
            var lastGameEnd = await db.Games
                .Where(g => g.Season.LeagueId == leagueId && g.GameDateLocal == date && g.Status == "Final")
                .OrderByDescending(g => g.LastUpdated)
                .Select(g => g.LastUpdated)
                .FirstOrDefaultAsync(ct);

            if (lastGameEnd != default && DateTimeOffset.UtcNow - lastGameEnd < TimeSpan.FromHours(2))
                showPreviousDay = true;
        }

        return new ScoresResponse(
            Date: date.ToString("yyyy-MM-dd"),
            DateDisplay: date.ToString("MM/dd"),
            ShowPreviousDay: showPreviousDay,
            DataAsOf: DateTimeOffset.UtcNow,
            Games: games ?? []
        );
    }

    public async Task<ExpandedScoreDto?> GetExpandedScoreAsync(
        int gameId, CancellationToken ct = default)
    {
        var cacheKey = $"scores:expanded:{gameId}";

        return await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            var game = await db.Games
                .Include(g => g.PeriodScores.OrderBy(p => p.Period))
                .Include(g => g.HomeTeam)
                .Include(g => g.AwayTeam)
                .FirstOrDefaultAsync(g => g.Id == gameId, ct);

            if (game is null) return null;

            return new ExpandedScoreDto(
                GameId: game.Id,
                PeriodScores: game.PeriodScores.Select(p => new PeriodScoreDto(
                    Period: p.PeriodLabel,
                    HomeGoals: p.HomeGoals,
                    AwayGoals: p.AwayGoals,
                    HomeShots: p.HomeShots,
                    AwayShots: p.AwayShots
                )).ToList(),
                Stats: new GameStatsDto(
                    HomePowerPlay: FormatPowerPlay(game.HomePowerPlayGoals, game.HomePowerPlayOpps),
                    AwayPowerPlay: FormatPowerPlay(game.AwayPowerPlayGoals, game.AwayPowerPlayOpps),
                    HomeHits: game.HomeHits ?? 0,
                    AwayHits: game.AwayHits ?? 0,
                    HomeFaceoffPct: game.HomeFaceoffPct ?? 0,
                    AwayFaceoffPct: game.AwayFaceoffPct ?? 0,
                    HomeTakeaways: game.HomeTakeaways ?? 0,
                    AwayTakeaways: game.AwayTakeaways ?? 0,
                    HomeGiveaways: game.HomeGiveaways ?? 0,
                    AwayGiveaways: game.AwayGiveaways ?? 0,
                    HomeTimeOfPossession: FormatTimeSpan(game.HomeTimeOnAttack),
                    AwayTimeOfPossession: FormatTimeSpan(game.AwayTimeOnAttack)
                ),
                GoalSummaries: new GoalSummariesDto(Home: [], Away: []),
                PenaltySummaries: new PenaltySummariesDto(Home: [], Away: [])
            );
        }, RedisCacheService.LiveScoresTtl, ct);
    }

    public async Task<LiveScoresResponse> GetLiveScoresAsync(CancellationToken ct = default)
    {
        var cacheKey = "scores:live";

        var games = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            return await db.Games
                .Where(g => g.Status == "Live")
                .Select(g => new LiveGameDto(
                    g.Id,
                    g.Status,
                    g.CurrentPeriod ?? 0,
                    g.PeriodTimeRemaining ?? "00:00",
                    g.HomeScore ?? 0,
                    g.AwayScore ?? 0,
                    g.HomeShotsOnGoal ?? 0,
                    g.AwayShotsOnGoal ?? 0
                ))
                .ToListAsync(ct);
        }, RedisCacheService.LiveScoresTtl, ct);

        return new LiveScoresResponse(DateTimeOffset.UtcNow, games ?? []);
    }

    public async Task<TickerResponse> GetTickerAsync(
        int leagueId, CancellationToken ct = default)
    {
        var cacheKey = $"scores:ticker:{leagueId}";

        var games = await cache.GetOrSetAsync(cacheKey, async _ =>
        {
            var today = GetNhlGameDay();

            return await db.Games
                .Where(g => g.Season.LeagueId == leagueId && g.GameDateLocal == today)
                .Include(g => g.HomeTeam)
                .Include(g => g.AwayTeam)
                .OrderBy(g => g.Status == "Final" ? 0 : g.Status == "Live" ? 1 : 2)
                .ThenByDescending(g => g.CurrentPeriod)
                .ThenBy(g => g.ScheduledStart)
                .Select(g => new TickerGameDto(
                    g.Id,
                    g.Status,
                    g.CurrentPeriod,
                    g.PeriodTimeRemaining,
                    g.PeriodTimeRemainingSeconds,
                    new TickerTeamDto(g.HomeTeam.Id, g.HomeTeam.Abbreviation, g.HomeTeam.LogoUrl),
                    new TickerTeamDto(g.AwayTeam.Id, g.AwayTeam.Abbreviation, g.AwayTeam.LogoUrl),
                    g.HomeScore,
                    g.AwayScore,
                    HockeyHub.Core.NhlDateHelper.FormatStartTimeEastern(g.ScheduledStart)
                ))
                .ToListAsync(ct);
        }, RedisCacheService.LiveScoresTtl, ct);

        return new TickerResponse(DateTimeOffset.UtcNow, games ?? []);
    }

    public async Task<PregameDto?> GetPregameAsync(
        int gameId, CancellationToken ct = default)
    {
        var game = await db.Games
            .Include(g => g.HomeTeam)
            .Include(g => g.AwayTeam)
            .Include(g => g.Season)
            .FirstOrDefaultAsync(g => g.Id == gameId, ct);

        if (game is null || game.Status != "Scheduled") return null;

        var teamIds = new[] { game.HomeTeamId, game.AwayTeamId };
        var standings = await db.StandingsSnapshots
            .Where(s => teamIds.Contains(s.TeamId) && s.SeasonId == game.SeasonId)
            .ToDictionaryAsync(s => s.TeamId, ct);

        var homeStandings = standings.GetValueOrDefault(game.HomeTeamId);
        var awayStandings = standings.GetValueOrDefault(game.AwayTeamId);

        return new PregameDto(
            GameId: game.Id,
            Status: game.Status,
            HomeTeam: new PregameTeamDto(
                Id: game.HomeTeam.Id,
                Abbreviation: game.HomeTeam.Abbreviation,
                TopGoalScorers: [],
                TopAssistGetters: [],
                TopPointGetters: [],
                StartingGoalie: new PregameGoalieDto(null, null, null, null, false),
                PowerPlayPct: homeStandings?.PowerPlayPct ?? 0,
                PenaltyKillPct: homeStandings?.PenaltyKillPct ?? 0
            ),
            AwayTeam: new PregameTeamDto(
                Id: game.AwayTeam.Id,
                Abbreviation: game.AwayTeam.Abbreviation,
                TopGoalScorers: [],
                TopAssistGetters: [],
                TopPointGetters: [],
                StartingGoalie: new PregameGoalieDto(null, null, null, null, false),
                PowerPlayPct: awayStandings?.PowerPlayPct ?? 0,
                PenaltyKillPct: awayStandings?.PenaltyKillPct ?? 0
            ),
            HeadToHead: new HeadToHeadDto(
                CurrentSeason: new H2HSeasonDto(
                    Home: new H2HRecordDto(0, 0, 0, null),
                    Away: new H2HRecordDto(0, 0, 0, null)
                ),
                AllTime: new H2HSeasonDto(
                    Home: new H2HRecordDto(0, 0, 0, 0),
                    Away: new H2HRecordDto(0, 0, 0, 0)
                )
            )
        );
    }

    private static ScoreGameDto MapToDto(Game game, Dictionary<int, StandingsSnapshot> standings)
    {
        standings.TryGetValue(game.HomeTeamId, out var homeStandings);
        standings.TryGetValue(game.AwayTeamId, out var awayStandings);

        return new ScoreGameDto(
            Id: game.Id,
            Status: game.Status,
            ScheduledStart: game.ScheduledStart,
            ScheduledStartLocal: game.Status == "Scheduled"
                ? HockeyHub.Core.NhlDateHelper.FormatStartTimeEastern(game.ScheduledStart)
                : null,
            CurrentPeriod: game.CurrentPeriod,
            CurrentPeriodLabel: game.CurrentPeriodLabel,
            PeriodTimeRemaining: game.PeriodTimeRemaining,
            PeriodTimeRemainingSeconds: game.PeriodTimeRemainingSeconds,
            ClockRunning: game.ClockRunning,
            IsOvertime: game.IsOvertime,
            IsShootout: game.IsShootout,
            HomeTeam: new ScoreTeamDto(
                Id: game.HomeTeam.Id,
                Abbreviation: game.HomeTeam.Abbreviation,
                LogoUrl: game.HomeTeam.LogoUrl,
                Score: game.HomeScore,
                ShotsOnGoal: game.HomeShotsOnGoal,
                Record: homeStandings is not null
                    ? $"{homeStandings.Wins}-{homeStandings.Losses}-{homeStandings.OvertimeLosses}"
                    : null,
                PointsPct: homeStandings?.PointsPct,
                LeagueRank: homeStandings?.LeagueRank
            ),
            AwayTeam: new ScoreTeamDto(
                Id: game.AwayTeam.Id,
                Abbreviation: game.AwayTeam.Abbreviation,
                LogoUrl: game.AwayTeam.LogoUrl,
                Score: game.AwayScore,
                ShotsOnGoal: game.AwayShotsOnGoal,
                Record: awayStandings is not null
                    ? $"{awayStandings.Wins}-{awayStandings.Losses}-{awayStandings.OvertimeLosses}"
                    : null,
                PointsPct: awayStandings?.PointsPct,
                LeagueRank: awayStandings?.LeagueRank
            )
        );
    }

    private async Task<bool> HasLiveGamesAsync(DateOnly date)
    {
        return await db.Games.AnyAsync(g => g.GameDateLocal == date && g.Status == "Live");
    }

    private static string FormatPowerPlay(int? goals, int? opps) =>
        $"{goals ?? 0}/{opps ?? 0}";

    private static string FormatTimeSpan(TimeSpan? ts) =>
        ts.HasValue ? $"{(int)ts.Value.TotalMinutes}:{ts.Value.Seconds:D2}" : "0:00";
}

// DTOs
public record ScoresResponse(
    string Date,
    string DateDisplay,
    bool ShowPreviousDay,
    DateTimeOffset DataAsOf,
    IReadOnlyList<ScoreGameDto> Games
);

public record ScoreGameDto(
    int Id,
    string Status,
    DateTimeOffset ScheduledStart,
    string? ScheduledStartLocal,
    int? CurrentPeriod,
    string? CurrentPeriodLabel,
    string? PeriodTimeRemaining,
    int? PeriodTimeRemainingSeconds,
    bool ClockRunning,
    bool IsOvertime,
    bool IsShootout,
    ScoreTeamDto HomeTeam,
    ScoreTeamDto AwayTeam
);

public record ScoreTeamDto(
    int Id,
    string Abbreviation,
    string? LogoUrl,
    int? Score,
    int? ShotsOnGoal,
    string? Record,
    decimal? PointsPct,
    int? LeagueRank
);

public record ExpandedScoreDto(
    int GameId,
    IReadOnlyList<PeriodScoreDto> PeriodScores,
    GameStatsDto Stats,
    GoalSummariesDto GoalSummaries,
    PenaltySummariesDto PenaltySummaries
);

public record PeriodScoreDto(string Period, int HomeGoals, int AwayGoals, int HomeShots, int AwayShots);

public record GameStatsDto(
    string HomePowerPlay, string AwayPowerPlay,
    int HomeHits, int AwayHits,
    decimal HomeFaceoffPct, decimal AwayFaceoffPct,
    int HomeTakeaways, int AwayTakeaways,
    int HomeGiveaways, int AwayGiveaways,
    string HomeTimeOfPossession, string AwayTimeOfPossession
);

public record GoalSummariesDto(
    IReadOnlyList<GoalSummaryDto> Home,
    IReadOnlyList<GoalSummaryDto> Away
);

public record GoalSummaryDto(
    string Period, string Time, string DisplayTime,
    GoalScorerDto Scorer,
    IReadOnlyList<AssistDto> Assists,
    bool IsPowerPlay,
    string? VideoUrl
);

public record GoalScorerDto(int PlayerId, string Name, int GoalNumber);
public record AssistDto(int PlayerId, string Name, int AssistNumber);

public record PenaltySummariesDto(
    IReadOnlyList<PenaltySummaryDto> Home,
    IReadOnlyList<PenaltySummaryDto> Away
);

public record PenaltySummaryDto(
    string Period, string Time, string DisplayTime,
    PenaltyPlayerDto Player,
    string PenaltyType, int PenaltyMinutes,
    int PlayerSeasonPIM, string? RuleBookRef,
    string? VideoUrl
);

public record PenaltyPlayerDto(int PlayerId, string Name);

public record LiveScoresResponse(
    DateTimeOffset DataAsOf,
    IReadOnlyList<LiveGameDto> Games
);

public record LiveGameDto(
    int Id, string Status, int Period,
    string PeriodTimeRemaining,
    int HomeScore, int AwayScore,
    int HomeShotsOnGoal, int AwayShotsOnGoal
);

public record TickerResponse(
    DateTimeOffset DataAsOf,
    IReadOnlyList<TickerGameDto> Games
);

public record TickerGameDto(
    int Id, string Status, int? Period,
    string? PeriodTimeRemaining, int? PeriodTimeRemainingSeconds,
    TickerTeamDto HomeTeam, TickerTeamDto AwayTeam,
    int? HomeScore, int? AwayScore,
    string? ScheduledStartLocal
);

public record TickerTeamDto(int Id, string Abbreviation, string? LogoUrl);

public record PregameDto(
    int GameId, string Status,
    PregameTeamDto HomeTeam, PregameTeamDto AwayTeam,
    HeadToHeadDto HeadToHead
);

public record PregameTeamDto(
    int Id, string Abbreviation,
    IReadOnlyList<TopScorerDto> TopGoalScorers,
    IReadOnlyList<TopScorerDto> TopAssistGetters,
    IReadOnlyList<TopScorerDto> TopPointGetters,
    PregameGoalieDto StartingGoalie,
    decimal PowerPlayPct, decimal PenaltyKillPct
);

public record TopScorerDto(int PlayerId, string Name, int Value);

public record PregameGoalieDto(
    int? PlayerId, string? Name,
    decimal? Gaa, decimal? SavePct,
    bool Confirmed
);

public record HeadToHeadDto(H2HSeasonDto CurrentSeason, H2HSeasonDto AllTime);
public record H2HSeasonDto(H2HRecordDto Home, H2HRecordDto Away);
public record H2HRecordDto(int Wins, int OvertimeWins, int ShootoutWins, int? Ties);
