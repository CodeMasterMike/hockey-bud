using HockeyHub.Core.Models.Entities;
using HockeyHub.Core.Providers;
using HockeyHub.Data.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HockeyHub.Data.Services.Sync;

public class DataSeedService(
    HockeyHubDbContext db,
    INhlDataProvider nhlProvider,
    ILogger<DataSeedService> logger)
{
    public async Task SeedAsync(bool currentOnly = false, CancellationToken ct = default)
    {
        logger.LogInformation("Starting data seed (currentOnly: {CurrentOnly})", currentOnly);

        await SeedLeagueAsync(ct);
        await SeedSeasonsAsync(currentOnly, ct);
        await SeedTeamsAsync(ct);
        await SeedRostersAsync(ct);
        await BackfillDraftDataAsync(ct);

        logger.LogInformation("Data seed complete");
    }

    private async Task SeedLeagueAsync(CancellationToken ct)
    {
        if (await db.Leagues.AnyAsync(ct)) return;

        var nhl = new League
        {
            Name = "National Hockey League",
            Abbreviation = "NHL",
            LogoUrl = "/assets/leagues/nhl.svg",
            IsActive = true
        };

        db.Leagues.Add(nhl);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded NHL league (Id: {Id})", nhl.Id);
    }

    private async Task SeedSeasonsAsync(bool currentOnly, CancellationToken ct)
    {
        var nhlSeasons = await nhlProvider.GetSeasonsAsync(ct);
        var league = await db.Leagues.FirstAsync(l => l.Abbreviation == "NHL", ct);
        var existingYears = await db.Seasons
            .Where(s => s.LeagueId == league.Id)
            .Select(s => s.YearStart)
            .ToHashSetAsync(ct);

        var seasonsToAdd = nhlSeasons
            .Where(s => !existingYears.Contains(s.YearStart))
            .Where(s => !currentOnly || s.IsCurrent)
            .Select(s => new Season
            {
                LeagueId = league.Id,
                YearStart = s.YearStart,
                YearEnd = s.YearEnd,
                Label = s.Label,
                Era = ClassifyEra(s.YearEnd),
                IsCurrent = s.IsCurrent
            })
            .ToList();

        if (seasonsToAdd.Count > 0)
        {
            db.Seasons.AddRange(seasonsToAdd);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded {Count} seasons", seasonsToAdd.Count);
        }

        // Ensure only one current season
        if (nhlSeasons.Any(s => s.IsCurrent))
        {
            var currentSeason = nhlSeasons.First(s => s.IsCurrent);
            var allSeasons = await db.Seasons.Where(s => s.LeagueId == league.Id).ToListAsync(ct);
            foreach (var season in allSeasons)
            {
                season.IsCurrent = season.YearStart == currentSeason.YearStart;
            }
            await db.SaveChangesAsync(ct);
        }
    }

    private async Task SeedTeamsAsync(CancellationToken ct)
    {
        var nhlTeams = await nhlProvider.GetTeamsAsync(ct);
        var league = await db.Leagues.FirstAsync(l => l.Abbreviation == "NHL", ct);
        var existingTeams = await db.Teams
            .Where(t => t.LeagueId == league.Id)
            .ToDictionaryAsync(t => t.Abbreviation, ct);

        var added = 0;
        var updated = 0;
        foreach (var t in nhlTeams)
        {
            FranchiseData.TryGetValue(t.Abbreviation, out var franchise);

            if (existingTeams.TryGetValue(t.Abbreviation, out var existing))
            {
                // Update franchise data on existing teams if missing
                if (franchise.Founded > 0 && existing.OriginalJoinYear == 0)
                {
                    existing.OriginalJoinYear = franchise.Founded;
                    existing.StanleyCupsTotal = franchise.Cups;
                    updated++;
                }
            }
            else
            {
                db.Teams.Add(new Team
                {
                    LeagueId = league.Id,
                    LocationName = t.LocationName,
                    Name = t.Name,
                    Abbreviation = t.Abbreviation,
                    LogoUrl = t.LogoUrl,
                    PrimaryColor = t.PrimaryColor,
                    OriginalJoinYear = franchise.Founded,
                    StanleyCupsTotal = franchise.Cups,
                    IsActive = true
                });
                added++;
            }
        }

        if (added > 0 || updated > 0)
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Teams: {Added} added, {Updated} updated with franchise data", added, updated);
        }
    }

    // Franchise founding years and Stanley Cup totals (historical facts, updated annually)
    private static readonly Dictionary<string, (int Founded, int Cups)> FranchiseData = new()
    {
        ["ANA"] = (1993, 1), ["BOS"] = (1924, 6), ["BUF"] = (1970, 0), ["CGY"] = (1972, 1),
        ["CAR"] = (1972, 1), ["CHI"] = (1926, 6), ["COL"] = (1972, 3), ["CBJ"] = (2000, 0),
        ["DAL"] = (1967, 1), ["DET"] = (1926, 11), ["EDM"] = (1972, 5), ["FLA"] = (1993, 1),
        ["LAK"] = (1967, 2), ["MIN"] = (2000, 0), ["MTL"] = (1909, 24), ["NSH"] = (1998, 0),
        ["NJD"] = (1974, 3), ["NYI"] = (1972, 4), ["NYR"] = (1926, 4), ["OTT"] = (1992, 0),
        ["PHI"] = (1967, 2), ["PIT"] = (1967, 5), ["SJS"] = (1991, 0), ["SEA"] = (2021, 0),
        ["STL"] = (1967, 1), ["TBL"] = (1992, 3), ["TOR"] = (1917, 13), ["UTA"] = (1979, 0),
        ["VAN"] = (1970, 0), ["VGK"] = (2017, 1), ["WSH"] = (1974, 1), ["WPG"] = (1999, 0),
    };

    private async Task SeedRostersAsync(CancellationToken ct)
    {
        var teams = await db.Teams.Where(t => t.IsActive).ToListAsync(ct);
        var teamsByAbbrev = teams.ToDictionary(t => t.Abbreviation);

        foreach (var team in teams)
        {
            var roster = await nhlProvider.GetRosterAsync(team.Abbreviation, ct);
            var existingPlayers = await db.Players
                .Where(p => p.CurrentTeamId == team.Id)
                .ToDictionaryAsync(p => p.ExternalId, ct);

            var added = 0;
            var updated = 0;

            foreach (var p in roster)
            {
                var externalId = p.Id.ToString();
                int? draftTeamId = p.DraftTeamAbbreviation != null
                    && teamsByAbbrev.TryGetValue(p.DraftTeamAbbreviation, out var dt)
                    ? dt.Id : null;

                if (existingPlayers.TryGetValue(externalId, out var existing))
                {
                    // Update draft fields if missing on existing players
                    if (existing.DraftYear is null && p.DraftYear is not null)
                    {
                        existing.DraftYear = p.DraftYear;
                        existing.DraftRound = p.DraftRound;
                        existing.DraftPick = p.DraftPick;
                        existing.DraftTeamId = draftTeamId;
                        updated++;
                    }
                }
                else
                {
                    db.Players.Add(new Player
                    {
                        ExternalId = externalId,
                        FirstName = p.FirstName,
                        LastName = p.LastName,
                        DateOfBirth = p.DateOfBirth,
                        BirthCity = p.BirthCity,
                        BirthStateProvince = p.BirthStateProvince,
                        BirthCountry = p.BirthCountry,
                        Height = p.HeightInches,
                        Weight = p.WeightPounds,
                        ShootsCatches = p.ShootsCatches,
                        Position = p.Position,
                        JerseyNumber = p.JerseyNumber,
                        DraftYear = p.DraftYear,
                        DraftRound = p.DraftRound,
                        DraftPick = p.DraftPick,
                        DraftTeamId = draftTeamId,
                        CurrentTeamId = team.Id,
                        IsActive = p.IsActive,
                        IsEbug = false
                    });
                    added++;
                }
            }

            if (added > 0 || updated > 0)
            {
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Roster {Team}: {Added} added, {Updated} draft fields updated",
                    team.Abbreviation, added, updated);
            }
        }
    }

    private async Task BackfillDraftDataAsync(CancellationToken ct)
    {
        var teamsByAbbrev = await db.Teams
            .Where(t => t.IsActive)
            .ToDictionaryAsync(t => t.Abbreviation, ct);

        var playersWithoutDraft = await db.Players
            .Where(p => p.IsActive && p.DraftYear == null)
            .ToListAsync(ct);

        if (playersWithoutDraft.Count == 0)
        {
            logger.LogInformation("Draft backfill: all players already have draft data");
            return;
        }

        logger.LogInformation("Backfilling draft data for {Count} players via individual lookups",
            playersWithoutDraft.Count);

        var updated = 0;
        foreach (var player in playersWithoutDraft)
        {
            if (!int.TryParse(player.ExternalId, out var externalId)) continue;

            var data = await nhlProvider.GetPlayerAsync(externalId, ct);
            if (data?.DraftYear is not null)
            {
                player.DraftYear = data.DraftYear;
                player.DraftRound = data.DraftRound;
                player.DraftPick = data.DraftPick;
                player.DraftTeamId = data.DraftTeamAbbreviation != null
                    && teamsByAbbrev.TryGetValue(data.DraftTeamAbbreviation, out var draftTeam)
                    ? draftTeam.Id : null;
                updated++;
            }

            // Save in batches of 50 to avoid large transactions
            if (updated > 0 && updated % 50 == 0)
            {
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Draft backfill: {Updated} players updated so far", updated);
            }
        }

        if (updated > 0)
        {
            await db.SaveChangesAsync(ct);
        }

        logger.LogInformation("Draft backfill complete: {Updated} of {Total} players had draft data",
            updated, playersWithoutDraft.Count);
    }

    private static string ClassifyEra(int yearEnd) => yearEnd switch
    {
        <= 1972 => "original-six",
        <= 2005 => "expansion",
        _ => "salary-cap"
    };
}
