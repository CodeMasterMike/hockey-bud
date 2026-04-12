using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Queries;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class DraftController(DraftQueryService draftQuery, HockeyHubDbContext db) : ControllerBase
{
    [HttpGet("leagues/{leagueId}/draft")]
    public async Task<IActionResult> GetDraft(
        string leagueId,
        [FromQuery] int? year = null,
        CancellationToken ct = default)
    {
        var id = await ResolveLeagueId(leagueId, ct);
        if (id is null) return NotFound("League not found");

        var result = await draftQuery.GetDraftAsync(id.Value, year, ct);
        if (result is null) return NotFound("Draft data not available");

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
