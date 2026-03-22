using HockeyHub.Data.Data;
using HockeyHub.Data.Services.Queries;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class ScoresController(ScoresQueryService scoresQuery, HockeyHubDbContext db) : ControllerBase
{
    [HttpGet("leagues/{leagueId}/scores")]
    public async Task<IActionResult> GetScores(
        string leagueId,
        [FromQuery] string? date = null,
        CancellationToken ct = default)
    {
        var id = await ResolveLeagueId(leagueId, ct);
        if (id is null) return NotFound("League not found");

        DateOnly gameDate;
        if (date is not null)
        {
            if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", out gameDate))
                return BadRequest("Invalid date format. Expected yyyy-MM-dd.");
        }
        else
        {
            gameDate = HockeyHub.Core.NhlDateHelper.GetCurrentGameDay();
        }

        var result = await scoresQuery.GetScoresByDateAsync(id.Value, gameDate, ct);
        return Ok(result);
    }

    [HttpGet("leagues/{leagueId}/scores/{gameId:int}/expanded")]
    public async Task<IActionResult> GetExpanded(
        string leagueId, int gameId, CancellationToken ct = default)
    {
        var result = await scoresQuery.GetExpandedScoreAsync(gameId, ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpGet("scores/live")]
    public async Task<IActionResult> GetLive(CancellationToken ct = default)
    {
        var result = await scoresQuery.GetLiveScoresAsync(ct);
        return Ok(result);
    }

    [HttpGet("leagues/{leagueId}/scores/ticker")]
    public async Task<IActionResult> GetTicker(
        string leagueId, CancellationToken ct = default)
    {
        var id = await ResolveLeagueId(leagueId, ct);
        if (id is null) return NotFound("League not found");

        var result = await scoresQuery.GetTickerAsync(id.Value, ct);
        return Ok(result);
    }

    [HttpGet("leagues/{leagueId}/scores/{gameId:int}/pregame")]
    public async Task<IActionResult> GetPregame(
        string leagueId, int gameId, CancellationToken ct = default)
    {
        var result = await scoresQuery.GetPregameAsync(gameId, ct);
        if (result is null) return NotFound();
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
