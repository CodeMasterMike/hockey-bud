using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Queries;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class PlayoffBracketController(PlayoffBracketQueryService bracketQuery, HockeyHubDbContext db) : ControllerBase
{
    [HttpGet("leagues/{leagueId}/playoffs/bracket")]
    public async Task<IActionResult> GetBracket(
        string leagueId,
        [FromQuery] string? conference = null,
        CancellationToken ct = default)
    {
        var id = await ResolveLeagueId(leagueId, ct);
        if (id is null) return NotFound("League not found");

        var result = await bracketQuery.GetBracketAsync(id.Value, conference, ct);
        if (result is null) return NotFound("No playoff bracket available for current season");

        return Ok(result);
    }

    [HttpGet("leagues/{leagueId}/playoffs/matchup/{seriesLetter}")]
    public async Task<IActionResult> GetMatchupDetail(
        string leagueId,
        string seriesLetter,
        CancellationToken ct = default)
    {
        var id = await ResolveLeagueId(leagueId, ct);
        if (id is null) return NotFound("League not found");

        var result = await bracketQuery.GetMatchupAsync(id.Value, seriesLetter, ct);
        if (result is null) return NotFound("Series not found");

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
