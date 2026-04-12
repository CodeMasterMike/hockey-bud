using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Queries;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class ScheduleController(ScheduleQueryService scheduleQuery, HockeyHubDbContext db) : ControllerBase
{
    [HttpGet("leagues/{leagueId}/schedule")]
    public async Task<IActionResult> GetSchedule(
        string leagueId,
        [FromQuery] int? month = null,
        [FromQuery] int? team = null,
        CancellationToken ct = default)
    {
        if (month is < 1 or > 12)
            return BadRequest("Month must be between 1 and 12.");

        var id = await ResolveLeagueId(leagueId, ct);
        if (id is null) return NotFound("League not found");

        var result = await scheduleQuery.GetScheduleAsync(id.Value, month, team, ct);
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
