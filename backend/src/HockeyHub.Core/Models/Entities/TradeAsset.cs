namespace HockeyHub.Core.Models.Entities;

public class TradeAsset
{
    public int Id { get; set; }
    public int TradeId { get; set; }
    public int TeamId { get; set; }
    public required string Direction { get; set; }
    public required string AssetType { get; set; }
    public int? PlayerId { get; set; }
    public string? PlayerName { get; set; }
    public int? DraftPickYear { get; set; }
    public int? DraftPickRound { get; set; }
    public string? Description { get; set; }

    public Trade Trade { get; set; } = null!;
    public Team Team { get; set; } = null!;
}
