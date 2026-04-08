using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Queries;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class StandingsController(StandingsQueryService standingsQuery, HockeyHubDbContext db) : ControllerBase
{
    private static readonly HashSet<string> AllowedViews = new(StringComparer.OrdinalIgnoreCase)
    {
        "wildcard", "division", "conference", "league"
    };

    [HttpGet("leagues/{leagueId}/standings")]
    public async Task<IActionResult> GetStandings(
        string leagueId,
        [FromQuery] string view = "wildcard",
        CancellationToken ct = default)
    {
        if (!AllowedViews.Contains(view))
            return BadRequest($"Invalid view '{view}'. Allowed: {string.Join(", ", AllowedViews)}.");

        var id = await ResolveLeagueId(leagueId, ct);
        if (id is null) return NotFound("League not found");

        var result = await standingsQuery.GetStandingsAsync(id.Value, view.ToLowerInvariant(), ct);
        if (result is null) return NotFound("No current season found for league");

        return Ok(result);
    }

    private async Task<int?> ResolveLeagueId(string leagueId, CancellationToken ct)
    {
        if (int.TryParse(leagueId, out var numericId))
            return numericId;

        var league = await db.Leagues
            .FirstOrDefaultAsync(l => l.Abbreviation.ToLower() == leagueId.ToLower(), ct);
        return league?.Id;
    }
}
