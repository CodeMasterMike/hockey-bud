using HockeyHub.Data.Services.Queries;
using Microsoft.AspNetCore.Mvc;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api")]
public class GameHubController(GameHubQueryService gameHubQuery) : ControllerBase
{
    [HttpGet("games/{gameId:int}/hub")]
    public async Task<IActionResult> GetGameHub(int gameId, CancellationToken ct = default)
    {
        var result = await gameHubQuery.GetGameHubAsync(gameId, ct);
        if (result is null) return NotFound("Game not found");
        return Ok(result);
    }
}
