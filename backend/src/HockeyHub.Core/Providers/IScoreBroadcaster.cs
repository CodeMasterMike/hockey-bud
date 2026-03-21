namespace HockeyHub.Core.Providers;

public interface IScoreBroadcaster
{
    Task BroadcastScoreUpdateAsync(int gameId, int homeScore, int awayScore, string status, CancellationToken ct = default);
    Task BroadcastClockSyncAsync(int gameId, int period, int timeRemainingMs, bool clockRunning, CancellationToken ct = default);
}
