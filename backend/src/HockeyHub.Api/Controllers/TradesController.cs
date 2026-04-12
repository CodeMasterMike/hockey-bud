using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Queries;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class TradesController(TradesQueryService tradesQuery, HockeyHubDbContext db) : ControllerBase
{
    [HttpGet("leagues/{leagueId}/trades")]
    public async Task<IActionResult> GetTrades(
        string leagueId,
        [FromQuery] int? team = null,
        CancellationToken ct = default)
    {
        var id = await ResolveLeagueId(leagueId, ct);
        if (id is null) return NotFound("League not found");

        var result = await tradesQuery.GetTradesAsync(id.Value, team, ct);
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
