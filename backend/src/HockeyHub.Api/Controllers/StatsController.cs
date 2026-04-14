using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Queries;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class StatsController(StatsQueryService statsQuery, HockeyHubDbContext db) : ControllerBase
{
    [HttpGet("leagues/{leagueId}/stats")]
    public async Task<IActionResult> GetStats(
        string leagueId,
        [FromQuery] string section = "all-players",
        [FromQuery] string? sort = null,
        [FromQuery] string sortDir = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (!statsQuery.IsValidSection(section))
            return BadRequest($"Invalid section '{section}'. Allowed: all-players, all-goalies, all-forwards, all-defensemen, rookie-players, rookie-goalies.");

        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 50;

        var id = await ResolveLeagueId(leagueId, ct);
        if (id is null) return NotFound("League not found");

        var result = await statsQuery.GetStatsAsync(id.Value, section, sort, sortDir, page, pageSize, ct);
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
