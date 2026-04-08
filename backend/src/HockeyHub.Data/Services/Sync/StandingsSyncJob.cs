using HockeyHub.Core.Models.Entities;
using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Cache;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HockeyHub.Data.Services.Sync;

public class StandingsSyncJob(
    HockeyHubDbContext db,
    INhlDataProvider nhlProvider,
    RedisCacheService cache,
    ILogger<StandingsSyncJob> logger)
{
    public async Task SyncAsync(CancellationToken ct = default)
    {
        logger.LogInformation("Syncing standings");

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

        var entries = await nhlProvider.GetStandingsAsync("now", ct);
        if (entries.Count == 0)
        {
            logger.LogWarning("NHL API returned no standings entries");
            return;
        }

        var teams = await db.Teams
            .Where(t => t.LeagueId == league.Id)
            .ToDictionaryAsync(t => t.Abbreviation, ct);

        var existing = await db.StandingsSnapshots
            .Where(s => s.SeasonId == season.Id)
            .ToDictionaryAsync(s => s.TeamId, ct);

        // Compute ranks. Tie-breakers throughout: Points → PointsPct → RegulationWins.
        var ranks = ComputeRanks(entries);

        foreach (var (entry, computed) in ranks)
        {
            if (!teams.TryGetValue(entry.TeamAbbreviation, out var team))
            {
                logger.LogWarning("Unknown team in standings: {Abbrev}", entry.TeamAbbreviation);
                continue;
            }

            if (existing.TryGetValue(team.Id, out var snapshot))
            {
                snapshot.Division = entry.Division;
                snapshot.Conference = entry.Conference;
                snapshot.GamesPlayed = entry.GamesPlayed;
                snapshot.Wins = entry.Wins;
                snapshot.Losses = entry.Losses;
                snapshot.OvertimeLosses = entry.OvertimeLosses;
                snapshot.Points = entry.Points;
                snapshot.PointsPct = entry.PointsPct;
                snapshot.RegulationWins = entry.RegulationWins;
                snapshot.RegulationPlusOTWins = entry.RegulationPlusOTWins;
                snapshot.GoalsFor = entry.GoalsFor;
                snapshot.GoalsAgainst = entry.GoalsAgainst;
                snapshot.GoalDifferential = entry.GoalsFor - entry.GoalsAgainst;
                snapshot.PowerPlayPct = entry.PowerPlayPct;
                snapshot.PenaltyKillPct = entry.PenaltyKillPct;
                snapshot.FaceoffPct = entry.FaceoffPct;
                snapshot.DivisionRank = computed.DivisionRank;
                snapshot.ConferenceRank = computed.ConferenceRank;
                snapshot.LeagueRank = computed.LeagueRank;
                snapshot.WildCardRank = computed.WildCardRank;
                snapshot.LastUpdated = DateTimeOffset.UtcNow;
            }
            else
            {
                db.StandingsSnapshots.Add(new StandingsSnapshot
                {
                    TeamId = team.Id,
                    SeasonId = season.Id,
                    Division = entry.Division,
                    Conference = entry.Conference,
                    GamesPlayed = entry.GamesPlayed,
                    Wins = entry.Wins,
                    Losses = entry.Losses,
                    OvertimeLosses = entry.OvertimeLosses,
                    Points = entry.Points,
                    PointsPct = entry.PointsPct,
                    RegulationWins = entry.RegulationWins,
                    RegulationPlusOTWins = entry.RegulationPlusOTWins,
                    GoalsFor = entry.GoalsFor,
                    GoalsAgainst = entry.GoalsAgainst,
                    GoalDifferential = entry.GoalsFor - entry.GoalsAgainst,
                    PowerPlayPct = entry.PowerPlayPct,
                    PenaltyKillPct = entry.PenaltyKillPct,
                    FaceoffPct = entry.FaceoffPct,
                    DivisionRank = computed.DivisionRank,
                    ConferenceRank = computed.ConferenceRank,
                    LeagueRank = computed.LeagueRank,
                    WildCardRank = computed.WildCardRank,
                    LastUpdated = DateTimeOffset.UtcNow
                });
            }
        }

        await db.SaveChangesAsync(ct);

        // Invalidate scores caches that embed standings data (record, rank, pointsPct)
        // and standings caches (one per view).
        var today = HockeyHub.Core.NhlDateHelper.GetCurrentGameDay();
        await cache.RemoveAsync($"scores:{league.Id}:{today:yyyy-MM-dd}", ct);
        await cache.RemoveAsync($"scores:ticker:{league.Id}", ct);
        foreach (var view in new[] { "wildcard", "division", "conference", "league" })
            await cache.RemoveAsync($"standings:{league.Id}:{view}:{season.Id}", ct);

        logger.LogInformation("Synced standings for {Count} teams", ranks.Count);
    }

    private record ComputedRanks(int DivisionRank, int ConferenceRank, int LeagueRank, int? WildCardRank);

    /// <summary>
    /// Computes division, conference, league, and wild card ranks for every team.
    /// Wild card rules (NHL): top 3 in each division qualify automatically; remaining
    /// teams in each conference are ranked by points% — the top 2 are wild card 1 and 2,
    /// the rest are out of playoff position (WildCardRank = null).
    /// Tie-breakers throughout: Points → PointsPct → RegulationWins.
    /// </summary>
    private static List<(NhlStandingsEntry Entry, ComputedRanks Ranks)> ComputeRanks(
        IReadOnlyList<NhlStandingsEntry> entries)
    {
        static IOrderedEnumerable<NhlStandingsEntry> OrderForRank(IEnumerable<NhlStandingsEntry> source) =>
            source
                .OrderByDescending(e => e.Points)
                .ThenByDescending(e => e.PointsPct)
                .ThenByDescending(e => e.RegulationWins);

        var leagueRank = OrderForRank(entries)
            .Select((e, i) => (e.TeamAbbreviation, Rank: i + 1))
            .ToDictionary(x => x.TeamAbbreviation, x => x.Rank);

        var divisionRank = entries
            .GroupBy(e => e.Division)
            .SelectMany(g => OrderForRank(g).Select((e, i) => (e.TeamAbbreviation, Rank: i + 1)))
            .ToDictionary(x => x.TeamAbbreviation, x => x.Rank);

        var conferenceRank = entries
            .GroupBy(e => e.Conference)
            .SelectMany(g => OrderForRank(g).Select((e, i) => (e.TeamAbbreviation, Rank: i + 1)))
            .ToDictionary(x => x.TeamAbbreviation, x => x.Rank);

        // Wild card: within each conference, exclude the top 3 of each division, then
        // rank the remaining teams. Top 2 get WC1/WC2; the rest get null.
        var wildCardRank = new Dictionary<string, int?>();
        foreach (var conf in entries.GroupBy(e => e.Conference))
        {
            var divisionLeaders = conf
                .GroupBy(e => e.Division)
                .SelectMany(g => OrderForRank(g).Take(3))
                .Select(e => e.TeamAbbreviation)
                .ToHashSet();

            var contenders = OrderForRank(conf.Where(e => !divisionLeaders.Contains(e.TeamAbbreviation)))
                .ToList();

            for (var i = 0; i < contenders.Count; i++)
                wildCardRank[contenders[i].TeamAbbreviation] = i < 2 ? i + 1 : null;
        }

        return entries
            .Select(e => (e, new ComputedRanks(
                DivisionRank: divisionRank[e.TeamAbbreviation],
                ConferenceRank: conferenceRank[e.TeamAbbreviation],
                LeagueRank: leagueRank[e.TeamAbbreviation],
                WildCardRank: wildCardRank.GetValueOrDefault(e.TeamAbbreviation))))
            .ToList();
    }
}
