using HockeyHub.Core.Providers;
using Microsoft.AspNetCore.SignalR;

namespace HockeyHub.Api.Hubs;

public class SignalRScoreBroadcaster(IHubContext<GameHub> hubContext) : IScoreBroadcaster
{
    public async Task BroadcastScoreUpdateAsync(
        int gameId, int homeScore, int awayScore, string status, CancellationToken ct = default)
    {
        var payload = new { gameId, homeScore, awayScore, status };

        await Task.WhenAll(
            hubContext.Clients.Group("live-games").SendAsync("ReceiveScoreUpdate", payload, ct),
            hubContext.Clients.Group($"game-{gameId}").SendAsync("ReceiveScoreUpdate", payload, ct)
        );
    }

    public async Task BroadcastClockSyncAsync(
        int gameId, int period, int timeRemainingMs, bool clockRunning, CancellationToken ct = default)
    {
        await hubContext.Clients.Group($"game-{gameId}").SendAsync("ReceiveClockSync", new
        {
            gameId,
            period,
            timeRemainingMs,
            clockRunning,
            serverTimestampMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        }, ct);
    }
}
