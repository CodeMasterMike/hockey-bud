using HockeyHub.Data.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class SearchController(HockeyHubDbContext db) : ControllerBase
{
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string q,
        [FromQuery] int limit = 10,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return BadRequest("Query must be at least 2 characters.");

        var term = q.Trim();
        if (limit is < 1 or > 50) limit = 10;

        var players = await db.Players
            .Where(p => p.IsActive
                && (p.FirstName + " " + p.LastName).Contains(term))
            .Include(p => p.CurrentTeam)
            .OrderBy(p => p.LastName).ThenBy(p => p.FirstName)
            .Take(limit)
            .Select(p => new SearchPlayerDto(
                p.Id,
                p.FirstName,
                p.LastName,
                p.CurrentTeam != null ? p.CurrentTeam.Abbreviation : null,
                p.CurrentTeam != null ? p.CurrentTeam.LogoUrl : null
            ))
            .ToListAsync(ct);

        var teams = await db.Teams
            .Where(t => t.IsActive
                && (t.LocationName.Contains(term)
                    || t.Name.Contains(term)
                    || t.Abbreviation.Contains(term)))
            .OrderBy(t => t.LocationName)
            .Take(limit)
            .Select(t => new SearchTeamDto(
                t.Id,
                t.Abbreviation,
                t.LocationName + " " + t.Name,
                t.LogoUrl
            ))
            .ToListAsync(ct);

        return Ok(new SearchResponse(term, players, teams));
    }
}

public record SearchResponse(
    string Query,
    IReadOnlyList<SearchPlayerDto> Players,
    IReadOnlyList<SearchTeamDto> Teams
);

public record SearchPlayerDto(
    int PlayerId,
    string FirstName,
    string LastName,
    string? TeamAbbreviation,
    string? TeamLogoUrl
);

public record SearchTeamDto(
    int TeamId,
    string Abbreviation,
    string Name,
    string? LogoUrl
);
