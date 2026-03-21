using HockeyHub.Data.Services.Queries;
using Microsoft.AspNetCore.Mvc;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class ScoresController(ScoresQueryService scoresQuery) : ControllerBase
{
    [HttpGet("leagues/{leagueId}/scores")]
    public async Task<IActionResult> GetScores(
        int leagueId,
        [FromQuery] string? date = null,
        CancellationToken ct = default)
    {
        var gameDate = date is not null
            ? DateOnly.ParseExact(date, "yyyy-MM-dd")
            : DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-8));

        var result = await scoresQuery.GetScoresByDateAsync(leagueId, gameDate, ct);
        return Ok(result);
    }

    [HttpGet("leagues/{leagueId}/scores/{gameId:int}/expanded")]
    public async Task<IActionResult> GetExpanded(
        int leagueId, int gameId, CancellationToken ct = default)
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
        int leagueId, CancellationToken ct = default)
    {
        var result = await scoresQuery.GetTickerAsync(leagueId, ct);
        return Ok(result);
    }

    [HttpGet("leagues/{leagueId}/scores/{gameId:int}/pregame")]
    public async Task<IActionResult> GetPregame(
        int leagueId, int gameId, CancellationToken ct = default)
    {
        var result = await scoresQuery.GetPregameAsync(gameId, ct);
        if (result is null) return NotFound();
        return Ok(result);
    }
}
