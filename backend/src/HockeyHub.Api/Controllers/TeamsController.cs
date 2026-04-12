using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Queries;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class TeamsController(TeamsQueryService teamsQuery, HockeyHubDbContext db) : ControllerBase
{
    [HttpGet("leagues/{leagueId}/teams")]
    public async Task<IActionResult> GetTeams(string leagueId, CancellationToken ct = default)
    {
        var id = await ResolveLeagueId(leagueId, ct);
        if (id is null) return NotFound("League not found");

        var result = await teamsQuery.GetTeamsAsync(id.Value, ct);
        return Ok(result);
    }

    [HttpGet("teams/{teamId:int}")]
    public async Task<IActionResult> GetTeamProfile(int teamId, CancellationToken ct = default)
    {
        var result = await teamsQuery.GetTeamProfileAsync(teamId, ct);
        if (result is null) return NotFound("Team not found");
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
