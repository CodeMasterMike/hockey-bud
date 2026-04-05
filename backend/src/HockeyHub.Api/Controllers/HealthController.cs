using Microsoft.AspNetCore.Mvc;
using HockeyHub.Data.Data;
using StackExchange.Redis;

namespace HockeyHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly HockeyHubDbContext _db;
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<HealthController> _logger;

    public HealthController(HockeyHubDbContext db, ILogger<HealthController> logger, IConnectionMultiplexer? redis = null)
    {
        _db = db;
        _redis = redis;
        _logger = logger;
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
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Database readiness check failed");
            checks["database"] = "unavailable";
        }

        try
        {
            if (_redis is not null)
            {
                await _redis.GetDatabase().PingAsync();
                checks["redis"] = "ok";
            }
            else
            {
                checks["redis"] = "not configured";
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis readiness check failed");
            checks["redis"] = "unavailable";
        }

        var healthy = checks.Values.All(v => v == "ok");
        var result = new { status = healthy ? "healthy" : "degraded", checks };
        return healthy ? Ok(result) : StatusCode(503, result);
    }
}
