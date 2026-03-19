using Microsoft.AspNetCore.SignalR;

namespace HockeyHub.Api.Hubs;

public class GameHub : Hub
{
    public async Task JoinGameGroup(int gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"game-{gameId}");
    }

    public async Task LeaveGameGroup(int gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"game-{gameId}");
    }

    public async Task JoinAllLiveGames()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "live-games");
    }

    public async Task LeaveAllLiveGames()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "live-games");
    }
}
