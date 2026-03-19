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
        var existingAbbrevs = await db.Teams
            .Where(t => t.LeagueId == league.Id)
            .Select(t => t.Abbreviation)
            .ToHashSetAsync(ct);

        var teamsToAdd = nhlTeams
            .Where(t => !existingAbbrevs.Contains(t.Abbreviation))
            .Select(t => new Team
            {
                LeagueId = league.Id,
                LocationName = t.LocationName,
                Name = t.Name,
                Abbreviation = t.Abbreviation,
                LogoUrl = t.LogoUrl,
                PrimaryColor = t.PrimaryColor,
                IsActive = true
            })
            .ToList();

        if (teamsToAdd.Count > 0)
        {
            db.Teams.AddRange(teamsToAdd);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded {Count} teams", teamsToAdd.Count);
        }
    }

    private async Task SeedRostersAsync(CancellationToken ct)
    {
        var teams = await db.Teams.Where(t => t.IsActive).ToListAsync(ct);

        foreach (var team in teams)
        {
            var roster = await nhlProvider.GetRosterAsync(team.Abbreviation, ct);
            var existingExternalIds = await db.Players
                .Where(p => p.CurrentTeamId == team.Id)
                .Select(p => p.ExternalId)
                .ToHashSetAsync(ct);

            var playersToAdd = roster
                .Where(p => !existingExternalIds.Contains(p.Id.ToString()))
                .Select(p => new Player
                {
                    ExternalId = p.Id.ToString(),
                    FirstName = p.FirstName,
                    LastName = p.LastName,
                    DateOfBirth = p.DateOfBirth,
                    BirthCity = p.BirthCity,
                    BirthStateProvince = p.BirthStateProvince,
                    BirthCountry = p.BirthCountry,
                    Height = p.HeightInches,
                    Weight = p.WeightPounds,
                    ShootsCatches = p.ShootsCatches,
                    JerseyNumber = p.JerseyNumber,
                    CurrentTeamId = team.Id,
                    IsActive = p.IsActive,
                    IsEbug = false
                })
                .ToList();

            if (playersToAdd.Count > 0)
            {
                db.Players.AddRange(playersToAdd);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Seeded {Count} players for {Team}", playersToAdd.Count, team.Abbreviation);
            }
        }
    }

    private static string ClassifyEra(int yearEnd) => yearEnd switch
    {
        <= 1972 => "original-six",
        <= 2005 => "expansion",
        _ => "salary-cap"
    };
}
