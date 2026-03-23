using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HockeyHub.Data.Data;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly HockeyHubDbContext _db;
    private readonly IConfiguration _config;

    public HealthController(HockeyHubDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    /// <summary>
    /// Liveness probe — returns 200 if the process is running.
    /// Used by Container Apps to detect crashed containers.
    /// </summary>
    [HttpGet("live")]
    public IActionResult Live() => Ok(new { status = "alive" });

    /// <summary>
    /// Readiness probe — returns 200 only if the app can reach its dependencies.
    /// Used by Container Apps to gate traffic routing to new revisions.
    /// </summary>
    [HttpGet("ready")]
    public async Task<IActionResult> Ready(CancellationToken ct)
    {
        var checks = new Dictionary<string, string>();

        try
        {
            await _db.Database.CanConnectAsync(ct);
            checks["database"] = "ok";
        }
        catch
        {
            checks["database"] = "unavailable";
        }

        try
        {
            var redisConnString = _config.GetConnectionString("Redis");
            if (!string.IsNullOrEmpty(redisConnString))
            {
                using var redis = await StackExchange.Redis.ConnectionMultiplexer.ConnectAsync(redisConnString);
                await redis.GetDatabase().PingAsync();
                checks["redis"] = "ok";
            }
            else
            {
                checks["redis"] = "not configured";
            }
        }
        catch
        {
            checks["redis"] = "unavailable";
        }

        var healthy = checks.Values.All(v => v == "ok");
        var result = new { status = healthy ? "healthy" : "degraded", checks };
        return healthy ? Ok(result) : StatusCode(503, result);
    }
}
